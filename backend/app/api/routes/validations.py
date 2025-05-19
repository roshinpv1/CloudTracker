from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime, timedelta
import json
import pocketflow as pf

from ...db.database import get_db
from ...models.models import ChecklistItem, Application, Platform
from ...models.validation import ValidationRequest as ValidationRequestModel
from ...models.validation import ValidationResult as ValidationResultModel
from ...schemas.validation import (
    ValidationRequest, BatchValidationRequest, ValidationResponse, BatchValidationResponse,
    ValidationResult, ValidationStatus, ValidationSourceType, AppValidationRequest,
    ValidationWorkflowStatus, ValidationStep, ValidationStepStatus
)
from ...core.validation_service import ValidationService
from ...core.workflow_service import WorkflowService
from ...core.auth import (
    get_any_authenticated_user,
    get_reviewer_or_admin_user,
    get_admin_user,
    User
)

router = APIRouter(tags=["validations"])

@router.post("/validations/app/{app_id}", response_model=ValidationResponse)
async def validate_application(
    app_id: str,
    validation_request: AppValidationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Initiate a full application validation workflow including all components."""
    # Check if application exists
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {app_id} not found"
        )
    
    # Create a workflow ID for this validation
    workflow_id = str(uuid4())
    
    # Initialize workflow in the database
    workflow = WorkflowService.initialize_workflow(
        db=db,
        workflow_id=workflow_id,
        application_id=app_id,
        request_data=validation_request.dict(),
        user_id=current_user.id
    )
    
    # Schedule the validation workflow in background
    background_tasks.add_task(
        WorkflowService.run_validation_workflow,
        db_session=db,
        workflow_id=workflow_id,
        application_id=app_id,
        validation_request=validation_request
    )
    
    # Return validation response
    estimated_time = datetime.utcnow() + timedelta(minutes=5)
    return ValidationResponse(
        validation_id=workflow_id,
        status=ValidationStatus.PENDING,
        message="Application validation workflow has been initiated",
        estimated_completion_time=estimated_time
    )

@router.get("/validations/workflow/{workflow_id}", response_model=ValidationWorkflowStatus)
async def get_validation_workflow_status(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get the current status of a validation workflow including all steps."""
    workflow = WorkflowService.get_workflow(db, workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation workflow {workflow_id} not found"
        )
    
    # Convert the SQLAlchemy model to a dictionary that the Pydantic model can validate
    workflow_dict = {
        "id": workflow.id,
        "application_id": workflow.application_id,
        "status": workflow.status,
        "created_at": workflow.created_at,
        "updated_at": workflow.updated_at,
        "completed_at": workflow.completed_at,
        "initiated_by": workflow.initiated_by,
        "repository_url": workflow.repository_url,
        "commit_id": workflow.commit_id,
        "overall_compliance": workflow.overall_compliance,
        "summary": workflow.summary,
        "steps": [
            {
                "id": step.id,
                "workflow_id": step.workflow_id,
                "step_type": step.step_type,
                "status": step.status,
                "started_at": step.started_at,
                "completed_at": step.completed_at,
                "result_summary": step.result_summary,
                "details": step.details,
                "error_message": step.error_message,
                "integration_source": step.integration_source
            } for step in workflow.steps
        ]
    }
    
    return workflow_dict

@router.get("/validations/app/{app_id}/latest", response_model=ValidationWorkflowStatus)
async def get_latest_app_validation(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get the latest validation workflow for an application."""
    latest_workflow = WorkflowService.get_latest_workflow_for_app(db, app_id)
    if not latest_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No validation workflows found for application {app_id}"
        )
    
    # Convert the SQLAlchemy model to a dictionary that the Pydantic model can validate
    workflow_dict = {
        "id": latest_workflow.id,
        "application_id": latest_workflow.application_id,
        "status": latest_workflow.status,
        "created_at": latest_workflow.created_at,
        "updated_at": latest_workflow.updated_at,
        "completed_at": latest_workflow.completed_at,
        "initiated_by": latest_workflow.initiated_by,
        "repository_url": latest_workflow.repository_url,
        "commit_id": latest_workflow.commit_id,
        "overall_compliance": latest_workflow.overall_compliance,
        "summary": latest_workflow.summary,
        "steps": [
            {
                "id": step.id,
                "workflow_id": step.workflow_id,
                "step_type": step.step_type,
                "status": step.status,
                "started_at": step.started_at,
                "completed_at": step.completed_at,
                "result_summary": step.result_summary,
                "details": step.details,
                "error_message": step.error_message,
                "integration_source": step.integration_source
            } for step in latest_workflow.steps
        ]
    }
    
    return workflow_dict

@router.post("/validations/request", response_model=ValidationResponse)
async def request_validation(
    validation_request: ValidationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Request validation for a checklist item."""
    # Check if checklist item exists
    checklist_item = db.query(ChecklistItem).filter(ChecklistItem.id == validation_request.checklist_item_id).first()
    if not checklist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item {validation_request.checklist_item_id} not found"
        )
    
    # Create validation request record
    request_model = ValidationRequestModel(
        id=str(uuid4()),
        checklist_item_id=validation_request.checklist_item_id,
        validation_type=validation_request.validation_type,
        evidence_context=validation_request.evidence_context,
        repository_url=validation_request.repository_url,
        commit_id=validation_request.commit_id,
        additional_context=validation_request.additional_context
    )
    
    db.add(request_model)
    db.commit()
    db.refresh(request_model)
    
    # Schedule validation processing in background
    background_tasks.add_task(
        ValidationService.process_validation_request,
        db_session=db,
        validation_request_model=request_model
    )
    
    # Return validation response
    estimated_time = datetime.utcnow() + timedelta(minutes=1)
    return ValidationResponse(
        validation_id=request_model.id,
        status=ValidationStatus.PENDING,
        message="Validation request has been queued and is being processed",
        estimated_completion_time=estimated_time
    )

@router.post("/validations/batch", response_model=BatchValidationResponse)
async def batch_validation_request(
    batch_request: BatchValidationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Request validation for multiple checklist items in batch."""
    if not batch_request.checklist_item_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No checklist item IDs provided"
        )
    
    # Check if all checklist items exist
    item_ids_set = set(batch_request.checklist_item_ids)
    existing_items = db.query(ChecklistItem).filter(ChecklistItem.id.in_(item_ids_set)).all()
    existing_ids = {item.id for item in existing_items}
    
    missing_ids = item_ids_set - existing_ids
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist items not found: {', '.join(missing_ids)}"
        )
    
    # Create validation request for each item
    request_ids = []
    for item_id in batch_request.checklist_item_ids:
        request_model = ValidationRequestModel(
            id=str(uuid4()),
            checklist_item_id=item_id,
            validation_type=batch_request.validation_type,
            evidence_context=batch_request.evidence_context,
            repository_url=batch_request.repository_url,
            commit_id=batch_request.commit_id,
            additional_context=batch_request.additional_context
        )
        
        db.add(request_model)
        request_ids.append(request_model.id)
        
        # Schedule validation processing in background
        background_tasks.add_task(
            ValidationService.process_validation_request,
            db_session=db,
            validation_request_model=request_model
        )
    
    db.commit()
    
    # Return batch validation response
    estimated_time = datetime.utcnow() + timedelta(minutes=len(batch_request.checklist_item_ids))
    return BatchValidationResponse(
        validation_ids=request_ids,
        status=ValidationStatus.PENDING,
        message=f"Processing {len(request_ids)} validation requests",
        estimated_completion_time=estimated_time
    )

@router.get("/validations/results/{validation_id}", response_model=ValidationResult)
async def get_validation_result(
    validation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get validation result for a specific validation request."""
    result = db.query(ValidationResultModel).filter(ValidationResultModel.validation_request_id == validation_id).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation result for request {validation_id} not found"
        )
    
    return result

@router.get("/validations/checklist-item/{checklist_item_id}", response_model=List[ValidationResult])
async def get_checklist_item_validations(
    checklist_item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get all validation results for a specific checklist item."""
    results = db.query(ValidationResultModel).filter(ValidationResultModel.checklist_item_id == checklist_item_id).all()
    return results

@router.delete("/validations/{validation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_validation(
    validation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a validation request and its results."""
    # First check if the validation request exists
    request = db.query(ValidationRequestModel).filter(ValidationRequestModel.id == validation_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation request {validation_id} not found"
        )
    
    # Delete the request (cascade delete will handle related validation results)
    db.delete(request)
    db.commit()
    return None 