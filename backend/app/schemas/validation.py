from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
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

class BatchValidationRequest(BaseModel):
    checklist_item_ids: List[str]
    validation_type: ValidationType = ValidationType.AI_ASSISTED
    evidence_context: Optional[str] = None
    repository_url: Optional[str] = None
    commit_id: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

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