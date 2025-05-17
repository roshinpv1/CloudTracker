from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4

from ...db.database import get_db
from ...models.models import Category, ChecklistItem, User
from ...schemas.schemas import (
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate,
    ChecklistItem as ChecklistItemSchema,
    ChecklistItemCreate,
    ChecklistItemUpdate
)
from ...core.auth import (
    get_any_authenticated_user,
    get_reviewer_or_admin_user,
    get_admin_user
)

router = APIRouter(tags=["checklist"])

# Categories endpoints

@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_any_authenticated_user)):
    categories = db.query(Category).all()
    return categories

@router.get("/categories/{category_id}", response_model=CategorySchema)
def get_category(
    category_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("/categories", response_model=CategorySchema)
def create_category(
    category: CategoryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    db_category = Category(
        id=category.id or str(uuid4()),
        name=category.name,
        category_type=category.category_type
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: str, 
    category: CategoryUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return None

# Checklist items endpoints

@router.get("/categories/{category_id}/items", response_model=List[ChecklistItemSchema])
def get_category_items(
    category_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category.checklist_items

@router.post("/categories/{category_id}/items", response_model=ChecklistItemSchema)
def create_checklist_item(
    category_id: str, 
    item: ChecklistItemCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if an item with the same description already exists for this category
    existing_item = db.query(ChecklistItem).filter(
        ChecklistItem.category_id == category_id,
        ChecklistItem.description == item.description
    ).first()
    
    if existing_item:
        # If the item already exists, just return it
        return existing_item
    
    # Set default status to 'Not Started' if not specified
    status = item.status if item.status else 'Not Started'
    
    db_item = ChecklistItem(
        id=str(uuid4()),
        description=item.description,
        status=status,
        comments=item.comments,
        evidence=item.evidence,
        category_id=category_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/checklist-items/{item_id}", response_model=ChecklistItemSchema)
def update_checklist_item(
    item_id: str, 
    item: ChecklistItemUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    db_item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/checklist-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(
    item_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reviewer_or_admin_user)
):
    db_item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    db.delete(db_item)
    db.commit()
    return None 