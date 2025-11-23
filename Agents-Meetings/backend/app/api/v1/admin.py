"""
Admin endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.meeting import Meeting
from app.services.meeting_service import get_meetings
from app.services.user_service import get_users

router = APIRouter()


class DashboardStats(BaseModel):
    total_users: int
    total_meetings: int
    active_meetings: int
    total_participants: int


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get dashboard statistics (Admin only)"""
    from app.models.meeting import MeetingStatus
    from app.models.meeting import MeetingParticipant
    
    total_users = len(get_users(db, skip=0, limit=10000))
    all_meetings = get_meetings(db, skip=0, limit=10000)
    total_meetings = len(all_meetings)
    active_meetings = len([m for m in all_meetings if m.status == MeetingStatus.ACTIVE])
    
    # Count participants
    from sqlalchemy import func
    total_participants = db.query(func.count(MeetingParticipant.id)).scalar() or 0
    
    return DashboardStats(
        total_users=total_users,
        total_meetings=total_meetings,
        active_meetings=active_meetings,
        total_participants=total_participants
    )

