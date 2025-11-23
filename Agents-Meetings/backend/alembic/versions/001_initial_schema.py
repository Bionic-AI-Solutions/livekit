"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('admin', 'teacher', 'host', 'participant', name='userrole'), nullable=False),
        sa.Column('language_preference', sa.String(), default='en'),
        sa.Column('avatar_provider_preference', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Create meetings table
    op.create_table(
        'meetings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('meeting_type', sa.Enum('classroom', 'meeting', name='meetingtype'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('host_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('teacher_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('room_name', sa.String(), nullable=False, unique=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('host_type', sa.Enum('human', 'avatar', name='hosttype'), nullable=True),
        sa.Column('use_avatar_host', sa.Boolean(), default=False),
        sa.Column('avatar_provider', sa.String(), nullable=True),
        sa.Column('avatar_config', postgresql.JSONB(), nullable=True),
        sa.Column('translation_enabled', sa.Boolean(), default=True),
        sa.Column('supported_languages', postgresql.JSONB(), default=['en']),
        sa.Column('status', sa.Enum('scheduled', 'active', 'ended', 'cancelled', name='meetingstatus'), default='scheduled'),
        sa.Column('langfuse_trace_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_meetings_room_name', 'meetings', ['room_name'])

    # Create meeting_participants table
    op.create_table(
        'meeting_participants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('meeting_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('meetings.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('language_preference', sa.String(), default='en'),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('invited', 'joined', 'left', name='participantstatus'), default='invited'),
        sa.Column('langfuse_span_id', sa.String(), nullable=True),
    )

    # Create rooms table
    op.create_table(
        'rooms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('meeting_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('meetings.id'), nullable=False, unique=True),
        sa.Column('livekit_room_name', sa.String(), nullable=False, unique=True),
        sa.Column('livekit_room_sid', sa.String(), nullable=True),
        sa.Column('agent_job_id', sa.String(), nullable=True),
        sa.Column('avatar_agent_active', sa.Boolean(), default=False),
        sa.Column('translation_agent_active', sa.Boolean(), default=False),
        sa.Column('langfuse_trace_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_rooms_livekit_room_name', 'rooms', ['livekit_room_name'])

    # Create translation_preferences table
    op.create_table(
        'translation_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('meeting_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('meetings.id'), nullable=False),
        sa.Column('source_language', sa.String(), nullable=True),
        sa.Column('target_language', sa.String(), nullable=False, default='en'),
        sa.Column('transcription_enabled', sa.Boolean(), default=True),
        sa.Column('audio_translation_enabled', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )

    # Create meeting_analytics table
    op.create_table(
        'meeting_analytics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('meeting_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('meetings.id'), nullable=False),
        sa.Column('participant_count', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('languages_used', postgresql.JSONB(), nullable=True),
        sa.Column('langfuse_trace_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('meeting_analytics')
    op.drop_table('translation_preferences')
    op.drop_table('rooms')
    op.drop_table('meeting_participants')
    op.drop_table('meetings')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS participantstatus')
    op.execute('DROP TYPE IF EXISTS meetingstatus')
    op.execute('DROP TYPE IF EXISTS hosttype')
    op.execute('DROP TYPE IF EXISTS meetingtype')
    op.execute('DROP TYPE IF EXISTS userrole')

