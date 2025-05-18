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

# Add the following schemas at the end of the file

class LoggingAnalysisResult(BaseModel):
    has_centralized_logging: bool = False
    logging_frameworks: List[str] = []
    has_sensitive_data_protection: bool = False
    has_audit_trail_logging: bool = False
    has_correlation_tracking_ids: bool = False
    has_api_call_logging: bool = False
    consistent_log_levels: bool = False
    has_frontend_error_logging: bool = False
    identified_issues: List[str] = []
    recommendations: List[str] = []
    detected_patterns: Dict[str, List[str]] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "has_centralized_logging": True,
                "logging_frameworks": ["log4j", "slf4j"],
                "has_sensitive_data_protection": True,
                "has_audit_trail_logging": False,
                "has_correlation_tracking_ids": True,
                "has_api_call_logging": True,
                "consistent_log_levels": True,
                "has_frontend_error_logging": False,
                "identified_issues": ["No audit trail logging found", "Potential PII in logs"],
                "recommendations": ["Implement audit logging", "Add PII masking"],
                "detected_patterns": {
                    "logging_statements": ["Logger.info", "console.log"],
                    "mask_patterns": ["maskPII", "maskCardNumber"]
                }
            }
        }

class AvailabilityAnalysisResult(BaseModel):
    has_retry_logic: bool = False
    has_high_availability_config: bool = False
    has_timeout_settings: bool = False
    has_auto_scaling: bool = False
    has_throttling: bool = False
    has_circuit_breakers: bool = False
    identified_issues: List[str] = []
    recommendations: List[str] = []
    detected_patterns: Dict[str, List[str]] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "has_retry_logic": True,
                "has_high_availability_config": False,
                "has_timeout_settings": True,
                "has_auto_scaling": False,
                "has_throttling": True,
                "has_circuit_breakers": True,
                "identified_issues": ["No high availability config found"],
                "recommendations": ["Implement Kubernetes readiness probes"],
                "detected_patterns": {
                    "retry_patterns": ["retryWhen", "maxRetries"],
                    "timeout_patterns": ["connectionTimeout", "readTimeout"]
                }
            }
        }

class ErrorHandlingAnalysisResult(BaseModel):
    has_backend_error_handling: bool = False
    has_standard_http_codes: bool = False
    has_client_error_handling: bool = False
    has_error_documentation: bool = False
    identified_issues: List[str] = []
    recommendations: List[str] = []
    detected_patterns: Dict[str, List[str]] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "has_backend_error_handling": True,
                "has_standard_http_codes": True,
                "has_client_error_handling": False,
                "has_error_documentation": False,
                "identified_issues": ["Client-side error handling missing"],
                "recommendations": ["Implement error state management"],
                "detected_patterns": {
                    "error_handling": ["try/catch", "logger.error"],
                    "http_codes": ["status(404)", "status(500)"]
                }
            }
        }

class CodeFileInfo(BaseModel):
    path: str
    language: str
    size_bytes: int
    is_test_file: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "path": "src/main/java/com/example/Controller.java",
                "language": "java",
                "size_bytes": 5120,
                "is_test_file": False
            }
        }

class CodeQualityAnalysisResult(BaseModel):
    """Schema for structured LLM code quality analysis results"""
    repository_url: str
    project_name: str
    analysis_id: str = Field(default_factory=lambda: str(uuid4()))
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    file_count: int
    test_file_count: int
    file_types: Dict[str, int] = {}
    analyzed_files: List[CodeFileInfo] = []
    
    logging_analysis: LoggingAnalysisResult
    availability_analysis: AvailabilityAnalysisResult
    error_handling_analysis: ErrorHandlingAnalysisResult
    
    overall_quality_score: int = 0  # 0-100 score
    summary: str = ""
    executive_summary: str = ""
    
    class Config:
        schema_extra = {
            "example": {
                "repository_url": "https://github.com/example/repo",
                "project_name": "example-service",
                "analysis_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
                "analysis_timestamp": "2023-08-15T14:30:00Z",
                "file_count": 120,
                "test_file_count": 35,
                "file_types": {"java": 45, "xml": 12, "properties": 8},
                "overall_quality_score": 78,
                "summary": "The codebase demonstrates good practices in error handling...",
                "executive_summary": "This application meets most quality requirements but needs improvements in..."
            }
        } 