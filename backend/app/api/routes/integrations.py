from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4

from ...db.database import get_db
from ...models.models import IntegrationConfig, AutomatedCheck, AutomatedCheckResult, ChecklistItem, Category, Application
from ...schemas.schemas import (
    IntegrationConfig as IntegrationConfigSchema,
    IntegrationConfigCreate,
    IntegrationConfigUpdate,
    AutomatedCheck as AutomatedCheckSchema,
    AutomatedCheckCreate,
    AutomatedCheckUpdate,
    AutomatedCheckResult as AutomatedCheckResultSchema
)
from ...core.auth import (
    get_any_authenticated_user,
    get_reviewer_or_admin_user,
    get_admin_user,
    User
)

router = APIRouter(tags=["automations"])

# Integration Configuration Endpoints

@router.get("/integrations", response_model=List[IntegrationConfigSchema])
def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get all integration configurations."""
    integrations = db.query(IntegrationConfig).all()
    return integrations

@router.get("/integrations/{integration_id}", response_model=IntegrationConfigSchema)
def get_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get a specific integration configuration."""
    integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == integration_id).first()
    if integration is None:
        raise HTTPException(status_code=404, detail="Integration configuration not found")
    return integration

@router.post("/integrations", response_model=IntegrationConfigSchema)
def create_integration(
    integration: IntegrationConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new integration configuration."""
    db_integration = IntegrationConfig(
        id=str(uuid4()),
        name=integration.name,
        integration_type=integration.integration_type,
        description=integration.description,
        base_url=integration.base_url,
        api_key=integration.api_key,
        username=integration.username,
        password=integration.password,
        additional_config=integration.additional_config,
        is_active=integration.is_active
    )
    db.add(db_integration)
    db.commit()
    db.refresh(db_integration)
    return db_integration

@router.put("/integrations/{integration_id}", response_model=IntegrationConfigSchema)
def update_integration(
    integration_id: str,
    integration: IntegrationConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update an integration configuration."""
    db_integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == integration_id).first()
    if db_integration is None:
        raise HTTPException(status_code=404, detail="Integration configuration not found")
    
    # Update only the provided fields
    update_data = integration.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_integration, key, value)
    
    db.commit()
    db.refresh(db_integration)
    return db_integration

@router.delete("/integrations/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete an integration configuration."""
    db_integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == integration_id).first()
    if db_integration is None:
        raise HTTPException(status_code=404, detail="Integration configuration not found")
    
    db.delete(db_integration)
    db.commit()
    return None

# Automated Check Endpoints

@router.get("/checks", response_model=List[AutomatedCheckSchema])
def get_checks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user),
    checklist_item_id: Optional[str] = None
):
    """Get all automated checks, optionally filtered by checklist item."""
    query = db.query(AutomatedCheck)
    if checklist_item_id:
        query = query.filter(AutomatedCheck.checklist_item_id == checklist_item_id)
    checks = query.all()
    return checks

