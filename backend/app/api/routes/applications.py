from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
from sqlalchemy import text

from ...db.database import get_db
from ...models.models import Application, Activity, Category, User, ChecklistItem
from ...schemas.schemas import (
    Application as ApplicationSchema,
    ApplicationCreate,
    ApplicationUpdate
)
from ...core.auth import (
    get_any_authenticated_user,
    get_reviewer_or_admin_user,
    get_admin_user
)

router = APIRouter(tags=["applications"])

# Helper function to deduplicate checklist items
def deduplicate_checklist_items(categories):
    """
    Deduplicate checklist items within categories based on description.
    For items with the same description, keep the one with the most recent last_updated date.
    """
    for category in categories:
        # Create a dictionary to track unique descriptions
        unique_items = {}
        for item in category.checklist_items:
            # If we haven't seen this description before or this item has later updates, keep it
            if item.description not in unique_items or item.last_updated > unique_items[item.description].last_updated:
                unique_items[item.description] = item
        
        # Replace the items list with the deduplicated list
        category.checklist_items = list(unique_items.values())
    
    return categories

# All authenticated users can view applications
@router.get("", response_model=List[ApplicationSchema])
def get_applications(db: Session = Depends(get_db), current_user: User = Depends(get_any_authenticated_user)):
    print("Getting all applications with nested relationships loaded")
    
    # Use explicit joins to load all nested relationships for all applications
    applications = db.query(Application).options(
        joinedload(Application.application_categories).joinedload(Category.checklist_items),
        joinedload(Application.platform_categories).joinedload(Category.checklist_items)
    ).all()
    
    # Deduplicate checklist items for each application
    for application in applications:
        # Deduplicate application categories
        application.application_categories = deduplicate_checklist_items(application.application_categories)
        
        # Deduplicate platform categories
        application.platform_categories = deduplicate_checklist_items(application.platform_categories)
    
    print(f"Loaded and deduplicated {len(applications)} applications")
    
    # Convert SQLAlchemy models to dictionaries before returning
    # This ensures proper serialization of nested relationships
    app_dicts = []
    for app in applications:
        app_dict = {c.name: getattr(app, c.name) for c in app.__table__.columns}
        # Use the field names expected by the frontend
        app_dict['applicationCategories'] = [
            {
                'id': cat.id,
                'name': cat.name,
                'category_type': cat.category_type,
                'items': [
                    {
                        'id': item.id,
                        'description': item.description,
                        'status': item.status,
                        'last_updated': item.last_updated,
                        'comments': item.comments,
                        'evidence': item.evidence,
                        'category_id': item.category_id
                    } for item in cat.checklist_items
                ]
            } for cat in app.application_categories
        ]
        app_dict['platformCategories'] = [
            {
                'id': cat.id,
                'name': cat.name,
                'category_type': cat.category_type,
                'items': [
                    {
                        'id': item.id,
                        'description': item.description,
                        'status': item.status,
                        'last_updated': item.last_updated,
                        'comments': item.comments,
                        'evidence': item.evidence,
                        'category_id': item.category_id
                    } for item in cat.checklist_items
                ]
            } for cat in app.platform_categories
        ]
        # Remove old field names that would conflict with the frontend
        if 'application_categories' in app_dict:
            del app_dict['application_categories']
        if 'platform_categories' in app_dict:
            del app_dict['platform_categories']
        app_dicts.append(app_dict)
    
    return app_dicts

