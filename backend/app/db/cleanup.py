import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models.models import Category, ChecklistItem
from ..db.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def deduplicate_checklist_items(db: Session):
    """
    Clean up duplicate checklist items in the database.
    Keep the most recently updated item for each unique description within a category.
    """
    logger.info("Starting deduplication of checklist items...")
    
    # Get all categories
    categories = db.query(Category).all()
    logger.info(f"Found {len(categories)} categories to process")
    
    # For each category, find and clean up duplicate items
    for category in categories:
        # Get all items for this category
        items = db.query(ChecklistItem).filter(ChecklistItem.category_id == category.id).all()
        logger.info(f"Processing category {category.id} with {len(items)} items")
        
        # Track unique descriptions and corresponding items
        unique_descriptions = {}
        items_to_delete = []
        
        # Group items by description and identify duplicates
        for item in items:
            if item.description not in unique_descriptions:
                # First time seeing this description
                unique_descriptions[item.description] = [item]
            else:
                # Already seen this description, add to the list
                unique_descriptions[item.description].append(item)
        
        # For each group of items with the same description, keep only the most recently updated one
        for description, item_list in unique_descriptions.items():
            if len(item_list) > 1:
                logger.info(f"Found {len(item_list)} duplicate items for '{description}' in category {category.id}")
                
                # Sort by last_updated descending to keep the most recent item
                sorted_items = sorted(item_list, key=lambda x: x.last_updated, reverse=True)
                
                # Keep the first (most recently updated) item and mark the rest for deletion
                items_to_delete.extend(sorted_items[1:])
        
        # Delete the duplicate items
        for item in items_to_delete:
            logger.info(f"Deleting duplicate item: {item.id} - '{item.description}'")
            db.delete(item)
        
        if items_to_delete:
            logger.info(f"Deleted {len(items_to_delete)} duplicate items from category {category.id}")
    
    # Commit the changes
    db.commit()
    logger.info("Deduplication completed successfully")

def run_cleanup():
    """Execute the cleanup operations."""
    db = SessionLocal()
    try:
        deduplicate_checklist_items(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_cleanup() 