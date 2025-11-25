#!/usr/bin/env python3
"""
Script to create an admin user
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal
from app.services.user_service import create_user, get_user_by_email
from app.models.user import UserRole

def create_admin_user(email: str, password: str, full_name: str):
    """Create an admin user"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            print(f"User with email {email} already exists!")
            if existing_user.role == UserRole.ADMIN:
                print(f"User {email} is already an admin.")
            else:
                print(f"Updating user {email} to admin role...")
                existing_user.role = UserRole.ADMIN
                db.commit()
                print(f"Successfully updated {email} to admin role!")
            return existing_user
        
        # Create new admin user
        user = create_user(
            db=db,
            email=email,
            password=password,
            full_name=full_name,
            role=UserRole.ADMIN
        )
        print(f"Successfully created admin user: {email}")
        print(f"  Full Name: {user.full_name}")
        print(f"  Role: {user.role.value}")
        return user
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    email = "salil.kadam@gmail.com"
    password = "Th1515T0p53cr3t"
    full_name = "Salil Kadam"
    
    create_admin_user(email, password, full_name)






