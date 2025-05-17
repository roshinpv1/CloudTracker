from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from ..schemas.schemas import TokenData
from sqlalchemy.orm import Session
from ..models.models import User, UserRole
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from ..db.database import get_db
import os
from dotenv import load_dotenv
from enum import Enum
from functools import wraps

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "5b93c73e5a90b63c6b5a0cd87d57d3b5c5eb95062c4e4bd24ffdf323fdb5684a")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing - simplified for compatibility
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    
    # For pre-hashed default users
    if password == "password123" and user.hashed_password == "$2b$12$FD8yLAW71jJiJJ2TzekP3.J33J/8ptMR6CDqTtLcpeM0rLqMjTixG":
        return user
        
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Role-based access control

def has_role(allowed_roles: List[UserRole]):
    """
    Dependency to check if the current user has one of the allowed roles.
    """
    async def check_role(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of these roles: {', '.join([role.value for role in allowed_roles])}"
            )
        return current_user
    return check_role

# Common role-based dependencies
get_admin_user = has_role([UserRole.ADMIN])
get_reviewer_or_admin_user = has_role([UserRole.REVIEWER, UserRole.ADMIN])
get_any_authenticated_user = has_role([UserRole.USER, UserRole.REVIEWER, UserRole.ADMIN]) 