# All authenticated users can get a specific application
@router.get("/{application_id}", response_model=ApplicationSchema)
def get_application(
    application_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    print(f"Getting application with ID: {application_id}")
    
    # Use a more complex query with explicit joins to load all the nested relationships
    application = db.query(Application).options(
        joinedload(Application.application_categories).joinedload(Category.checklist_items),
        joinedload(Application.platform_categories).joinedload(Category.checklist_items)
    ).filter(Application.id == application_id).first()
    
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Deduplicate checklist items
    application.application_categories = deduplicate_checklist_items(application.application_categories)
    application.platform_categories = deduplicate_checklist_items(application.platform_categories)
    
    # Log the deduplicated counts
    for category in application.application_categories:
        print(f"Deduplicated checklist items for application category {category.id}: {len(category.checklist_items)} items")
    
    for category in application.platform_categories:
        print(f"Deduplicated checklist items for platform category {category.id}: {len(category.checklist_items)} items")
    
    # Convert SQLAlchemy model to dictionary before returning
    app_dict = {c.name: getattr(application, c.name) for c in application.__table__.columns}
    # Use the field names expected by the frontend
    app_dict['applicationCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in application.application_categories
    ]
    app_dict['platformCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in application.platform_categories
    ]
    
    # Debugging serialization
    print(f"Serialized applicationCategories: {len(app_dict['applicationCategories'])}")
    for cat in app_dict['applicationCategories']:
        print(f"  Category {cat['id']}: {len(cat['items'])} items")
        
    print(f"Serialized platformCategories: {len(app_dict['platformCategories'])}")
    for cat in app_dict['platformCategories']:
        print(f"  Category {cat['id']}: {len(cat['items'])} items")
    
    # Remove old field names that would conflict with the frontend
    if 'application_categories' in app_dict:
        del app_dict['application_categories']
    if 'platform_categories' in app_dict:
        del app_dict['platform_categories']
    
    return app_dict

# All authenticated users can create a new application
@router.post("", response_model=ApplicationSchema)
def create_application(
    application: ApplicationCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Create a new application with all required categories and checklist items."""
    
    # Step 1: Create the application
    db_application = Application(
        id=application.id or str(uuid4()),
        name=application.name,
        status=application.status,
        description=application.description,
        git_repo_link=application.git_repo_link,
        prod_branch_name=application.prod_branch_name,
        is_default_branch=application.is_default_branch,
        default_branch_name=application.default_branch_name,
        git_cd_repo_link=application.git_cd_repo_link,
        prod_cd_branch_name=application.prod_cd_branch_name,
        is_running_dev_pcf=application.is_running_dev_pcf,
        dev_env_name=application.dev_env_name,
        is_running_sit_pcf=application.is_running_sit_pcf,
        sit_env_name=application.sit_env_name,
        is_running_uat_pcf=application.is_running_uat_pcf,
        uat_env_name=application.uat_env_name,
        dev_pcf_details=application.dev_pcf_details,
        sit_pcf_details=application.sit_pcf_details,
        uat_pcf_details=application.uat_pcf_details,
        additional_nonprod_env=application.additional_nonprod_env,
        target_ocp_env=application.target_ocp_env,
        ad_ent_groups=application.ad_ent_groups,
        test_user=application.test_user,
        needs_vanity_url=application.needs_vanity_url,
        vanity_url_preference=application.vanity_url_preference,
        upstream_downstream_impact=application.upstream_downstream_impact,
        cmp_link=application.cmp_link,
        pcf_access_steps=application.pcf_access_steps,
        app_type=application.app_type,
        uses_bridge_utility=application.uses_bridge_utility,
        technology_stack=application.technology_stack,
        build_pack=application.build_pack,
        uses_epl=application.uses_epl
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    print(f"Created application: {db_application.name} (id: {db_application.id})")
    
    # Step 2: Define the default items for categories
    application_default_items = {
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
    
    platform_default_items = {
        'alerting': [
            'All alerting is actionable'
        ],
        'availability': [
            'Automated failovers'
        ],
        'monitoring-infra': [
            'Monitor CPU utilization'
        ],
        'monitoring-app': [
            'Monitoring application process',
            'Monitor port availability',
            'URL monitoring',
            'Monitor application heap memory usage',
            'Application CPU Utilization',
            'Monitor Golden'
        ],
        'recoverability': [
            'Demonstrate recovery strategy'
        ]
    }
    
    # Step 3: Get or create each application category
    print("Processing application categories...")
    
    for cat_id, cat_items in application_default_items.items():
        # Check if the category exists
        category = db.query(Category).filter_by(id=cat_id, category_type='application').first()
        
        if not category:
            print(f"Creating missing application category: {cat_id}")
            category = Category(
                id=cat_id,
                name=cat_id.replace('-', ' ').title(),
                category_type='application'
            )
            db.add(category)
            db.flush()
        
        # Check if the category is already associated with the application
        exists = db.execute(
            text("SELECT 1 FROM application_category_association WHERE application_id = :app_id AND category_id = :cat_id LIMIT 1"),
            {"app_id": db_application.id, "cat_id": category.id}
        ).scalar()
        
        if not exists:
            # Associate the category with the application
            db.execute(
                text("INSERT INTO application_category_association (application_id, category_id, category_type) VALUES (:app_id, :cat_id, 'application')"),
                {"app_id": db_application.id, "cat_id": category.id}
            )
            print(f"Associated application category {category.id} with application {db_application.id}")
            
            # Only create checklist items if the association is new
            for index, description in enumerate(cat_items):
                # Check if an item with this description already exists for this category
                existing_item = db.query(ChecklistItem).filter(
                    ChecklistItem.category_id == category.id, 
                    ChecklistItem.description == description
                ).first()
                
                if not existing_item:
                    item = ChecklistItem(
                        id=f"{category.id}-item-{index}-{str(uuid4())[:8]}",
                        description=description,
                        status='Not Started',  # Default status is 'Not Started'
                        category_id=category.id
                    )
                    db.add(item)
                    print(f"Created checklist item for {category.id}: {description}")
        else:
            print(f"Category {category.id} already associated with application {db_application.id}, skipping...")
    
    # Step 4: Get or create each platform category
    print("Processing platform categories...")
    
    for cat_id, cat_items in platform_default_items.items():
        platform_cat_id = f"platform-{cat_id}"
        
        # Check if the category exists
        category = db.query(Category).filter_by(id=platform_cat_id, category_type='platform').first()
        
        if not category:
            print(f"Creating missing platform category: {platform_cat_id}")
            category = Category(
                id=platform_cat_id,
                name=cat_id.replace('-', ' ').title(),
                category_type='platform'
            )
            db.add(category)
            db.flush()
        
        # Check if the category is already associated with the application
        exists = db.execute(
            text("SELECT 1 FROM application_category_association WHERE application_id = :app_id AND category_id = :cat_id LIMIT 1"),
            {"app_id": db_application.id, "cat_id": category.id}
        ).scalar()
        
        if not exists:
            # Associate the category with the application
            db.execute(
                text("INSERT INTO application_category_association (application_id, category_id, category_type) VALUES (:app_id, :cat_id, 'platform')"),
                {"app_id": db_application.id, "cat_id": category.id}
            )
            print(f"Associated platform category {category.id} with application {db_application.id}")
            
            # Only create checklist items if the association is new
            for index, description in enumerate(cat_items):
                # Check if an item with this description already exists for this category
                existing_item = db.query(ChecklistItem).filter(
                    ChecklistItem.category_id == category.id, 
                    ChecklistItem.description == description
                ).first()
                
                if not existing_item:
                    item = ChecklistItem(
                        id=f"{category.id}-item-{index}-{str(uuid4())[:8]}",
                        description=description,
                        status='Not Started',  # Default status is 'Not Started'
                        category_id=category.id
                    )
                    db.add(item)
                    print(f"Created checklist item for {category.id}: {description}")
        else:
            print(f"Category {category.id} already associated with application {db_application.id}, skipping...")
    
    # Commit all changes
    db.commit()
    
    # After creating all categories and checklist items, refresh the application to load relationships
    db.refresh(db_application)
    
    # Load the application with all the relationships to ensure they're available for serialization
    application = db.query(Application).options(
        joinedload(Application.application_categories).joinedload(Category.checklist_items),
        joinedload(Application.platform_categories).joinedload(Category.checklist_items)
    ).filter(Application.id == db_application.id).first()
    
    # Convert SQLAlchemy model to dictionary before returning
    app_dict = {c.name: getattr(application, c.name) for c in application.__table__.columns}
    app_dict['applicationCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in application.application_categories
    ]
    app_dict['platformCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in application.platform_categories
    ]
    # Remove old field names that would conflict with the frontend
    if 'application_categories' in app_dict:
        del app_dict['application_categories']
    if 'platform_categories' in app_dict:
        del app_dict['platform_categories']
    
    return app_dict

# Only reviewers and admins can update applications
@router.put("/{application_id}", response_model=ApplicationSchema)
def update_application(
    application_id: str, 
    application: ApplicationUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    """Update an existing application with new data."""
    
    # Get the existing application
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update the application fields
    for key, value in application.model_dump(exclude_unset=True).items():
        setattr(db_application, key, value)
    
    # Record the activity
    activity = Activity(
        id=str(uuid4()),
        action="updated",
        user_id=current_user.id,
        application_id=application_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(db_application)
    
    # Load the updated application with all relationships
    updated_app = db.query(Application).options(
        joinedload(Application.application_categories).joinedload(Category.checklist_items),
        joinedload(Application.platform_categories).joinedload(Category.checklist_items)
    ).filter(Application.id == application_id).first()
    
    # Convert SQLAlchemy model to dictionary before returning
    app_dict = {c.name: getattr(updated_app, c.name) for c in updated_app.__table__.columns}
    app_dict['applicationCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in updated_app.application_categories
    ]
    app_dict['platformCategories'] = [
        {
            'id': cat.id,
            'name': cat.name,
            'category_type': cat.category_type,
            'items': [
                {
                    'id': item.id,
                    'description': item.description,
                    'status': item.status,
                    'last_updated': item.last_updated,
                    'comments': item.comments,
                    'evidence': item.evidence,
                    'category_id': item.category_id
                } for item in cat.checklist_items
            ]
        } for cat in updated_app.platform_categories
    ]
    # Remove old field names that would conflict with the frontend
    if 'application_categories' in app_dict:
        del app_dict['application_categories']
    if 'platform_categories' in app_dict:
        del app_dict['platform_categories']
    
    return app_dict

# Only admins can delete applications
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(db_application)
    db.commit()
    return None

# Associate a category with an application - requires reviewer or admin
@router.post("/{application_id}/categories/{category_id}")
def associate_category(
    application_id: str, 
    category_id: str, 
    category_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    # Verify application exists
    application = db.query(Application).filter(Application.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Validate category_type
    if category_type not in ['application', 'platform']:
        raise HTTPException(status_code=400, detail="Category type must be 'application' or 'platform'")
    
    # Check if the association already exists
    association_exists = False
    if category_type == 'application':
        association_exists = category in application.application_categories
    else:  # platform
        association_exists = category in application.platform_categories
    
    if association_exists:
        return {"detail": "Category already associated with application"}
    
    # Associate category with application using the appropriate relationship
    if category_type == 'application':
        application.application_categories.append(category)
    else:  # platform
        application.platform_categories.append(category)
    
    # Get current checklist item count
    current_item_count = len(category.checklist_items)
    print(f"Before adding default items: Category {category.id} has {current_item_count} checklist items")
    
    # If the category has no checklist items, add default items
    if current_item_count == 0:
        # Define default items based on category IDs
        application_default_items = {
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
        
        platform_default_items = {
            'alerting': [
                'All alerting is actionable'
            ],
            'availability': [
                'Automated failovers'
            ],
            'monitoring-infra': [
                'Monitor CPU utilization'
            ],
            'monitoring-app': [
                'Monitoring application process',
                'Monitor port availability',
                'URL monitoring',
                'Monitor application heap memory usage',
                'Application CPU Utilization',
                'Monitor Golden'
            ],
            'recoverability': [
                'Demonstrate recovery strategy'
            ]
        }
        
        # Determine which set of default items to use
        default_items = []
        if category_type == 'application' and category.id in application_default_items:
            default_items = application_default_items[category.id]
            print(f"Using application default items for {category.id}: {len(default_items)} items")
        elif category_type == 'platform' and category.id.replace('platform-', '') in platform_default_items:
            platform_key = category.id.replace('platform-', '')
            default_items = platform_default_items[platform_key]
            print(f"Using platform default items for {category.id} (key: {platform_key}): {len(default_items)} items")
        else:
            print(f"No default items found for category {category.id} of type {category_type}")
        
        # Create default checklist items
        print(f"Creating {len(default_items)} default items for category {category.id}")
        new_items = []
        for index, description in enumerate(default_items):
            item_id = f"{category.id}-item-{index}-{str(uuid4())[:8]}"
            print(f"Creating item {item_id}: '{description}'")
            
            item = ChecklistItem(
                id=item_id,
                description=description,
                status='Not Started',  # Default status is 'Not Started'
                category_id=category.id
            )
            db.add(item)
            new_items.append(item)
        
        print(f"Added {len(new_items)} new checklist items to category {category.id}")
        db.flush()
    
    # Commit all changes
    db.commit()
    
    # Refresh the category to get updated checklist items
    db.refresh(category)
    
    # Verify items were added correctly
    item_count_after = len(category.checklist_items)
    print(f"After adding default items: Category {category.id} now has {item_count_after} checklist items")
    
    # Return success with category info
    return {
        "detail": "Category associated with application",
        "category_id": category.id,
        "items_count": len(category.checklist_items),
        "items": [{"id": item.id, "description": item.description} for item in category.checklist_items]
    }

# Remove a category from an application - requires reviewer or admin
@router.delete("/{application_id}/categories/{category_id}")
def remove_category(
    application_id: str, 
    category_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    # Verify application exists
    application = db.query(Application).filter(Application.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Remove from application categories
    if category in application.application_categories:
        application.application_categories.remove(category)
    
    # Remove from platform categories
    if category in application.platform_categories:
        application.platform_categories.remove(category)
    
    db.commit()
    return {"detail": "Category removed from application"} 