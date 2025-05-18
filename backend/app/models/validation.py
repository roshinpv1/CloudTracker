from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Table, Enum, JSON
from sqlalchemy.orm import relationship
import datetime
from ..db.database import Base
import enum
from uuid import uuid4

class ValidationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ValidationType(str, enum.Enum):
    MANUAL = "manual"
    AUTOMATED = "automated"
    AI_ASSISTED = "ai_assisted"

class ValidationSourceType(str, enum.Enum):
    USER = "user"
    EXTERNAL_SYSTEM = "external_system"
    AI = "ai"

class ValidationSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ValidationStepType(str, enum.Enum):
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

class ValidationStepStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class ValidationWorkflow(Base):
    __tablename__ = "validation_workflows"
    
    id = Column(String, primary_key=True, index=True)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"))
    status = Column(Enum(ValidationStatus))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    initiated_by = Column(String, nullable=True)
    repository_url = Column(String, nullable=True)
    commit_id = Column(String, nullable=True)
    request_data = Column(JSON, nullable=True)
    overall_compliance = Column(Boolean, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Relationships
    application = relationship("Application", backref="validation_workflows")
    steps = relationship("ValidationStep", back_populates="workflow", cascade="all, delete-orphan")

class ValidationStep(Base):
    __tablename__ = "validation_steps"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("validation_workflows.id", ondelete="CASCADE"))
    step_type = Column(Enum(ValidationStepType))
    status = Column(Enum(ValidationStepStatus), default=ValidationStepStatus.QUEUED)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result_summary = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    integration_source = Column(String, nullable=True)
    
    # Relationships
    workflow = relationship("ValidationWorkflow", back_populates="steps")
    findings = relationship("ValidationStepFinding", back_populates="step", cascade="all, delete-orphan")

class ValidationStepFinding(Base):
    __tablename__ = "validation_step_findings"
    
    id = Column(String, primary_key=True, index=True)
    step_id = Column(String, ForeignKey("validation_steps.id", ondelete="CASCADE"))
    description = Column(Text)
    severity = Column(Enum(ValidationSeverity))
    code_location = Column(String, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    # Relationships
    step = relationship("ValidationStep", back_populates="findings")

class ValidationRequest(Base):
    __tablename__ = "validation_requests"
    
    id = Column(String, primary_key=True, index=True)
    checklist_item_id = Column(String, ForeignKey("checklist_items.id", ondelete="CASCADE"))
    validation_type = Column(Enum(ValidationType))
    evidence_context = Column(Text, nullable=True)
    repository_url = Column(String, nullable=True)
    commit_id = Column(String, nullable=True)
    additional_context = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    checklist_item = relationship("ChecklistItem", backref="validation_requests")
    validation_result = relationship("ValidationResult", uselist=False, back_populates="validation_request")

class ValidationFinding(Base):
    __tablename__ = "validation_findings"
    
    id = Column(String, primary_key=True, index=True)
    validation_result_id = Column(String, ForeignKey("validation_results.id", ondelete="CASCADE"))
    description = Column(Text)
    severity = Column(Enum(ValidationSeverity))
    code_location = Column(String, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    # Relationships
    validation_result = relationship("ValidationResult", back_populates="findings")

class ValidationResult(Base):
    __tablename__ = "validation_results"
    
    id = Column(String, primary_key=True, index=True)
    validation_request_id = Column(String, ForeignKey("validation_requests.id", ondelete="CASCADE"))
    checklist_item_id = Column(String, ForeignKey("checklist_items.id", ondelete="CASCADE"))
    status = Column(Enum(ValidationStatus))
    is_compliant = Column(Boolean, nullable=True)
    validation_type = Column(Enum(ValidationType))
    source_type = Column(Enum(ValidationSourceType))
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completion_timestamp = Column(DateTime, nullable=True)
    evidence_url = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    raw_response = Column(JSON, nullable=True)
    
    # Relationships
    validation_request = relationship("ValidationRequest", back_populates="validation_result")
    checklist_item = relationship("ChecklistItem", backref="validation_results")
    findings = relationship("ValidationFinding", back_populates="validation_result", cascade="all, delete-orphan") 