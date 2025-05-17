from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid
from ..models.models import UserRole

# Status enums
ApplicationStatus = Literal["In Review", "Approved", "Onboarded", "Production"]
ItemStatus = Literal["Not Started", "In Progress", "Completed", "Verified"]

# ChecklistItem schemas
class ChecklistItemBase(BaseModel):
    description: str
    status: ItemStatus
    comments: Optional[str] = None
    evidence: Optional[str] = None

class ChecklistItemCreate(BaseModel):
    description: str
    status: Optional[str] = 'Not Started'  # Default to 'Not Started'
    comments: Optional[str] = None
    evidence: Optional[str] = None

class ChecklistItemUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[ItemStatus] = None
    comments: Optional[str] = None
    evidence: Optional[str] = None

class ChecklistItem(ChecklistItemBase):
    id: str
    last_updated: datetime
    category_id: str

    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    category_type: Literal["application", "platform"]

class CategoryCreate(CategoryBase):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class CategoryUpdate(BaseModel):
    name: Optional[str] = None

class Category(CategoryBase):
    id: str
    checklist_items: List[ChecklistItem] = []

    class Config:
        from_attributes = True
        # Ensure that checklist_items are included by default and not omitted during serialization
        schema_extra = {
            "example": {
                "id": "some-category-id",
                "name": "Category Name",
                "category_type": "application",
                "checklist_items": [
                    {
                        "id": "item-1",
                        "description": "Item description",
                        "status": "Not Started",
                        "last_updated": "2023-01-01T00:00:00",
                        "category_id": "some-category-id"
                    }
                ]
            }
        }

# Application schemas
class ApplicationBase(BaseModel):
    name: str
    status: ApplicationStatus
    description: Optional[str] = None
    
    # Git Repository Information
    git_repo_link: Optional[str] = None
    prod_branch_name: Optional[str] = None
    is_default_branch: Optional[bool] = None
    default_branch_name: Optional[str] = None
    git_cd_repo_link: Optional[str] = None
    prod_cd_branch_name: Optional[str] = None
    
    # Environment Information
    is_running_dev_pcf: Optional[bool] = None
    dev_env_name: Optional[str] = None
    is_running_sit_pcf: Optional[bool] = None
    sit_env_name: Optional[str] = None
    is_running_uat_pcf: Optional[bool] = None
    uat_env_name: Optional[str] = None
    
    # PCF Information
    dev_pcf_details: Optional[str] = None
    sit_pcf_details: Optional[str] = None
    uat_pcf_details: Optional[str] = None
    additional_nonprod_env: Optional[str] = None
    
    # OCP Information
    target_ocp_env: Optional[str] = None
    
    # Access and App Details
    ad_ent_groups: Optional[str] = None
    test_user: Optional[str] = None
    needs_vanity_url: Optional[bool] = False
    vanity_url_preference: Optional[str] = None
    
    # Integration and Infrastructure
    upstream_downstream_impact: Optional[str] = None
    cmp_link: Optional[str] = None
    pcf_access_steps: Optional[str] = None
    
    # Technical Information
    app_type: Optional[str] = None  # 'Batch', 'UI', 'API'
    uses_bridge_utility: Optional[bool] = None
    technology_stack: Optional[str] = None
    build_pack: Optional[str] = None
    uses_epl: Optional[bool] = None

class ApplicationCreate(ApplicationBase):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None
    
    # Git Repository Information
    git_repo_link: Optional[str] = None
    prod_branch_name: Optional[str] = None
    is_default_branch: Optional[bool] = None
    default_branch_name: Optional[str] = None
    git_cd_repo_link: Optional[str] = None
    prod_cd_branch_name: Optional[str] = None
    
    # Environment Information
    is_running_dev_pcf: Optional[bool] = None
    dev_env_name: Optional[str] = None
    is_running_sit_pcf: Optional[bool] = None
    sit_env_name: Optional[str] = None
    is_running_uat_pcf: Optional[bool] = None
    uat_env_name: Optional[str] = None
    
    # PCF Information
    dev_pcf_details: Optional[str] = None
    sit_pcf_details: Optional[str] = None
    uat_pcf_details: Optional[str] = None
    additional_nonprod_env: Optional[str] = None
    
    # OCP Information
    target_ocp_env: Optional[str] = None
    
    # Access and App Details
    ad_ent_groups: Optional[str] = None
    test_user: Optional[str] = None
    needs_vanity_url: Optional[bool] = None
    vanity_url_preference: Optional[str] = None
    
    # Integration and Infrastructure
    upstream_downstream_impact: Optional[str] = None
    cmp_link: Optional[str] = None
    pcf_access_steps: Optional[str] = None
    
    # Technical Information
    app_type: Optional[str] = None
    uses_bridge_utility: Optional[bool] = None
    technology_stack: Optional[str] = None
    build_pack: Optional[str] = None
    uses_epl: Optional[bool] = None

