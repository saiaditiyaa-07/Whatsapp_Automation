from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, UserRole
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.schemas.token import Token

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
def signup(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    # 1. Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # 2. Hash password & create user
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 3. Create default workspace and assign as Owner
    workspace_name = f"{user_in.full_name or 'User'}'s Workspace"
    db_workspace = Workspace(name=workspace_name)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    
    db_membership = WorkspaceMember(
        workspace_id=db_workspace.id,
        user_id=db_user.id,
        role=UserRole.OWNER
    )
    db.add(db_membership)
    db.commit()
    
    return db_user

@router.post("/login", response_model=Token)
def login(
    *,
    db: Session = Depends(deps.get_db),
    credentials: UserLogin
) -> Any:
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
        
    access_token = security.create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login-access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
        
    access_token = security.create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    email: str
) -> Any:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No user registered with this email"
        )
    
    # Simulate sending email recovery link
    print(f"[SMTP Sim]: Password recovery link triggered for user {email}")
    return {"message": "Password recovery email has been sent successfully"}

@router.post("/google-login", response_model=Token)
def google_login(
    *,
    db: Session = Depends(deps.get_db),
    id_token: str
) -> Any:
    # Simulate Google OAuth Profile parsing
    mock_google_id = f"g-{id_token[:10]}"
    mock_email = f"google_user_{mock_google_id}@gmail.com"
    
    user = db.query(User).filter(User.email == mock_email).first()
    if not user:
        # Create Google sign-up dynamically
        hashed_password = security.get_password_hash(f"google-oauth-pwd-{mock_google_id}")
        user = User(
            email=mock_email,
            hashed_password=hashed_password,
            full_name="Google User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create workspace
        db_workspace = Workspace(name="Google Workspace")
        db.add(db_workspace)
        db.commit()
        db.refresh(db_workspace)
        
        # Add membership
        db_membership = WorkspaceMember(
            workspace_id=db_workspace.id,
            user_id=user.id,
            role=UserRole.OWNER
        )
        db.add(db_membership)
        db.commit()
        
    access_token = security.create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
