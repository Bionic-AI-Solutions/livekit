"""
User model
"""
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    HOST = "host"
    PARTICIPANT = "participant"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PARTICIPANT)
    language_preference = Column(String, default="en")
    avatar_provider_preference = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)  # New users require admin approval
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

