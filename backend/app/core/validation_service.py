import json
import os
from datetime import datetime, timedelta
import logging
from typing import Dict, Any, List, Optional
from uuid import uuid4
import openai
import traceback

from .validation_prompts import get_validation_prompt
from ..schemas.validation import (
    ValidationRequest, ValidationResult, ValidationFinding,
    ValidationStatus, ValidationSourceType, ValidationSeverity
)
from ..models.validation import ValidationResult as ValidationResultModel
from ..models.validation import ValidationFinding as ValidationFindingModel
from ..models.models import ChecklistItem, Application, Category

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    client = openai.OpenAI(api_key=openai_api_key)
else:
    logger.warning("OPENAI_API_KEY not set. Validation service will not function properly.")
    client = None

class ValidationService:
    @staticmethod
    async def process_validation_request(
        db_session,
        validation_request_model,
        application: Optional[Application] = None
    ) -> ValidationResultModel:
        """
        Process a validation request and store the results
        
        Args:
            db_session: SQLAlchemy database session
            validation_request_model: The validation request DB model
            application: Optional Application model for context
            
        Returns:
            ValidationResultModel: The created validation result DB model
        """
        try:
            # Create initial validation result
            result_model = ValidationResultModel(
                id=str(uuid4()),
                validation_request_id=validation_request_model.id,
                checklist_item_id=validation_request_model.checklist_item_id,
                status=ValidationStatus.IN_PROGRESS,
                validation_type=validation_request_model.validation_type,
                source_type=ValidationSourceType.AI,
                started_at=datetime.utcnow()
            )
            db_session.add(result_model)
            db_session.commit()
            
            # Get checklist item
            checklist_item = db_session.query(ChecklistItem).filter(
                ChecklistItem.id == validation_request_model.checklist_item_id
            ).first()
            
            if not checklist_item:
                logger.error(f"Checklist item {validation_request_model.checklist_item_id} not found")
                result_model.status = ValidationStatus.FAILED
                result_model.summary = "Checklist item not found"
                db_session.commit()
                return result_model
            
            # Get category for context
            category = db_session.query(Category).filter(
                Category.id == checklist_item.category_id
            ).first()
            
            # Set application description
            app_description = ""
            if application:
                app_description = f"{application.name}: {application.description or 'No description available'}"
            
            # Generate validation result using OpenAI
            llm_result = await ValidationService._validate_with_llm(
                checklist_item=checklist_item,
                category=category,
                validation_request=validation_request_model,
                application_description=app_description
            )
            
            # Update validation result with LLM response
            result_model.status = ValidationStatus.COMPLETED
            result_model.is_compliant = llm_result.get("is_compliant", False)
            result_model.summary = llm_result.get("summary", "No summary provided")
            result_model.raw_response = llm_result
            result_model.completion_timestamp = datetime.utcnow()
            
            # Generate evidence URL if available
            evidence_url = validation_request_model.repository_url
            if evidence_url and validation_request_model.commit_id:
                evidence_url = f"{evidence_url}/tree/{validation_request_model.commit_id}"
            result_model.evidence_url = evidence_url
            
            # Create findings
            for finding_data in llm_result.get("findings", []):
                finding_model = ValidationFindingModel(
                    id=str(uuid4()),
                    validation_result_id=result_model.id,
                    description=finding_data.get("description", "No description"),
                    severity=ValidationSeverity(finding_data.get("severity", "info").lower()),
                    code_location=finding_data.get("code_location"),
                    recommendation=finding_data.get("recommendation")
                )
                db_session.add(finding_model)
            
            # Update checklist item if validation passed
            if result_model.is_compliant:
                checklist_item.status = "Verified"
                checklist_item.evidence = evidence_url
                checklist_item.comments = f"Automatically verified: {result_model.summary}"
            
            db_session.commit()
            return result_model
            
        except Exception as e:
            logger.error(f"Error processing validation request: {e}")
            logger.error(traceback.format_exc())
            
            # Update result status to failed
            if 'result_model' in locals():
                result_model.status = ValidationStatus.FAILED
                result_model.summary = f"Validation failed: {str(e)}"
                db_session.commit()
                return result_model
            
            # Create a new failed result if none exists
            result_model = ValidationResultModel(
                id=str(uuid4()),
                validation_request_id=validation_request_model.id,
                checklist_item_id=validation_request_model.checklist_item_id,
                status=ValidationStatus.FAILED,
                validation_type=validation_request_model.validation_type,
                source_type=ValidationSourceType.AI,
                started_at=datetime.utcnow(),
                completion_timestamp=datetime.utcnow(),
                summary=f"Validation failed: {str(e)}"
            )
            db_session.add(result_model)
            db_session.commit()
            return result_model
    
    @staticmethod
    async def _validate_with_llm(
        checklist_item: ChecklistItem,
        category: Optional[Category],
        validation_request,
        application_description: str = ""
    ) -> Dict[str, Any]:
        """
        Validate a checklist item using OpenAI
        
        Args:
            checklist_item: The checklist item to validate
            category: The category of the checklist item
            validation_request: The validation request data
            application_description: Description of the application
            
        Returns:
            Dict[str, Any]: The validation result
        """
        if not client:
            return {
                "is_compliant": False,
                "confidence": "low",
                "summary": "OpenAI API key not configured",
                "detailed_analysis": "Unable to perform validation without OpenAI API key",
                "findings": []
            }
        
        # Get appropriate validation prompt
        category_name = category.name if category else None
        prompt_template = get_validation_prompt(
            category_name=category_name,
            checklist_item_description=checklist_item.description
        )
        
        # Format code snippets
        code_snippets = validation_request.code_snippets or []
        code_snippets_text = "\n\n".join([f"```\n{snippet}\n```" for snippet in code_snippets]) if code_snippets else "No code snippets provided."
        
        # Format prompt with context
        formatted_prompt = prompt_template.format(
            description=checklist_item.description,
            status=checklist_item.status,
            app_description=application_description,
            evidence_context=validation_request.evidence_context or "No additional context provided.",
            repository_url=validation_request.repository_url or "N/A",
            commit_id=validation_request.commit_id or "N/A",
            code_snippets=code_snippets_text
        )
        
        try:
            # Call OpenAI API with formatted prompt
            response = client.chat.completions.create(
                model="gpt-4-turbo",  # Use appropriate model based on your needs
                messages=[{"role": "user", "content": formatted_prompt}],
                temperature=0.2,  # Lower temperature for more deterministic outputs
                response_format={"type": "json_object"}
            )
            
            # Parse response
            result_text = response.choices[0].message.content
            result_json = json.loads(result_text)
            
            # Ensure required fields exist
            return {
                "is_compliant": result_json.get("is_compliant", False),
                "confidence": result_json.get("confidence", "low"),
                "summary": result_json.get("summary", "No summary provided"),
                "detailed_analysis": result_json.get("detailed_analysis", "No detailed analysis provided"),
                "findings": result_json.get("findings", []),
                "evidence": result_json.get("evidence", "No evidence provided")
            }
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            return {
                "is_compliant": False,
                "confidence": "low",
                "summary": f"Error during validation: {str(e)}",
                "detailed_analysis": f"The validation process encountered an error: {str(e)}",
                "findings": []
            } 