class Application(ApplicationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    application_categories: List[Category] = []
    platform_categories: List[Category] = []

    class Config:
        from_attributes = True
        # Ensure that nested relationships are included
        schema_extra = {
            "example": {
                "id": "app-1",
                "name": "Sample Application",
                "status": "In Review",
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-02T00:00:00",
                "application_categories": [
                    {
                        "id": "auditability",
                        "name": "Auditability",
                        "category_type": "application",
                        "checklist_items": [
                            {
                                "id": "auditability-item-1",
                                "description": "Log application messages",
                                "status": "Not Started",
                                "last_updated": "2023-01-01T00:00:00",
                                "category_id": "auditability"
                            }
                        ]
                    }
                ],
                "platform_categories": [
                    {
                        "id": "platform-alerting",
                        "name": "Alerting",
                        "category_type": "platform",
                        "checklist_items": [
                            {
                                "id": "platform-alerting-item-1",
                                "description": "All alerting is actionable",
                                "status": "Not Started",
                                "last_updated": "2023-01-01T00:00:00",
                                "category_id": "platform-alerting"
                            }
                        ]
                    }
                ]
            }
        }

# User schemas
class UserBase(BaseModel):
    email: str
    username: str
    role: Optional[UserRole] = UserRole.USER

class UserCreate(UserBase):
    password: str
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class User(UserBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True

# Activity schemas
class ActivityBase(BaseModel):
    action: str
    user_id: str
    application_id: str

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ActivityOut(BaseModel):
    id: str
    action: str
    timestamp: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Dashboard metrics schema
class DashboardMetrics(BaseModel):
    inReview: int
    approved: int
    onboarded: int
    production: int

# Recent activity schema
class RecentActivity(BaseModel):
    id: str
    name: str
    action: str
    timestamp: str

# Integration schemas
class IntegrationConfigBase(BaseModel):
    name: str
    integration_type: str
    description: Optional[str] = None
    base_url: Optional[str] = None
    additional_config: Optional[str] = None
    is_active: Optional[bool] = True

class IntegrationConfigCreate(IntegrationConfigBase):
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class IntegrationConfigUpdate(BaseModel):
    name: Optional[str] = None
    integration_type: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    additional_config: Optional[str] = None
    is_active: Optional[bool] = None

class IntegrationConfig(IntegrationConfigBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Automated Check schemas
class AutomatedCheckBase(BaseModel):
    checklist_item_id: str
    integration_config_id: str
    check_type: str
    check_query: Optional[str] = None
    success_criteria: Optional[str] = None
    is_active: Optional[bool] = True

class AutomatedCheckCreate(AutomatedCheckBase):
    pass

class AutomatedCheckUpdate(BaseModel):
    integration_config_id: Optional[str] = None
    check_type: Optional[str] = None
    check_query: Optional[str] = None
    success_criteria: Optional[str] = None
    is_active: Optional[bool] = None

class AutomatedCheck(AutomatedCheckBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Automated Check Result schemas
class AutomatedCheckResultBase(BaseModel):
    automated_check_id: str
    status: str
    result_value: Optional[str] = None
    result_details: Optional[str] = None
    evidence_url: Optional[str] = None

class AutomatedCheckResultCreate(AutomatedCheckResultBase):
    pass

class AutomatedCheckResult(AutomatedCheckResultBase):
    id: str
    executed_at: datetime
    
    class Config:
        from_attributes = True

# Extended ChecklistItem to include automated checks
class ChecklistItemWithAutomation(ChecklistItem):
    automated_checks: List[AutomatedCheck] = [] 