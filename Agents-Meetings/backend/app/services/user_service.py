"""
User service for business logic
"""
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import get_password_hash, verify_password
from typing import Optional, List
import uuid


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    role: UserRole = UserRole.PARTICIPANT,
    language_preference: str = "en"
) -> User:
    """Create a new user"""
    hashed_password = get_password_hash(password)
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hashed_password,
        full_name=full_name,
        role=role,
        language_preference=language_preference
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()


def update_user(
    db: Session,
    user_id: uuid.UUID,
    email: Optional[str] = None,
    full_name: Optional[str] = None,
    role: Optional[UserRole] = None,
    language_preference: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Optional[User]:
    """Update user"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    if email is not None:
        user.email = email
    if full_name is not None:
        user.full_name = full_name
    if role is not None:
        user.role = role
    if language_preference is not None:
        user.language_preference = language_preference
    if is_active is not None:
        user.is_active = is_active
    
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: uuid.UUID) -> bool:
    """Delete user"""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user

