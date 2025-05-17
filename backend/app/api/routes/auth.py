from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid

from ...db.database import get_db
from ...models.models import User, UserRole
from ...schemas.schemas import Token, UserCreate, User as UserSchema
from ...core.auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_admin_user,
)

router = APIRouter(tags=["authentication"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserSchema)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with USER role"""
    # Check if user exists
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if db_user:
        if db_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with USER role
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=user.id or str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=UserRole.USER,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserSchema(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        role=db_user.role,
        is_active=db_user.is_active
    )

@router.post("/register/reviewer", response_model=UserSchema)
async def register_reviewer(
    user: UserCreate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Register a new user with REVIEWER role (admin only)"""
    # Check if user exists
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if db_user:
        if db_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with REVIEWER role
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=user.id or str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=UserRole.REVIEWER,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserSchema(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        role=db_user.role,
        is_active=db_user.is_active
    )

@router.post("/register/admin", response_model=UserSchema)
async def register_admin(
    user: UserCreate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Register a new user with ADMIN role (admin only)"""
    # Check if user exists
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if db_user:
        if db_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with ADMIN role
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=user.id or str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserSchema(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        role=db_user.role,
        is_active=db_user.is_active
    )

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_admin_user)):
    """Get the current user's information"""
    return UserSchema(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active
    ) 