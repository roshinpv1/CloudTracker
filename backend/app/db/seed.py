import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
import random

from ..models.models import User, Application, Category, ChecklistItem, Activity, UserRole
from ..core.auth import get_password_hash

def create_application_checklist_items(db: Session, category_id: str):
    base_items = {
        'auditability': [
            'Logs are searchable and available',
            'Avoid logging confidential data',
            'Create audit trail logs',
            'Implement tracking ID for log messages',
            'Log REST API calls',
            'Log application messages',
            'Client UI errors are logged'
        ],
        'availability': [
            'Retry Logic',
            'Set timeouts on IO operation',
            'Auto scale',
            'Throttling, drop request',
            'Set circuit breakers on outgoing requests'
        ],
        'error-handling': [
            'Log system errors',
            'Use HTTP standard error codes',
            'Include Client error tracking'
        ],
        'testing': [
            'Automated Regression Testing'
        ]
    }
    
    items = base_items.get(category_id, [])
    for index, description in enumerate(items):
        status_options = ['Not Started', 'In Progress', 'Completed', 'Verified']
        days_ago = random.randint(0, 30)
        last_updated = datetime.utcnow() - timedelta(days=days_ago)
        
        item = ChecklistItem(
            id=f"{category_id}-item-{index}",
            description=description,
            status='Not Started',  # Default is 'Not Started' for seed data
            last_updated=last_updated,
            comments=f"Comment for {description}" if random.random() > 0.7 else "",
            evidence=f"https://example.com/evidence/{category_id}/{index}" if random.random() > 0.6 else "",
            category_id=category_id
        )
        db.add(item)

def create_platform_checklist_items(db: Session, category_id: str):
    base_items = {
        'platform-alerting': [
            'All alerting is actionable'
        ],
        'platform-availability': [
            'Automated failovers'
        ],
        'platform-monitoring-infra': [
            'Monitor CPU utilization'
        ],
        'platform-monitoring-app': [
            'Monitoring application process',
            'Monitor port availability',
            'URL monitoring',
            'Monitor application heap memory usage',
            'Application CPU Utilization',
            'Monitor Golden'
        ],
        'platform-recoverability': [
            'Demonstrate recovery strategy'
        ]
    }
    
    items = base_items.get(category_id, [])
    for index, description in enumerate(items):
        status_options = ['Not Started', 'In Progress', 'Completed', 'Verified']
        days_ago = random.randint(0, 30)
        last_updated = datetime.utcnow() - timedelta(days=days_ago)
        
        item = ChecklistItem(
            id=f"{category_id}-item-{index}",
            description=description,
            status='Not Started',  # Default is 'Not Started' for seed data
            last_updated=last_updated,
            comments=f"Comment for {description}" if random.random() > 0.7 else "",
            evidence=f"https://example.com/evidence/{category_id}/{index}" if random.random() > 0.6 else "",
            category_id=category_id
        )
        db.add(item)

def create_application_categories(db: Session):
    categories = [
        {
            'id': 'auditability',
            'name': 'Auditability',
            'category_type': 'application'
        },
        {
            'id': 'availability',
            'name': 'Availability',
            'category_type': 'application'
        },
        {
            'id': 'error-handling',
            'name': 'Error Handling',
            'category_type': 'application'
        },
        {
            'id': 'testing',
            'name': 'DC.Testing',
            'category_type': 'application'
        }
    ]
    
    for category_data in categories:
        category = Category(
            id=category_data['id'],
            name=category_data['name'],
            category_type=category_data['category_type']
        )
        db.add(category)
        db.flush()
        create_application_checklist_items(db, category.id)
    
    return categories

def create_platform_categories(db: Session):
    categories = [
        {
            'id': 'platform-alerting',
            'name': 'Alerting',
            'category_type': 'platform'
        },
        {
            'id': 'platform-availability',
            'name': 'Availability',
            'category_type': 'platform'
        },
        {
            'id': 'platform-monitoring-infra',
            'name': 'Monitoring Infra',
            'category_type': 'platform'
        },
        {
            'id': 'platform-monitoring-app',
            'name': 'Monitoring App',
            'category_type': 'platform'
        },
        {
            'id': 'platform-recoverability',
            'name': 'Recoverability',
            'category_type': 'platform'
        }
    ]
    
    for category_data in categories:
        category = Category(
            id=category_data['id'],
            name=category_data['name'],
            category_type=category_data['category_type']
        )
        db.add(category)
        db.flush()
        create_platform_checklist_items(db, category.id)
    
    return categories

