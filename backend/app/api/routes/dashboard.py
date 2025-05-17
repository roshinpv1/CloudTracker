from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from ...db.database import get_db
from ...models.models import Application, Activity, User
from ...schemas.schemas import DashboardMetrics, RecentActivity
from ...core.auth import get_any_authenticated_user

router = APIRouter(tags=["dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get application metrics by status for the dashboard"""
    in_review_count = db.query(func.count(Application.id)).filter(Application.status == "In Review").scalar()
    approved_count = db.query(func.count(Application.id)).filter(Application.status == "Approved").scalar()
    onboarded_count = db.query(func.count(Application.id)).filter(Application.status == "Onboarded").scalar()
    production_count = db.query(func.count(Application.id)).filter(Application.status == "Production").scalar()
    
    return {
        "inReview": in_review_count,
        "approved": approved_count,
        "onboarded": onboarded_count,
        "production": production_count
    }

@router.get("/recent-activities", response_model=List[RecentActivity])
def get_recent_activities(
    limit: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    """Get recent application activities for the dashboard"""
    # Join Activity with Application to get application names
    activities = db.query(
        Activity.id,
        Application.name,
        Activity.action,
        Activity.timestamp
    ).join(
        Application, Activity.application_id == Application.id
    ).order_by(
        Activity.timestamp.desc()
    ).limit(limit).all()
    
    # Format for response
    return [
        {
            "id": activity[0],
            "name": activity[1],
            "action": activity[2],
            "timestamp": activity[3].isoformat()
        }
        for activity in activities
    ] 