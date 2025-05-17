"""
Database Maintenance Script - Cleanup Duplicate Checklist Items

This script should be run manually to clean up duplicate checklist items in the database.
It will keep the most recently updated item for each unique description within a category.

Usage:
    python cleanup_duplicates.py
"""

import logging
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.cleanup import run_cleanup

if __name__ == "__main__":
    print("=== CloudTracker Database Cleanup Script ===")
    print("This script will remove duplicate checklist items, keeping only the most recently updated one for each description.")
    
    confirmation = input("Do you want to proceed? [y/N]: ")
    if confirmation.lower() != 'y':
        print("Operation cancelled.")
        sys.exit(0)
    
    print("Starting cleanup operation...")
    run_cleanup()
    print("Cleanup operation completed successfully.")
    print("Please restart the application server to ensure changes take effect.") 