def seed_db(db: Session):
    # Create three users with different roles
    # Fixed pre-hashed password
    hashed_password = "$2b$12$FD8yLAW71jJiJJ2TzekP3.J33J/8ptMR6CDqTtLcpeM0rLqMjTixG"  # "password123"
    
    # Check if users already exist
    admin_exists = db.query(User).filter(User.username == "admin").first()
    if not admin_exists:
        print("Creating admin user...")
        # Admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            username="admin",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        
        # Reviewer user
        reviewer_user = User(
            id=str(uuid.uuid4()),
            email="reviewer@example.com",
            username="reviewer",
            hashed_password=hashed_password,
            role=UserRole.REVIEWER,
            is_active=True
        )
        db.add(reviewer_user)
        
        # Regular user
        regular_user = User(
            id=str(uuid.uuid4()),
            email="user@example.com",
            username="user",
            hashed_password=hashed_password,
            role=UserRole.USER,
            is_active=True
        )
        db.add(regular_user)
        
        db.commit()
        print("Users created successfully!")
    
    # Create application and platform categories
    app_categories = create_application_categories(db)
    platform_categories = create_platform_categories(db)
    
    # Create applications
    statuses = ['In Review', 'Approved', 'Onboarded', 'Production']
    ocp_envs = ['Sterling', 'Lewisville', 'Manassas']
    app_types = ['Batch', 'UI', 'API']
    tech_stacks = ['Java', '.NET', 'Python', 'Angular', 'React']
    build_packs = ['Gradle', 'Maven', 'NPM', 'Pip']
    
    for i in range(1, 21):
        days_ago = random.randint(30, 90)
        created_at = datetime.utcnow() - timedelta(days=days_ago)
        updated_days_ago = random.randint(0, 30)
        updated_at = datetime.utcnow() - timedelta(days=updated_days_ago)
        
        # Generate random boolean values
        is_default_branch = random.choice([True, False])
        is_running_dev_pcf = random.choice([True, False])
        is_running_sit_pcf = random.choice([True, False])
        is_running_uat_pcf = random.choice([True, False])
        needs_vanity_url = random.choice([True, False])
        uses_bridge_utility = random.choice([True, False])
        uses_epl = random.choice([True, False])
        
        app = Application(
            id=f"app-{i}",
            name=f"Application {i}",
            status=random.choice(statuses),
            created_at=created_at,
            updated_at=updated_at,
            description=f"Description for Application {i}",
            
            # Git Repository Information
            git_repo_link=f"https://github.com/example/app-{i}",
            prod_branch_name=f"production-{i}",
            is_default_branch=is_default_branch,
            default_branch_name="main" if is_default_branch else f"develop-{i}",
            git_cd_repo_link=f"https://github.com/example/app-{i}-cd",
            prod_cd_branch_name=f"cd-production-{i}",
            
            # Environment Information
            is_running_dev_pcf=is_running_dev_pcf,
            dev_env_name=f"dev-env-{i}" if is_running_dev_pcf else None,
            is_running_sit_pcf=is_running_sit_pcf,
            sit_env_name=f"sit-env-{i}" if is_running_sit_pcf else None,
            is_running_uat_pcf=is_running_uat_pcf,
            uat_env_name=f"uat-env-{i}" if is_running_uat_pcf else None,
            
            # PCF Information
            dev_pcf_details=f"Dev PCF Foundation/Org/Space {i}" if is_running_dev_pcf else None,
            sit_pcf_details=f"SIT PCF Foundation/Org/Space {i}" if is_running_sit_pcf else None,
            uat_pcf_details=f"UAT PCF Foundation/Org/Space {i}" if is_running_uat_pcf else None,
            additional_nonprod_env="QA, PerfTest" if random.choice([True, False]) else None,
            
            # OCP Information
            target_ocp_env=random.choice(ocp_envs),
            
            # Access and App Details
            ad_ent_groups=f"AD-ENT-GROUP-{i}, AD-ENT-SPLUNK-{i}",
            test_user=f"testuser{i}@example.com" if random.choice([True, False]) else None,
            needs_vanity_url=needs_vanity_url,
            vanity_url_preference=f"app{i}.example.com" if needs_vanity_url else None,
            
            # Integration and Infrastructure
            upstream_downstream_impact=f"Upstream apps: App{i-1}, App{i-2}. Downstream apps: App{i+1}, App{i+2}." if i > 2 else "No dependencies.",
            cmp_link=f"https://cmp.example.com/app{i}",
            pcf_access_steps=f"1. Request access via ServiceNow\n2. Approvals needed from Team Lead\n3. Access granted within 24 hours",
            
            # Technical Information
            app_type=random.choice(app_types),
            uses_bridge_utility=uses_bridge_utility,
            technology_stack=random.choice(tech_stacks),
            build_pack=random.choice(build_packs),
            uses_epl=uses_epl
        )
        db.add(app)
        db.flush()
        
        # Assign random categories with proper category_type
        for app_category in random.sample(app_categories, k=2):
            # We need to manually execute SQL to set the category_type in the join table
            db.execute(
                text("INSERT INTO application_category_association (application_id, category_id, category_type) VALUES (:app_id, :cat_id, 'application')"),
                {"app_id": app.id, "cat_id": app_category['id']}
            )
            
        for platform_category in random.sample(platform_categories, k=2):
            # We need to manually execute SQL to set the category_type in the join table
            db.execute(
                text("INSERT INTO application_category_association (application_id, category_id, category_type) VALUES (:app_id, :cat_id, 'platform')"),
                {"app_id": app.id, "cat_id": platform_category['id']}
            )
        
        # Create activities for this application
        action_types = ['updated', 'created', 'status changed', 'reviewed']
        for j in range(3):  # 3 activities per application
            days_ago = random.randint(0, 30)
            timestamp = datetime.utcnow() - timedelta(days=days_ago)
            
            activity = Activity(
                id=str(uuid.uuid4()),
                action=random.choice(action_types),
                timestamp=timestamp,
                user_id=admin_user.id,
                application_id=app.id
            )
            db.add(activity)
    
    db.commit()
    
    print("Database seeded successfully!") 