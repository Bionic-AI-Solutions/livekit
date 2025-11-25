"""
User management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import require_admin, get_current_user
from app.models.user import User, UserRole
from app.services.user_service import (
    create_user, get_user_by_id, get_users, update_user, delete_user, get_user_by_email
)

router = APIRouter()


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    language_preference: str = "en"


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: UserRole | None = None
    language_preference: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    language_preference: str
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Create a new user (Admin only)"""
    from app.services.user_service import get_user_by_email
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role,
        language_preference=user_data.language_preference
    )
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        language_preference=user.language_preference,
        is_active=user.is_active
    )


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """List all users (Admin only)"""
    users = get_users(db, skip=skip, limit=limit)
    return [
        UserResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            language_preference=u.language_preference,
            is_active=u.is_active
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get user by ID (Admin only)"""
    import uuid
    user = get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        language_preference=user.language_preference,
        is_active=user.is_active
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Update user (Admin only)"""
    import uuid
    import logging
    logger = logging.getLogger(__name__)
    
    # Get current user state before update
    existing_user = get_user_by_id(db, uuid.UUID(user_id))
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    was_active = existing_user.is_active
    will_be_active = user_data.is_active if user_data.is_active is not None else was_active
    
    user = update_user(
        db=db,
        user_id=uuid.UUID(user_id),
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        language_preference=user_data.language_preference,
        is_active=user_data.is_active
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Send approval/rejection email if status changed
    if was_active != will_be_active:
        try:
            from app.services.email_service import send_approval_email
            import asyncio
            # Send email asynchronously without blocking the response
            asyncio.create_task(send_approval_email(user.email, user.full_name, will_be_active))
        except Exception as e:
            logger.error(f"Failed to send approval email: {e}")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        language_preference=user.language_preference,
        is_active=user.is_active
    )


@router.post("/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Approve user (Admin only)"""
    import uuid
    import logging
    logger = logging.getLogger(__name__)
    
    user = get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already approved"
        )
    
    user = update_user(db=db, user_id=uuid.UUID(user_id), is_active=True)
    
    # Send approval email
    try:
        from app.services.email_service import send_approval_email
        import asyncio
        asyncio.create_task(send_approval_email(user.email, user.full_name, True))
    except Exception as e:
        logger.error(f"Failed to send approval email: {e}")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        language_preference=user.language_preference,
        is_active=user.is_active
    )


@router.post("/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Reject user (Admin only)"""
    import uuid
    import logging
    logger = logging.getLogger(__name__)
    
    user = get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        # User is already inactive, just send rejection email
        try:
            from app.services.email_service import send_approval_email
            import asyncio
            asyncio.create_task(send_approval_email(user.email, user.full_name, False))
        except Exception as e:
            logger.error(f"Failed to send rejection email: {e}")
    else:
        # Deactivate user
        user = update_user(db=db, user_id=uuid.UUID(user_id), is_active=False)
        
        # Send rejection email
        try:
            from app.services.email_service import send_approval_email
            import asyncio
            asyncio.create_task(send_approval_email(user.email, user.full_name, False))
        except Exception as e:
            logger.error(f"Failed to send rejection email: {e}")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        language_preference=user.language_preference,
        is_active=user.is_active
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Delete user (Admin only)"""
    import uuid
    success = delete_user(db, uuid.UUID(user_id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

