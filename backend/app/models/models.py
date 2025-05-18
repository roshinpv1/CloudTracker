from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Table, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import datetime
from ..db.database import Base
import enum

# Define the user roles as an enum
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"
    USER = "user"

# Association tables for many-to-many relationships
application_category_association = Table(
    'application_category_association',
    Base.metadata,
    Column('application_id', String, ForeignKey('applications.id')),
    Column('category_id', String, ForeignKey('categories.id')),
    Column('category_type', String, nullable=True)  # 'application' or 'platform'
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    
    # Relationships
    activities = relationship("Activity", back_populates="user")

class Platform(Base):
    __tablename__ = "platforms"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    owner = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="platform")
    categories = relationship(
        "Category",
        secondary=application_category_association,
        primaryjoin="and_(Platform.id == Application.platform_id, "
                   "Application.id == application_category_association.c.application_id, "
                   "application_category_association.c.category_type == 'platform')",
        secondaryjoin="Category.id == application_category_association.c.category_id",
        viewonly=True
    )

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String)  # 'In Review', 'Approved', 'Onboarded', 'Production'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    description = Column(Text, nullable=True)
    owner = Column(String, nullable=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=True)
    
    # Repositories and integrations
    repository_url = Column(String, nullable=True)
    commit_id = Column(String, nullable=True)
    jira_project_key = Column(String, nullable=True)
    appdynamics_id = Column(String, nullable=True)
    grafana_dashboard_id = Column(String, nullable=True)
    splunk_index = Column(String, nullable=True)
    
    # Git Repository Information
    git_repo_link = Column(String, nullable=True)
    prod_branch_name = Column(String, nullable=True)
    is_default_branch = Column(Boolean, nullable=True)
    default_branch_name = Column(String, nullable=True)
    git_cd_repo_link = Column(String, nullable=True)
    prod_cd_branch_name = Column(String, nullable=True)
    
    # Environment Information
    is_running_dev_pcf = Column(Boolean, nullable=True)
    dev_env_name = Column(String, nullable=True)
    is_running_sit_pcf = Column(Boolean, nullable=True)
    sit_env_name = Column(String, nullable=True)
    is_running_uat_pcf = Column(Boolean, nullable=True)
    uat_env_name = Column(String, nullable=True)
    
    # PCF Information
    dev_pcf_details = Column(String, nullable=True)
    sit_pcf_details = Column(String, nullable=True)
    uat_pcf_details = Column(String, nullable=True)
    additional_nonprod_env = Column(String, nullable=True)
    
    # OCP Information
    target_ocp_env = Column(String, nullable=True)
    
    # Access and App Details
    ad_ent_groups = Column(String, nullable=True)
    test_user = Column(String, nullable=True)
    needs_vanity_url = Column(Boolean, nullable=True, default=False)
    vanity_url_preference = Column(String, nullable=True)
    
    # Integration and Infrastructure
    upstream_downstream_impact = Column(Text, nullable=True)
    cmp_link = Column(String, nullable=True)
    pcf_access_steps = Column(Text, nullable=True)
    
    # Technical Information
    app_type = Column(String, nullable=True)  # 'Batch', 'UI', 'API'
    uses_bridge_utility = Column(Boolean, nullable=True)
    technology_stack = Column(String, nullable=True)  # 'Java', '.NET', 'Python', 'Angular', 'React'
    build_pack = Column(String, nullable=True)
    uses_epl = Column(Boolean, nullable=True)
    
    # Technology Checklist
    uses_venafi = Column(Boolean, nullable=True, default=False)
    uses_redis = Column(Boolean, nullable=True, default=False)
    uses_channel_secure = Column(Boolean, nullable=True, default=False)
    uses_nas_smb = Column(Boolean, nullable=True, default=False)
    has_nas_credentials = Column(Boolean, nullable=True, default=False)
    uses_smtp = Column(Boolean, nullable=True, default=False)
    uses_autosys = Column(Boolean, nullable=True, default=False)
    uses_batch_operations = Column(Boolean, nullable=True, default=False)
    uses_mtls = Column(Boolean, nullable=True, default=False)
    uses_ndm = Column(Boolean, nullable=True, default=False)
    uses_legacy_jks = Column(Boolean, nullable=True, default=False)
    uses_soap = Column(Boolean, nullable=True, default=False)
    uses_rest_api = Column(Boolean, nullable=True, default=False)
    uses_apigee = Column(Boolean, nullable=True, default=False)
    uses_kafka = Column(Boolean, nullable=True, default=False)
    uses_ibm_mq = Column(Boolean, nullable=True, default=False)
    uses_mq_cipher = Column(Boolean, nullable=True, default=False)
    uses_ldap = Column(Boolean, nullable=True, default=False)
    uses_splunk = Column(Boolean, nullable=True, default=False)
    uses_appd = Column(Boolean, nullable=True, default=False)
    uses_elastic_apm = Column(Boolean, nullable=True, default=False)
    uses_harness_ucd = Column(Boolean, nullable=True, default=False)
    uses_hashicorp_vault = Column(Boolean, nullable=True, default=False)
    secure_properties_location = Column(String, nullable=True)
    uses_hardrock = Column(Boolean, nullable=True, default=False)
    uses_rabbit_mq = Column(Boolean, nullable=True, default=False)
    uses_database = Column(Boolean, nullable=True, default=False)
    uses_mongodb = Column(Boolean, nullable=True, default=False)
    uses_sqlserver = Column(Boolean, nullable=True, default=False)
    uses_mysql = Column(Boolean, nullable=True, default=False)
    uses_postgresql = Column(Boolean, nullable=True, default=False)
    uses_oracle = Column(Boolean, nullable=True, default=False)
    uses_cassandra = Column(Boolean, nullable=True, default=False)
    uses_couchbase = Column(Boolean, nullable=True, default=False)
    uses_neo4j = Column(Boolean, nullable=True, default=False)
    uses_hadoop = Column(Boolean, nullable=True, default=False)
    uses_spark = Column(Boolean, nullable=True, default=False)
    uses_okta = Column(Boolean, nullable=True, default=False)
    uses_saml = Column(Boolean, nullable=True, default=False)
    uses_auth = Column(Boolean, nullable=True, default=False)
    uses_jwt = Column(Boolean, nullable=True, default=False)
    uses_openid = Column(Boolean, nullable=True, default=False)
    uses_adfs = Column(Boolean, nullable=True, default=False)
    uses_san = Column(Boolean, nullable=True, default=False)
    uses_malware_scanner = Column(Boolean, nullable=True, default=False)
    uses_other_services = Column(Boolean, nullable=True, default=False)
    other_services_details = Column(Text, nullable=True)
    has_hardcoded_urls = Column(Boolean, nullable=True, default=False)
    hardcoded_urls_details = Column(Text, nullable=True)
    
    # Relationships
    activities = relationship("Activity", back_populates="application")
    platform = relationship("Platform", back_populates="applications")
    
    # Use primaryjoin to filter by category_type
    application_categories = relationship(
        "Category", 
        secondary=application_category_association,
        primaryjoin="and_(Application.id == application_category_association.c.application_id, "
                   "application_category_association.c.category_type == 'application')",
        secondaryjoin="Category.id == application_category_association.c.category_id",
        backref="applications",
        overlaps="platform_categories",
        lazy='joined',
        cascade_backrefs=False
    )
    
    platform_categories = relationship(
        "Category",
        secondary=application_category_association,
        primaryjoin="and_(Application.id == application_category_association.c.application_id, "
                   "application_category_association.c.category_type == 'platform')",
        secondaryjoin="Category.id == application_category_association.c.category_id",
        backref="platform_applications",
        overlaps="application_categories,applications",
        lazy='joined',
        cascade_backrefs=False
    )

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    category_type = Column(String)  # 'application' or 'platform'
    
    # Relationships - set lazy='joined' to ensure items are eagerly loaded and cascade='all, delete-orphan' for proper deletion
    checklist_items = relationship("ChecklistItem", back_populates="category", lazy='joined', cascade="all, delete-orphan")
    
    # Property to expose checklist_items as items for frontend compatibility
    @property
    def items(self):
        """Return checklist items as an items property for frontend compatibility"""
        return self.checklist_items
        
    def __repr__(self):
        return f"<Category id={self.id} name={self.name} type={self.category_type} items={len(self.checklist_items)}>"

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(String, primary_key=True, index=True)
    description = Column(Text)
    status = Column(String)  # 'Not Started', 'In Progress', 'Completed', 'Verified'
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    comments = Column(Text, nullable=True)
    evidence = Column(String, nullable=True)
    category_id = Column(String, ForeignKey("categories.id", ondelete="CASCADE"))
    requirement_type = Column(String, nullable=True)  # Type of requirement (e.g., security, reliability, performance)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    platform_id = Column(String, ForeignKey("platforms.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="checklist_items")
    application = relationship("Application", backref="checklist_items", foreign_keys=[application_id])
    platform = relationship("Platform", backref="checklist_items", foreign_keys=[platform_id])
    
    # Add a unique constraint to prevent duplicates based on description and category
    __table_args__ = (
        # Create a unique constraint on the combination of description and category_id
        # This will prevent duplicate checklist items with the same description in the same category
        UniqueConstraint('description', 'category_id', name='uix_checklist_item_description_category'),
    )

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    action = Column(String)  # 'updated', 'created', 'status changed', 'reviewed'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"))
    application_id = Column(String, ForeignKey("applications.id"))
    
    # Relationships
    user = relationship("User", back_populates="activities")
    application = relationship("Application", back_populates="activities")

