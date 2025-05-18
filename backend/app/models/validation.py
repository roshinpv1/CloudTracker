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