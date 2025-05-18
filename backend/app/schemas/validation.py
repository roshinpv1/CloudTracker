from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any, Union
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum

# Validation status and types
class ValidationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ValidationType(str, Enum):
    MANUAL = "manual"
    AUTOMATED = "automated"
    AI_ASSISTED = "ai_assisted"

class ValidationSourceType(str, Enum):
    USER = "user"
    EXTERNAL_SYSTEM = "external_system"
    AI = "ai"

class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ValidationStepType(str, Enum):
    CODE_QUALITY = "code_quality"
    SECURITY = "security"
    PERFORMANCE = "performance"
    DOCUMENTATION = "documentation"
    DEPLOYMENT = "deployment"
    MONITORING = "monitoring"
    LOGGING = "logging"
    EXTERNAL_INTEGRATION = "external_integration"
    APP_REQUIREMENTS = "app_requirements"
    PLATFORM_REQUIREMENTS = "platform_requirements"

class ValidationStepStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

# Validation Request Models
class ValidationRequest(BaseModel):
    checklist_item_id: str
    validation_type: ValidationType = ValidationType.AI_ASSISTED
    evidence_context: Optional[str] = None
    code_snippets: Optional[List[str]] = None
    repository_url: Optional[str] = None
    commit_id: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "checklist_item_id": "item-123",
                "validation_type": "ai_assisted",
                "evidence_context": "The application implements proper error handling for API endpoints",
                "code_snippets": ["try { ... } catch (error) { logger.error(error) }"],
                "repository_url": "https://github.com/org/repo",
                "commit_id": "a1b2c3d4",
                "additional_context": {"requester_comments": "Please verify the error handling"}
            }
        }

class AppValidationRequest(BaseModel):
    """Request for validating an entire application across all requirements."""
    validation_type: ValidationType = ValidationType.AUTOMATED
    repository_url: str
    commit_id: Optional[str] = None
    steps: List[ValidationStepType] = Field(
        default_factory=lambda: [step for step in ValidationStepType]
    )
    integrations: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    additional_context: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "validation_type": "automated",
                "repository_url": "https://github.com/org/repo",
                "commit_id": "a1b2c3d4",
                "steps": ["code_quality", "security", "app_requirements", "platform_requirements"],
                "integrations": {
                    "jira": {"project_key": "APP"},
                    "appdynamics": {"application_id": "12345"},
                    "grafana": {"dashboard_id": "main-dashboard"},
                    "splunk": {"index": "app-logs"}
                },
                "additional_context": {
                    "environment": "production",
                    "team": "cloud-platform"
                }
            }
        }

class BatchValidationRequest(BaseModel):
    checklist_item_ids: List[str]
    validation_type: ValidationType = ValidationType.AI_ASSISTED
    evidence_context: Optional[str] = None
    repository_url: Optional[str] = None
    commit_id: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

# Validation Step Model
class ValidationStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    workflow_id: str
    step_type: ValidationStepType
    status: ValidationStepStatus = ValidationStepStatus.QUEUED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result_summary: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    integration_source: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "step-123",
                "workflow_id": "workflow-456",
                "step_type": "code_quality",
                "status": "completed",
                "started_at": "2023-10-15T14:30:00Z",
                "completed_at": "2023-10-15T14:35:00Z",
                "result_summary": "Code quality check passed with 95% coverage",
                "details": {
                    "test_coverage": 95,
                    "linting_issues": 0,
                    "security_issues": 0
                }
            }
        }

# Validation Result Models
class ValidationFinding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    description: str
    severity: ValidationSeverity = ValidationSeverity.INFO
    code_location: Optional[str] = None
    recommendation: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "finding-123",
                "description": "Missing proper error handling in user authentication",
                "severity": "warning",
                "code_location": "src/auth/login.js:45-50",
                "recommendation": "Implement try-catch blocks and proper error logging"
            }
        }

class ValidationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    checklist_item_id: str
    status: ValidationStatus
    is_compliant: Optional[bool] = None
    validation_type: ValidationType
    source_type: ValidationSourceType = ValidationSourceType.AI
    completion_timestamp: Optional[datetime] = None
    evidence_url: Optional[str] = None
    summary: Optional[str] = None
    findings: List[ValidationFinding] = []
    raw_response: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "val-result-123",
                "checklist_item_id": "item-123",
                "status": "completed",
                "is_compliant": True,
                "validation_type": "ai_assisted",
                "source_type": "ai",
                "completion_timestamp": "2023-10-15T14:30:00Z",
                "evidence_url": "https://example.com/evidence/123",
                "summary": "The code implements proper error handling across all required components",
                "findings": []
            }
        }

class ValidationWorkflowStatus(BaseModel):
    id: str
    application_id: str
    status: ValidationStatus
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    initiated_by: Optional[str] = None
    repository_url: Optional[str] = None
    commit_id: Optional[str] = None
    overall_compliance: Optional[bool] = None
    summary: Optional[str] = None
    steps: List[ValidationStep] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "workflow-123",
                "application_id": "app-456",
                "status": "in_progress",
                "created_at": "2023-10-15T14:25:00Z",
                "updated_at": "2023-10-15T14:35:00Z",
                "initiated_by": "admin@example.com",
                "repository_url": "https://github.com/org/repo",
                "commit_id": "a1b2c3d4",
                "steps": [
                    {
                        "id": "step-789",
                        "workflow_id": "workflow-123",
                        "step_type": "code_quality",
                        "status": "completed",
                        "started_at": "2023-10-15T14:26:00Z",
                        "completed_at": "2023-10-15T14:30:00Z",
                        "result_summary": "Code quality checks passed"
                    },
                    {
                        "id": "step-790",
                        "workflow_id": "workflow-123",
                        "step_type": "security",
                        "status": "running",
                        "started_at": "2023-10-15T14:31:00Z"
                    }
                ]
            }
        }

class ValidationResponse(BaseModel):
    validation_id: str
    status: ValidationStatus
    message: str
    estimated_completion_time: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "validation_id": "val-123",
                "status": "pending",
                "message": "Validation request has been queued",
                "estimated_completion_time": "2023-10-15T14:35:00Z"
            }
        }

class BatchValidationResponse(BaseModel):
    validation_ids: List[str]
    status: ValidationStatus
    message: str
    estimated_completion_time: Optional[datetime] = None 