import json
import os
import logging
from typing import Dict, Any, List, Optional
from uuid import uuid4
from datetime import datetime
import aiohttp
import asyncio
import pocketflow as pf
from sqlalchemy.orm import Session, joinedload

from ..models.validation import (
    ValidationWorkflow, ValidationStep, ValidationStepFinding,
    ValidationStatus, ValidationStepStatus, ValidationStepType, ValidationSeverity
)
from ..models.models import Application, ChecklistItem, Category
from ..schemas.validation import AppValidationRequest

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class WorkflowService:
    """Service for managing application validation workflows with multiple steps."""
    
    @staticmethod
    def initialize_workflow(
        db: Session,
        workflow_id: str,
        application_id: str,
        request_data: Dict[str, Any],
        user_id: str
    ) -> ValidationWorkflow:
        """
        Initialize a new validation workflow
        
        Args:
            db: Database session
            workflow_id: Unique ID for the workflow
            application_id: ID of the application being validated
            request_data: The validation request data
            user_id: ID of the user initiating the validation
            
        Returns:
            ValidationWorkflow: The created workflow
        """
        # Create the workflow record
        workflow = ValidationWorkflow(
            id=workflow_id,
            application_id=application_id,
            status=ValidationStatus.PENDING,
            initiated_by=user_id,
            repository_url=request_data.get('repository_url'),
            commit_id=request_data.get('commit_id'),
            request_data=request_data
        )
        
        db.add(workflow)
        
        # Create step records for each requested validation step
        steps = request_data.get('steps', [step.value for step in ValidationStepType])
        for step_type in steps:
            step = ValidationStep(
                id=str(uuid4()),
                workflow_id=workflow_id,
                step_type=step_type,
                status=ValidationStepStatus.QUEUED
            )
            db.add(step)
        
        db.commit()
        db.refresh(workflow)
        return workflow
    
    @staticmethod
    def get_workflow(db: Session, workflow_id: str) -> Optional[ValidationWorkflow]:
        """
        Get a workflow by ID
        
        Args:
            db: Database session
            workflow_id: ID of the workflow
            
        Returns:
            ValidationWorkflow: The workflow if found, None otherwise
        """
        return db.query(ValidationWorkflow).filter(ValidationWorkflow.id == workflow_id).first()
    
    @staticmethod
    def get_latest_workflow_for_app(db: Session, app_id: str) -> Optional[ValidationWorkflow]:
        """
        Get the latest workflow for an application
        
        Args:
            db: Database session
            app_id: ID of the application
            
        Returns:
            ValidationWorkflow: The most recent workflow if any, None otherwise
        """
        return db.query(ValidationWorkflow)\
            .filter(ValidationWorkflow.application_id == app_id)\
            .order_by(ValidationWorkflow.created_at.desc())\
            .first()
    
    @staticmethod
    async def run_validation_workflow(
        db_session: Session,
        workflow_id: str,
        application: Application,
        validation_request: AppValidationRequest
    ) -> None:
        """
        Run the validation workflow using pocketflow
        
        Args:
            db_session: Database session
            workflow_id: ID of the workflow
            application: The application being validated
            validation_request: The validation request data
        """
        # Update workflow status to in progress
        workflow = db_session.query(ValidationWorkflow).filter(ValidationWorkflow.id == workflow_id).first()
        if not workflow:
            logger.error(f"Workflow {workflow_id} not found")
            return
        
        workflow.status = ValidationStatus.IN_PROGRESS
        db_session.commit()
        
        try:
            # PocketFlow 0.0.2 does not have a full workflow class like 0.3.0
            # We'll manually manage the workflow steps in sequence

            # Get workflow steps based on the request
            steps_to_run = validation_request.steps or [step for step in ValidationStepType]
            
            # Track overall success
            all_steps_successful = True
            
            # Run each step in sequence
            for step_type in steps_to_run:
                # Get the step from database
                step_model = db_session.query(ValidationStep)\
                    .filter(ValidationStep.workflow_id == workflow_id, ValidationStep.step_type == step_type)\
                    .first()
                
                if not step_model:
                    continue
                
                # Execute the step based on its type
                try:
                    if step_type == ValidationStepType.CODE_QUALITY:
                        result = await WorkflowService._run_code_quality_check(
                            step_id=step_model.id,
                            app_id=application.id,
                            app_name=application.name,
                            repository_url=validation_request.repository_url or "",
                            commit_id=validation_request.commit_id
                        )
                    elif step_type == ValidationStepType.SECURITY:
                        result = await WorkflowService._run_security_check(
                            step_id=step_model.id,
                            app_id=application.id,
                            app_name=application.name,
                            repository_url=validation_request.repository_url or "",
                            commit_id=validation_request.commit_id
                        )
                    elif step_type == ValidationStepType.APP_REQUIREMENTS:
                        result = await WorkflowService._validate_app_requirements(
                            step_id=step_model.id,
                            app_id=application.id,
                            app_name=application.name,
                            repository_url=validation_request.repository_url or ""
                        )
                    elif step_type == ValidationStepType.PLATFORM_REQUIREMENTS:
                        result = await WorkflowService._validate_platform_requirements(
                            step_id=step_model.id,
                            app_id=application.id,
                            app_name=application.name
                        )
                    elif step_type == ValidationStepType.EXTERNAL_INTEGRATION:
                        integrations = validation_request.integrations or {}
                        if integrations:
                            result = await WorkflowService._check_external_integrations(
                                step_id=step_model.id,
                                app_id=application.id,
                                integrations=integrations
                            )
                        else:
                            # Skip this step if no integrations are defined
                            step_model.status = ValidationStepStatus.SKIPPED
                            step_model.completed_at = datetime.utcnow()
                            step_model.result_summary = "Skipped - No integrations defined"
                            db_session.commit()
                            result = {"success": True, "message": "Skipped - No integrations defined"}
                    else:
                        # Skip unsupported step types
                        step_model.status = ValidationStepStatus.SKIPPED
                        step_model.completed_at = datetime.utcnow()
                        step_model.result_summary = f"Skipped - Step type {step_type} not implemented"
                        db_session.commit()
                        result = {"success": True, "message": f"Skipped - Step type {step_type} not implemented"}
                    
                    # Update overall success
                    if not result.get("success", False):
                        all_steps_successful = False
                        
                except Exception as e:
                    logger.error(f"Error executing step {step_type}: {str(e)}")
                    step_model.status = ValidationStepStatus.FAILED
                    step_model.completed_at = datetime.utcnow()
                    step_model.error_message = str(e)
                    db_session.commit()
                    all_steps_successful = False
            
            # Update the workflow record
            workflow.status = ValidationStatus.COMPLETED if all_steps_successful else ValidationStatus.FAILED
            workflow.completed_at = datetime.utcnow()
            workflow.overall_compliance = all_steps_successful
            workflow.summary = f"Validation {'passed' if all_steps_successful else 'failed'} for {application.name}"
            
            # Update checklist items based on validation results
            if all_steps_successful:
                WorkflowService._update_checklist_items(db_session, application.id, workflow)
            
            db_session.commit()
            
        except Exception as e:
            logger.error(f"Error running validation workflow: {str(e)}")
            workflow.status = ValidationStatus.FAILED
            workflow.summary = f"Validation failed: {str(e)}"
            db_session.commit()
    
    @staticmethod
    async def _run_code_quality_check(
        step_id: str,
        app_id: str,
        app_name: str,
        repository_url: str,
        commit_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run code quality checks using code analysis tools
        
        Args:
            step_id: Database ID of the step
            app_id: Application ID
            app_name: Application name
            repository_url: Git repository URL
            commit_id: Optional Git commit ID
            
        Returns:
            Dict with the results of the code quality check
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..db.database import SQLALCHEMY_DATABASE_URL
        
        # Create a new database session for this async function
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Update step status to running
            step = db.query(ValidationStep).filter(ValidationStep.id == step_id).first()
            if not step:
                return {"success": False, "message": f"Step {step_id} not found"}
            
            step.status = ValidationStepStatus.RUNNING
            step.started_at = datetime.utcnow()
            db.commit()
            
            # Simulate code quality checks
            # In a real implementation, this would integrate with tools like SonarQube, ESLint, etc.
            await asyncio.sleep(3)  # Simulate analysis time
            
            # Example result data
            result_data = {
                "test_coverage": 85,
                "code_complexity": "medium",
                "linting_issues": 12,
                "security_issues": 3,
                "quality_gate": "passed"
            }
            
            # Create findings
            if result_data["linting_issues"] > 0:
                finding = ValidationStepFinding(
                    id=str(uuid4()),
                    step_id=step_id,
                    description=f"Found {result_data['linting_issues']} linting issues",
                    severity=ValidationSeverity.WARNING,
                    recommendation="Review and fix code style issues"
                )
                db.add(finding)
            
            if result_data["security_issues"] > 0:
                finding = ValidationStepFinding(
                    id=str(uuid4()),
                    step_id=step_id,
                    description=f"Found {result_data['security_issues']} security issues",
                    severity=ValidationSeverity.ERROR,
                    recommendation="Address security vulnerabilities before deployment"
                )
                db.add(finding)
            
            # Update step status to completed
            step.status = ValidationStepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result_summary = f"Code quality analysis completed with {result_data['test_coverage']}% coverage"
            step.details = result_data
            db.commit()
            
            return {
                "success": True,
                "details": result_data,
                "message": f"Code quality check for {app_name} completed"
            }
            
        except Exception as e:
            logger.error(f"Error in code quality check: {str(e)}")
            
            # Update step status to failed
            if 'step' in locals():
                step.status = ValidationStepStatus.FAILED
                step.completed_at = datetime.utcnow()
                step.error_message = str(e)
                db.commit()
            
            return {"success": False, "message": f"Code quality check failed: {str(e)}"}
            
        finally:
            db.close()
    
    @staticmethod
    async def _run_security_check(
        step_id: str,
        app_id: str,
        app_name: str,
        repository_url: str,
        commit_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run security checks using security scanning tools
        
        Args:
            step_id: Database ID of the step
            app_id: Application ID
            app_name: Application name
            repository_url: Git repository URL
            commit_id: Optional Git commit ID
            
        Returns:
            Dict with the results of the security check
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..db.database import SQLALCHEMY_DATABASE_URL
        
        # Create a new database session for this async function
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Update step status to running
            step = db.query(ValidationStep).filter(ValidationStep.id == step_id).first()
            if not step:
                return {"success": False, "message": f"Step {step_id} not found"}
            
            step.status = ValidationStepStatus.RUNNING
            step.started_at = datetime.utcnow()
            db.commit()
            
            # Simulate security checks
            # In a real implementation, this would integrate with tools like OWASP ZAP, SonarQube Security, etc.
            await asyncio.sleep(4)  # Simulate analysis time
            
            # Example result data
            result_data = {
                "vulnerabilities": {
                    "critical": 0,
                    "high": 1,
                    "medium": 3,
                    "low": 8
                },
                "secrets_detected": 0,
                "compliance_issues": 2,
                "overall_risk": "medium"
            }
            
            # Create findings
            if result_data["vulnerabilities"]["high"] > 0:
                finding = ValidationStepFinding(
                    id=str(uuid4()),
                    step_id=step_id,
                    description=f"Found {result_data['vulnerabilities']['high']} high severity vulnerabilities",
                    severity=ValidationSeverity.CRITICAL,
                    recommendation="Address high severity security issues immediately"
                )
                db.add(finding)
            
            if result_data["compliance_issues"] > 0:
                finding = ValidationStepFinding(
                    id=str(uuid4()),
                    step_id=step_id,
                    description=f"Found {result_data['compliance_issues']} compliance issues",
                    severity=ValidationSeverity.WARNING,
                    recommendation="Review compliance requirements and update code accordingly"
                )
                db.add(finding)
            
            # Update step status to completed
            step.status = ValidationStepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result_summary = f"Security analysis completed with {result_data['overall_risk']} risk level"
            step.details = result_data
            db.commit()
            
            return {
                "success": True,
                "details": result_data,
                "message": f"Security check for {app_name} completed"
            }
            
        except Exception as e:
            logger.error(f"Error in security check: {str(e)}")
            
            # Update step status to failed
            if 'step' in locals():
                step.status = ValidationStepStatus.FAILED
                step.completed_at = datetime.utcnow()
                step.error_message = str(e)
                db.commit()
            
            return {"success": False, "message": f"Security check failed: {str(e)}"}
            
        finally:
            db.close()
    
    @staticmethod
    async def _validate_app_requirements(
        step_id: str,
        app_id: str,
        app_name: str,
        repository_url: str
    ) -> Dict[str, Any]:
        """
        Validate application-specific requirements
        
        Args:
            step_id: Database ID of the step
            app_id: Application ID
            app_name: Application name
            repository_url: Git repository URL
            
        Returns:
            Dict with the results of the validation
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..db.database import SQLALCHEMY_DATABASE_URL
        
        # Create a new database session for this async function
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Update step status to running
            step = db.query(ValidationStep).filter(ValidationStep.id == step_id).first()
            if not step:
                return {"success": False, "message": f"Step {step_id} not found"}
            
            step.status = ValidationStepStatus.RUNNING
            step.started_at = datetime.utcnow()
            db.commit()
            
            # Get the application with its categories
            application = db.query(Application).options(
                joinedload(Application.application_categories).joinedload(Category.checklist_items)
            ).filter(Application.id == app_id).first()
            
            if not application:
                return {"success": False, "message": f"Application {app_id} not found"}
                
            # Collect all checklist items from application categories
            checklist_items = []
            for category in application.application_categories:
                for item in category.checklist_items:
                    checklist_items.append(item)
            
            # Log the items found
            logger.info(f"Found {len(checklist_items)} checklist items from {len(application.application_categories)} application categories")
            
            # Validate requirements
            # In a real implementation, this would analyze each requirement against the codebase
            await asyncio.sleep(5)  # Simulate validation time
            
            total_items = len(checklist_items)
            passed_items = 0
            failed_items = 0
            
            for item in checklist_items:
                # Simulate validation logic
                # In a real implementation, this would use AI or other tools to validate each requirement
                # For now, we'll just mark items as passed or failed randomly
                import random
                passed = random.choice([True, True, True, False])  # 75% pass rate for simulation
                
                if passed:
                    passed_items += 1
                    item.status = "Verified"
                    item.evidence = repository_url
                    item.comments = "Automatically verified by validation workflow"
                else:
                    failed_items += 1
                    # Create a finding for the failed item
                    finding = ValidationStepFinding(
                        id=str(uuid4()),
                        step_id=step_id,
                        description=f"Failed to validate requirement: {item.description}",
                        severity=ValidationSeverity.WARNING,
                        recommendation="Review requirement implementation and update code"
                    )
                    db.add(finding)
            
            # Calculate compliance percentage
            compliance_percentage = (passed_items / total_items * 100) if total_items > 0 else 0
            
            # Update step status to completed
            step.status = ValidationStepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result_summary = f"Application requirements validation completed: {passed_items}/{total_items} passed ({compliance_percentage:.1f}%)"
            step.details = {
                "total_items": total_items,
                "passed_items": passed_items,
                "failed_items": failed_items,
                "compliance_percentage": compliance_percentage
            }
            db.commit()
            
            return {
                "success": True,
                "details": {
                    "total_items": total_items,
                    "passed_items": passed_items,
                    "failed_items": failed_items,
                    "compliance_percentage": compliance_percentage
                },
                "message": f"Application requirements validation for {app_name} completed"
            }
            
        except Exception as e:
            logger.error(f"Error in application requirements validation: {str(e)}")
            
            # Update step status to failed
            if 'step' in locals():
                step.status = ValidationStepStatus.FAILED
                step.completed_at = datetime.utcnow()
                step.error_message = str(e)
                db.commit()
            
            return {"success": False, "message": f"Application requirements validation failed: {str(e)}"}
            
        finally:
            db.close()
    
    @staticmethod
    async def _validate_platform_requirements(
        step_id: str,
        app_id: str,
        app_name: str
    ) -> Dict[str, Any]:
        """
        Validate platform requirements
        
        Args:
            step_id: Database ID of the step
            app_id: Application ID
            app_name: Application name
            
        Returns:
            Dict with the results of the validation
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..db.database import SQLALCHEMY_DATABASE_URL
        
        # Create a new database session for this async function
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Update step status to running
            step = db.query(ValidationStep).filter(ValidationStep.id == step_id).first()
            if not step:
                return {"success": False, "message": f"Step {step_id} not found"}
            
            step.status = ValidationStepStatus.RUNNING
            step.started_at = datetime.utcnow()
            db.commit()
            
            # Get the application with its platform categories
            application = db.query(Application).options(
                joinedload(Application.platform_categories).joinedload(Category.checklist_items)
            ).filter(Application.id == app_id).first()
            
            if not application:
                return {"success": False, "message": f"Application {app_id} not found"}
                
            if not application.platform_categories:
                step.status = ValidationStepStatus.SKIPPED
                step.completed_at = datetime.utcnow()
                step.result_summary = "Skipped - No platform categories associated with this application"
                db.commit()
                return {"success": True, "message": "Skipped - No platform categories associated with this application"}
                
            # Collect all checklist items from platform categories
            checklist_items = []
            for category in application.platform_categories:
                for item in category.checklist_items:
                    checklist_items.append(item)
                    
            # Log the items found
            logger.info(f"Found {len(checklist_items)} checklist items from {len(application.platform_categories)} platform categories")
            
            # Validate requirements
            # In a real implementation, this would check platform configurations
            await asyncio.sleep(4)  # Simulate validation time
            
            total_items = len(checklist_items)
            passed_items = 0
            failed_items = 0
            
            for item in checklist_items:
                # Simulate validation logic
                # In a real implementation, this would use external system APIs to validate each requirement
                import random
                passed = random.choice([True, True, False])  # 67% pass rate for simulation
                
                if passed:
                    passed_items += 1
                    item.status = "Verified"
                    item.evidence = f"https://platform-verification/{application.platform_id}"
                    item.comments = "Automatically verified by validation workflow"
                else:
                    failed_items += 1
                    # Create a finding for the failed item
                    finding = ValidationStepFinding(
                        id=str(uuid4()),
                        step_id=step_id,
                        description=f"Failed to validate platform requirement: {item.description}",
                        severity=ValidationSeverity.WARNING,
                        recommendation="Review platform configuration and update as needed"
                    )
                    db.add(finding)
            
            # Calculate compliance percentage
            compliance_percentage = (passed_items / total_items * 100) if total_items > 0 else 0
            
            # Update step status to completed
            step.status = ValidationStepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result_summary = f"Platform requirements validation completed: {passed_items}/{total_items} passed ({compliance_percentage:.1f}%)"
            step.details = {
                "total_items": total_items,
                "passed_items": passed_items,
                "failed_items": failed_items,
                "compliance_percentage": compliance_percentage
            }
            db.commit()
            
            return {
                "success": True,
                "details": {
                    "total_items": total_items,
                    "passed_items": passed_items,
                    "failed_items": failed_items,
                    "compliance_percentage": compliance_percentage
                },
                "message": f"Platform requirements validation for {app_name} completed"
            }
            
        except Exception as e:
            logger.error(f"Error in platform requirements validation: {str(e)}")
            
            # Update step status to failed
            if 'step' in locals():
                step.status = ValidationStepStatus.FAILED
                step.completed_at = datetime.utcnow()
                step.error_message = str(e)
                db.commit()
            
            return {"success": False, "message": f"Platform requirements validation failed: {str(e)}"}
            
        finally:
            db.close()
    
    @staticmethod
    async def _check_external_integrations(
        step_id: str,
        app_id: str,
        integrations: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check external integrations like Jira, AppDynamics, Grafana, etc.
        
        Args:
            step_id: Database ID of the step
            app_id: Application ID
            integrations: Dict of integration configurations
            
        Returns:
            Dict with the results of the integrations check
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..db.database import SQLALCHEMY_DATABASE_URL
        
        # Create a new database session for this async function
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Update step status to running
            step = db.query(ValidationStep).filter(ValidationStep.id == step_id).first()
            if not step:
                return {"success": False, "message": f"Step {step_id} not found"}
            
            step.status = ValidationStepStatus.RUNNING
            step.started_at = datetime.utcnow()
            db.commit()
            
            # Check each integration
            integration_results = {}
            success_count = 0
            failed_count = 0
            
            for integration_name, config in integrations.items():
                try:
                    # Simulate integration check
                    await asyncio.sleep(1)  # Simulate API call time
                    
                    # In a real implementation, this would call the actual APIs:
                    # - Jira API to check for open issues
                    # - AppDynamics API to check for performance metrics
                    # - Grafana API to check for dashboards
                    # - Splunk API to check for logs
                    
                    # Simulate success or failure
                    import random
                    success = random.choice([True, True, True, False])  # 75% success rate for simulation
                    
                    if success:
                        success_count += 1
                        integration_results[integration_name] = {
                            "status": "success",
                            "message": f"Successfully connected to {integration_name}",
                            "details": {
                                "connection": "valid",
                                "auth": "successful"
                            }
                        }
                    else:
                        failed_count += 1
                        integration_results[integration_name] = {
                            "status": "failed",
                            "message": f"Failed to connect to {integration_name}",
                            "details": {
                                "connection": "failed",
                                "auth": "invalid credentials"
                            }
                        }
                        
                        # Create a finding for the failed integration
                        finding = ValidationStepFinding(
                            id=str(uuid4()),
                            step_id=step_id,
                            description=f"Failed to integrate with {integration_name}",
                            severity=ValidationSeverity.ERROR,
                            recommendation=f"Check {integration_name} configuration and credentials"
                        )
                        db.add(finding)
                
                except Exception as e:
                    failed_count += 1
                    integration_results[integration_name] = {
                        "status": "error",
                        "message": f"Error checking {integration_name}: {str(e)}",
                        "details": {
                            "error": str(e)
                        }
                    }
                    
                    # Create a finding for the failed integration
                    finding = ValidationStepFinding(
                        id=str(uuid4()),
                        step_id=step_id,
                        description=f"Error integrating with {integration_name}: {str(e)}",
                        severity=ValidationSeverity.ERROR,
                        recommendation=f"Check {integration_name} configuration and error logs"
                    )
                    db.add(finding)
            
            # Update step status to completed
            success = failed_count == 0
            step.status = ValidationStepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result_summary = f"External integrations check completed: {success_count} successful, {failed_count} failed"
            step.details = integration_results
            db.commit()
            
            return {
                "success": success,
                "details": integration_results,
                "message": f"External integrations check completed: {success_count}/{len(integrations)} successful"
            }
            
        except Exception as e:
            logger.error(f"Error in external integrations check: {str(e)}")
            
            # Update step status to failed
            if 'step' in locals():
                step.status = ValidationStepStatus.FAILED
                step.completed_at = datetime.utcnow()
                step.error_message = str(e)
                db.commit()
            
            return {"success": False, "message": f"External integrations check failed: {str(e)}"}
            
        finally:
            db.close()
    
    @staticmethod
    def _update_checklist_items(db: Session, app_id: str, workflow: ValidationWorkflow) -> None:
        """
        Update checklist items based on validation results
        
        Args:
            db: Database session
            app_id: Application ID
            workflow: The completed workflow
        """
        # Get the application with all its categories and checklist items
        application = db.query(Application).options(
            joinedload(Application.application_categories).joinedload(Category.checklist_items),
            joinedload(Application.platform_categories).joinedload(Category.checklist_items)
        ).filter(Application.id == app_id).first()
        
        if not application:
            logger.error(f"Could not find application {app_id} to update checklist items")
            return
            
        # Get findings from validation steps
        all_findings = []
        for step in workflow.steps:
            # Only consider completed steps
            if step.status != ValidationStepStatus.COMPLETED:
                continue
                
            # Get findings for this step
            step_findings = db.query(ValidationStepFinding).filter(ValidationStepFinding.step_id == step.id).all()
            all_findings.extend(step_findings)
            
        logger.info(f"Found {len(all_findings)} findings from validation workflow {workflow.id}")
        
        # Set evidence URL based on repository
        evidence_url = workflow.repository_url
        if workflow.commit_id:
            evidence_url = f"{evidence_url}/tree/{workflow.commit_id}" if evidence_url else None
        
        # Update app requirement checklist items
        for category in application.application_categories:
            for item in category.checklist_items:
                # Check if this item was marked as failed in any finding
                item_has_issue = any(
                    finding.description.find(item.description) >= 0
                    for finding in all_findings
                )
                
                if item_has_issue:
                    item.status = "In Progress"
                    item.comments = "Validation found issues that need to be addressed"
                elif item.status != "Verified":
                    item.status = "Completed"
                    item.evidence = evidence_url
                    item.comments = f"Verified automatically in validation workflow {workflow.id} at {workflow.completed_at}"
        
        # Update platform requirement checklist items
        for category in application.platform_categories:
            for item in category.checklist_items:
                # Check if this item was marked as failed in any finding
                item_has_issue = any(
                    finding.description.find(item.description) >= 0
                    for finding in all_findings
                )
                
                if item_has_issue:
                    item.status = "In Progress"
                    item.comments = "Validation found issues that need to be addressed"
                elif item.status != "Verified":
                    item.status = "Completed"
                    item.evidence = evidence_url
                    item.comments = f"Verified automatically in validation workflow {workflow.id} at {workflow.completed_at}"
        
        # Log the update and commit changes
        db.commit()
        logger.info(f"Updated checklist items for application {app_id} based on validation results") 