class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    integration_type = Column(String, nullable=False)  # 'github', 'jenkins', 'sonarqube', etc.
    description = Column(Text, nullable=True)
    base_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)
    additional_config = Column(Text, nullable=True)  # JSON string for additional configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AutomatedCheck(Base):
    __tablename__ = "automated_checks"

    id = Column(String, primary_key=True, index=True)
    checklist_item_id = Column(String, ForeignKey("checklist_items.id", ondelete="CASCADE"))
    integration_config_id = Column(String, ForeignKey("integration_configs.id", ondelete="CASCADE"))
    check_type = Column(String, nullable=False)  # Type of check (e.g., 'code_quality', 'test_coverage', 'security')
    check_query = Column(Text, nullable=True)  # Query or path to check in the external system
    success_criteria = Column(String, nullable=True)  # Criteria for success (e.g. '>80%', 'no_errors')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    checklist_item = relationship("ChecklistItem", backref="automated_checks")
    integration_config = relationship("IntegrationConfig", backref="automated_checks")

class AutomatedCheckResult(Base):
    __tablename__ = "automated_check_results"
    
    id = Column(String, primary_key=True, index=True)
    automated_check_id = Column(String, ForeignKey("automated_checks.id", ondelete="CASCADE"))
    status = Column(String, nullable=False)  # 'success', 'failure', 'error'
    result_value = Column(String, nullable=True)  # Actual value from the check
    result_details = Column(Text, nullable=True)  # JSON string with detailed results
    evidence_url = Column(String, nullable=True)  # URL to evidence in the external system
    executed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    automated_check = relationship("AutomatedCheck", backref="results") 