@router.get("/checks/{check_id}", response_model=AutomatedCheckSchema)
def get_check(
    check_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get a specific automated check."""
    check = db.query(AutomatedCheck).filter(AutomatedCheck.id == check_id).first()
    if check is None:
        raise HTTPException(status_code=404, detail="Automated check not found")
    return check

@router.post("/checks", response_model=AutomatedCheckSchema)
def create_check(
    check: AutomatedCheckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Create a new automated check."""
    # Verify checklist item exists
    checklist_item = db.query(ChecklistItem).filter(ChecklistItem.id == check.checklist_item_id).first()
    if checklist_item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Verify integration exists
    integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == check.integration_config_id).first()
    if integration is None:
        raise HTTPException(status_code=404, detail="Integration configuration not found")
    
    db_check = AutomatedCheck(
        id=str(uuid4()),
        checklist_item_id=check.checklist_item_id,
        integration_config_id=check.integration_config_id,
        check_type=check.check_type,
        check_query=check.check_query,
        success_criteria=check.success_criteria,
        is_active=check.is_active
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    return db_check

@router.put("/checks/{check_id}", response_model=AutomatedCheckSchema)
def update_check(
    check_id: str,
    check: AutomatedCheckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Update an automated check."""
    db_check = db.query(AutomatedCheck).filter(AutomatedCheck.id == check_id).first()
    if db_check is None:
        raise HTTPException(status_code=404, detail="Automated check not found")
    
    # Update only the provided fields
    update_data = check.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_check, key, value)
    
    db.commit()
    db.refresh(db_check)
    return db_check

@router.delete("/checks/{check_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_check(
    check_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Delete an automated check."""
    db_check = db.query(AutomatedCheck).filter(AutomatedCheck.id == check_id).first()
    if db_check is None:
        raise HTTPException(status_code=404, detail="Automated check not found")
    
    db.delete(db_check)
    db.commit()
    return None

# Check Execution Endpoints

@router.post("/checks/{check_id}/run", response_model=AutomatedCheckResultSchema)
def run_check(
    check_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Run a specific automated check."""
    check = db.query(AutomatedCheck).filter(AutomatedCheck.id == check_id).first()
    if check is None:
        raise HTTPException(status_code=404, detail="Automated check not found")
    
    integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == check.integration_config_id).first()
    
    # Placeholder for actual integration logic
    # In a real implementation, you would call the appropriate integration service here
    # based on the integration_type and check_type
    
    # This is a mock implementation for demonstration
    status = "success"  # or "failure", "error"
    result_value = "85%"
    result_details = '{"passed": true, "details": "All tests passed"}'
    evidence_url = f"{integration.base_url}/evidence/123"
    
    # Create a result record
    result = AutomatedCheckResult(
        id=str(uuid4()),
        automated_check_id=check.id,
        status=status,
        result_value=result_value,
        result_details=result_details,
        evidence_url=evidence_url
    )
    db.add(result)
    
    # If successful, update the checklist item's status
    if status == "success":
        checklist_item = db.query(ChecklistItem).filter(ChecklistItem.id == check.checklist_item_id).first()
        checklist_item.status = "Verified"
        checklist_item.evidence = evidence_url
        checklist_item.comments = f"Automatically verified by {integration.name} integration"
    
    db.commit()
    db.refresh(result)
    return result

@router.get("/checks/{check_id}/results", response_model=List[AutomatedCheckResultSchema])
def get_check_results(
    check_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get all results for a specific automated check."""
    check = db.query(AutomatedCheck).filter(AutomatedCheck.id == check_id).first()
    if check is None:
        raise HTTPException(status_code=404, detail="Automated check not found")
    
    results = db.query(AutomatedCheckResult).filter(AutomatedCheckResult.automated_check_id == check_id).all()
    return results

@router.post("/applications/{application_id}/run-all-checks")
def run_all_checks_for_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Run all automated checks for a specific application."""
    # Verify application exists
    application = db.query(Application).filter(Application.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get all active categories for this application
    app_categories = application.application_categories + application.platform_categories
    
    # Collect all checklist item IDs for these categories
    checklist_item_ids = []
    for category in app_categories:
        for item in category.checklist_items:
            checklist_item_ids.append(item.id)
    
    # Get all active automated checks for these checklist items
    checks = db.query(AutomatedCheck).filter(
        AutomatedCheck.checklist_item_id.in_(checklist_item_ids),
        AutomatedCheck.is_active == True
    ).all()
    
    # Run each check and collect results
    results = []
    for check in checks:
        # This is a simplified mock implementation
        # In a real system, you would likely queue these checks to run asynchronously
        
        integration = db.query(IntegrationConfig).filter(IntegrationConfig.id == check.integration_config_id).first()
        
        # Mock implementation
        status = "success"  # Randomly assign a status for demonstration
        result_value = "85%"
        result_details = '{"passed": true, "details": "All tests passed"}'
        evidence_url = f"{integration.base_url if integration.base_url else ''}/evidence/123"
        
        # Create a result record
        result = AutomatedCheckResult(
            id=str(uuid4()),
            automated_check_id=check.id,
            status=status,
            result_value=result_value,
            result_details=result_details,
            evidence_url=evidence_url
        )
        db.add(result)
        
        # If successful, update the checklist item's status
        if status == "success":
            checklist_item = db.query(ChecklistItem).filter(ChecklistItem.id == check.checklist_item_id).first()
            checklist_item.status = "Verified"
            checklist_item.evidence = evidence_url
            checklist_item.comments = f"Automatically verified by {integration.name} integration"
        
        results.append(result)
    
    db.commit()
    
    return {"message": f"Ran {len(checks)} automated checks for application {application.name}", "success_count": len(results)} 