from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from .api.api import api_router
from .db.database import engine, get_db
from .models.models import Base
from .db.seed import seed_db

app = FastAPI(
    title="CloudTracker API",
    description="API for the Cloud Applications Tracking & Validation application",
    version="1.0.0"
)

# Set up CORS
origins = [
    "http://localhost:5173",  # Default Vite dev server port
    "http://localhost:4173",  # Vite preview port
    "http://localhost:3000",  # In case using a different port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(api_router, prefix="/api")

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Add startup event to seed the database if empty
@app.on_event("startup")
async def startup_db_client():
    # Check if database needs to be seeded
    db = next(get_db())
    # A simple check - if no users exist, we'll seed the database
    user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    if user_count == 0:
        seed_db(db)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"} 