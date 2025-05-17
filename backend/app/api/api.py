from fastapi import APIRouter
from .routes import auth, applications, checklist, dashboard, integrations

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Application routes
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])

# Checklist routes
api_router.include_router(checklist.router, tags=["checklist"])

# Dashboard routes
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

# Integration routes
api_router.include_router(integrations.router, prefix="/automations", tags=["automations"]) 