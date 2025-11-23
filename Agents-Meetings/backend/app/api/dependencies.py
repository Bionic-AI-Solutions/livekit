"""
API dependencies
"""
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole

# Database dependency
def get_database() -> Session:
    """Get database session"""
    return Depends(get_db)

# Current user dependency
def get_current_active_user() -> User:
    """Get current active user"""
    return Depends(get_current_user)

# Role-based dependencies
def require_admin() -> User:
    """Require admin role"""
    return require_role(UserRole.ADMIN)

def require_teacher() -> User:
    """Require teacher role"""
    return require_role(UserRole.TEACHER, UserRole.ADMIN)

def require_host() -> User:
    """Require host role"""
    return require_role(UserRole.HOST, UserRole.ADMIN)

def require_teacher_or_host() -> User:
    """Require teacher or host role"""
    return require_role(UserRole.TEACHER, UserRole.HOST, UserRole.ADMIN)

