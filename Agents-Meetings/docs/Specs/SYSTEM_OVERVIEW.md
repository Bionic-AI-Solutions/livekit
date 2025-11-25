# Multilingual Meeting Platform - System Overview & Current Capabilities

## Executive Summary

This is a **production-ready multilingual meeting platform** built on LiveKit with advanced AI-powered translation and avatar hosting capabilities. The platform supports real-time translation across 14+ languages (including 14 Indian subcontinent languages) and features AI avatar hosts for automated meeting facilitation.

**Primary Codebase**: `Agents-Meetings/` - This is the main application where ALL development occurs.

**Meeting Types**:
- **Classroom**: Teacher-led meetings with AI avatar hosts (for education)
- **Meeting**: Regular meetings with human or avatar hosts (for general use)

**Important Note**: The `examples/Platform/classroom-meet/` directory contains a standalone Next.js example demonstrating classroom-specific UI patterns (hand-raising, teacher controls, participant lists). This is a **reference implementation only** and not part of the production codebase. All classroom functionality should be implemented within `Agents-Meetings/` platform.

---

## System Architecture

### Applications
1. **Agents-Meetings** - Primary multilingual meeting platform
   - Supports two meeting types: **Classroom** (teacher-led with AI avatars) and **Meeting** (regular meetings)
   - Single unified platform for all use cases
2. **Mail Service** - Standalone email notification API
3. **LiveKit Core** - WebRTC SFU infrastructure (foundation)

**Note**: `examples/Platform/classroom-meet` is a reference example demonstrating classroom features, NOT a separate application. All development occurs within Agents-Meetings.

### Technology Stack

**Backend**
- FastAPI 0.104.1 (Python)
- PostgreSQL 15+
- SQLAlchemy 2.0.23 ORM
- JWT Authentication (HS256)
- AsyncIO for concurrency

**Frontend**
- Next.js 14.0.4 with App Router
- React 18.2.0 + TypeScript 5.3.3
- Tailwind CSS 3.3.6
- LiveKit React Components 2.0.0
- Zustand for state management

**AI/ML Stack**
- Deepgram Nova-2 (Speech-to-Text)
- Google Gemini (Translation LLM)
- ElevenLabs (Text-to-Speech)
- OpenAI GPT-4o (Avatar conversation)
- Silero VAD (Voice Activity Detection)
- Blingfire (Sentence tokenization)

**Observability**
- Langfuse for LLM tracing
- OpenTelemetry for distributed tracing
- Custom analytics dashboard

---

## Current Capabilities by Persona

### 1. Admin Persona
**Access Level**: Full platform control

**Current Features**:
- Dashboard with real-time statistics
  - Total users, meetings, active meetings, participants
- User management
  - Approve/reject new registrations
  - Activate/deactivate users
  - View all user details and roles
  - Delete users
- Meeting management
  - View all meetings (scheduled, active, ended)
  - Real-time participant counts
  - Inline meeting editing
  - Add/remove participants
  - End active meetings
  - Delete meetings
- System configuration
  - Language support settings
  - Avatar provider configuration

**API Access**:
- All user endpoints
- All meeting endpoints
- Dashboard statistics endpoint
- Participant management endpoints

---

### 2. Teacher Persona
**Access Level**: Create and manage classroom meetings

**Current Features**:
- Create classroom meetings
  - Always uses AI avatar hosts
  - Configure avatar provider (BitHuman, Anam, Tavus, Hedra)
  - Set max participants
  - Enable/disable translation
  - Configure supported languages
  - Schedule meetings with duration
- View own created meetings
- Join meetings as teacher
- End own meetings

**Note**: Advanced classroom controls (mute all students, breakout rooms, etc.) are proposed enhancements to be built into Agents-Meetings (see Teacher Enhancement Specs).

**API Access**:
- Create meetings (type: classroom)
- View own meetings
- Update own meetings
- End own meetings
- Generate room tokens

---

### 3. Host Persona
**Access Level**: Create and manage regular meetings

**Current Features**:
- Create regular meetings
  - Choose human or avatar host
  - Configure avatar provider (if avatar selected)
  - Set max participants
  - Enable/disable translation
  - Configure supported languages
  - Schedule meetings with duration
- View own created meetings
- Join meetings as host
- End own meetings
- Host video/audio controls
- Screen sharing

**API Access**:
- Create meetings (type: meeting)
- View own meetings
- Update own meetings
- End own meetings
- Generate room tokens

---

### 4. Participant Persona
**Access Level**: Join and participate in meetings

**Current Features**:
- Join meetings with meeting ID
- Select language preference (14+ languages)
  - English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Nepali
- Real-time translation
  - Receive audio in selected language
  - See captions in selected language
  - Change language during meeting
- Video conferencing features
  - Camera on/off
  - Microphone on/off
  - Speaker selection
  - Chat with translation
- View participant list
- Leave meeting

**Note**: Student-specific features (hand raising, teacher mute controls) are proposed enhancements to be built into Agents-Meetings classroom meetings.

**API Access**:
- View meetings they're invited to
- Generate room tokens for joining
- Join meetings

---

## Core Features Implemented

### 1. Authentication & Authorization
- [x] JWT-based authentication with HS256
- [x] Email/password login
- [x] Self-registration with admin approval
- [x] Role-based access control (4 roles)
- [x] Account activation workflow
- [x] Email notifications for registration/approval/rejection
- [x] Protected routes with role checking
- [x] Token expiration (7 days)

### 2. User Management
- [x] User CRUD operations
- [x] User roles: Admin, Teacher, Host, Participant
- [x] User approval/rejection by admin
- [x] User activation/deactivation
- [x] Language preference per user
- [x] Avatar provider preference per user
- [x] User listing with filtering (all/pending/active/inactive)

### 3. Meeting Management
- [x] Two meeting types: Classroom, Meeting
- [x] Meeting lifecycle: Scheduled → Active → Ended/Cancelled
- [x] Host type selection: Human or Avatar
- [x] Avatar provider selection (BitHuman, Anam, Tavus, Hedra)
- [x] Avatar configuration (model, avatar_id, avatar_image)
- [x] Translation enablement toggle
- [x] Supported languages configuration
- [x] Max participants limit
- [x] Scheduled meetings with duration
- [x] End meeting functionality (kicks all participants)
- [x] Meeting analytics with Langfuse trace IDs

### 4. Real-time Translation System
- [x] Multi-user simultaneous translation
- [x] Speech-to-Text with Deepgram Nova-2
- [x] Translation with Google Gemini LLM
- [x] Text-to-Speech with ElevenLabs
- [x] Audio track per language
- [x] Real-time captions with translation
- [x] Chat message translation
- [x] Dynamic language switching
- [x] 14+ language support
- [x] Translation preferences per user per meeting
- [x] Transcription and audio translation toggles

### 5. AI Avatar Hosts
- [x] Multiple avatar providers (BitHuman, Anam, Tavus, Hedra)
- [x] Natural language conversation with GPT-4o
- [x] Real-time voice synthesis with ElevenLabs
- [x] Configurable avatar models and images
- [x] Custom agent instructions
- [x] Voice Activity Detection with Silero
- [x] Avatar lifecycle management

### 6. Room Management
- [x] LiveKit room creation and management
- [x] Access token generation with language metadata
- [x] Participant tracking
- [x] Agent lifecycle management
- [x] Room cleanup on meeting end
- [x] Room analytics with trace IDs

### 7. Participant Management
- [x] Add/remove participants from meetings
- [x] Language preference per participant
- [x] Participant status tracking (invited/joined/left)
- [x] Join/leave timestamps
- [x] Langfuse span IDs for participant tracing

### 8. Admin Dashboard
- [x] Real-time statistics
  - Total users count
  - Total meetings count
  - Active meetings count
  - Total participants count
- [x] Quick links to user and meeting management
- [x] User management page with filtering
- [x] Meeting management page with real-time updates

### 9. Video Conferencing
- [x] LiveKit VideoConference component integration
- [x] Real-time video/audio streaming
- [x] Device controls (mic, camera, speaker)
- [x] Participant list with status
- [x] Chat with translation
- [x] Screen sharing
- [x] Leave/End meeting controls
- [x] Translated captions display
- [x] Translated audio track subscription

### 10. Email Notifications
- [x] SMTP integration via Mail Service API
- [x] JWT authentication for mail API
- [x] Registration confirmation email
- [x] Account approval notification
- [x] Account rejection notification
- [x] HTML email templates
- [x] Bulk email support
- [x] Attachment support (PDF, DOC, XLS, images)
- [x] CC and BCC support

### 11. Observability & Analytics
- [x] Langfuse integration for LLM tracing
- [x] OpenTelemetry instrumentation
- [x] Trace IDs for meetings, rooms, participants
- [x] FastAPI request tracing
- [x] SQLAlchemy query tracing
- [x] Custom spans for business logic
- [x] Meeting analytics table

### 12. Classroom Meeting Type (in Agents-Meetings)
- [x] Teacher role can create classroom meetings
- [x] Classroom meetings always use AI avatar hosts
- [x] Distinction between classroom and regular meeting types
- [ ] Advanced classroom controls (planned - see Teacher Enhancement Specs):
  - Mute all students functionality
  - Hand-raise button for students
  - Breakout rooms
  - Student attendance tracking

**Note**: The `examples/Platform/classroom-meet` project demonstrates some classroom features (hand-raising, teacher controls, participant list). These are reference implementations that should be incorporated into Agents-Meetings as enhancements.

### 13. Deployment
- [x] Docker Compose for local development
- [x] Kubernetes manifests for production
- [x] Environment-based configuration
- [x] Database migrations with Alembic
- [x] CORS configuration
- [x] Health check endpoints
- [x] Nginx/Ingress routing

---

## Database Schema

### Tables
1. **users** - User accounts with roles and preferences
2. **meetings** - Meeting definitions with avatar and translation config
3. **meeting_participants** - Participant-meeting associations with language preferences
4. **rooms** - LiveKit room mappings with agent status
5. **translation_preferences** - User translation preferences per meeting
6. **meeting_analytics** - Meeting analytics with trace IDs

### Key Relationships
- User → Meetings (1:N as creator)
- User → Meetings (1:N as host/teacher)
- Meeting → MeetingParticipants (1:N)
- Meeting → Room (1:1)
- Meeting → MeetingAnalytics (1:N)
- User + Meeting → TranslationPreferences (N:M)

---

## API Endpoints Summary

### Authentication (`/api/v1/auth`)
- POST `/login` - Login with email/password
- POST `/register` - Self-registration
- GET `/me` - Get current user

### Users (`/api/v1/users`)
- POST `/` - Create user (admin)
- GET `/` - List users (admin)
- GET `/{user_id}` - Get user (admin)
- PUT `/{user_id}` - Update user (admin)
- POST `/{user_id}/approve` - Approve user (admin)
- POST `/{user_id}/reject` - Reject user (admin)
- DELETE `/{user_id}` - Delete user (admin)

### Meetings (`/api/v1/meetings`)
- POST `/` - Create meeting (teacher/host)
- GET `/` - List meetings (filtered by role)
- GET `/{meeting_id}` - Get meeting details
- PUT `/{meeting_id}` - Update meeting (creator/admin)
- POST `/{meeting_id}/end` - End meeting (creator/admin)

### Rooms (`/api/v1/rooms`)
- POST `/token` - Generate LiveKit access token
- GET `/meeting/{meeting_id}` - Get room info

### Participants (`/api/v1/participants`)
- POST `/meeting/{meeting_id}/participants` - Add participant (admin)
- GET `/meeting/{meeting_id}/participants` - List participants (admin)
- DELETE `/meeting/{meeting_id}/participants/{participant_id}` - Remove participant (admin)

### Admin (`/api/v1/admin`)
- GET `/dashboard` - Get dashboard statistics (admin)

### Mail Service
- GET `/` - API info
- GET `/health` - Health check
- POST `/send-email` - Send email (JWT auth)
- POST `/send-email-with-attachments` - Send with attachments (JWT auth)
- POST `/send-bulk-emails` - Bulk send (JWT auth)

---

## Frontend Pages

### Public Pages
1. `/` - Home page (redirects to dashboard or login)
2. `/login` - Login page
3. `/register` - Registration page

### Participant Pages
4. `/meeting/join` - Join meeting with ID and language selection
5. `/meeting/room/[roomId]` - Active meeting room

### Admin Pages
6. `/admin/dashboard` - Admin dashboard
7. `/admin/users` - User management
8. `/admin/meetings` - Meeting management
9. `/admin/meetings/new` - Create meeting

---

## Translation Pipeline Architecture

```
Participant Audio
    ↓
[Voice Activity Detection - Silero]
    ↓
[Speech-to-Text - Deepgram Nova-2]
    ↓
[Sentence Tokenization - Blingfire]
    ↓
[Translation - Google Gemini LLM]
    ↓  (for each target language)
[Text-to-Speech - ElevenLabs]
    ↓
[Audio Resampling - 22050Hz → 48000Hz]
    ↓
Published Audio Tracks (per language)
```

**Simultaneous Outputs**:
- Translated audio tracks (one per language)
- Translated text transcriptions (real-time captions)
- Chat message translations

---

## Supported Languages

### Primary Languages (Translation Agent)
- English (en)
- German (de)
- Spanish (es)
- French (fr)
- Japanese (ja)
- Chinese/Mandarin (zh)

### Indian Subcontinent Languages
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)
- Odia (or)
- Assamese (as)
- Urdu (ur)
- Nepali (ne)

**Total**: 20+ languages with full translation support

---

## Avatar Providers

### Supported Providers
1. **BitHuman** (default)
   - Model: "essence"
   - High-quality realistic avatars

2. **Anam**
   - Alternative provider

3. **Tavus**
   - Alternative provider

4. **Hedra**
   - Alternative provider

### Avatar Configuration
- Custom avatar model selection
- Avatar ID specification
- Avatar image URL
- Custom agent instructions
- Provider-specific settings

---

## Deployment Architecture

### Development (Docker Compose)
- PostgreSQL 15
- FastAPI Backend
- Next.js Frontend
- LiveKit Server
- Agent Services (translation, avatar, room manager)

### Production (Kubernetes)
- Namespace: `meeting-platform`
- PostgreSQL with persistent volume
- Backend deployment (replicas configurable)
- Frontend deployment (replicas configurable)
- LiveKit deployment
- Agent deployments (translation, avatar, room manager)
- Langfuse deployment
- Ingress with TLS/HTTPS
- ConfigMaps and Secrets for configuration

---

## Security Features

### Authentication
- JWT tokens with HS256 algorithm
- 7-day token expiration
- bcrypt password hashing
- Account activation required
- Admin approval for new users

### Authorization
- Role-based access control (RBAC)
- Endpoint-level permission checking
- Resource ownership validation
- Meeting creator/admin restrictions

### API Security
- CORS configuration
- Mail API JWT authentication with issuer validation
- Input validation with Pydantic
- SQL injection protection via ORM
- Rate limiting ready (not yet configured)

### Infrastructure Security
- Environment variable separation
- Secret management via Kubernetes Secrets
- Database credential encryption
- TLS/HTTPS in production
- Health check endpoints

---

## Observability & Monitoring

### Langfuse Integration
- Trace all AI operations (STT, translation, TTS)
- Session-level tracking (room traces)
- User-level tracking (participant spans)
- Token usage analytics
- Latency metrics
- Error tracking

### OpenTelemetry
- Distributed tracing across services
- FastAPI request/response tracing
- SQLAlchemy query tracing
- Custom business logic spans
- OTLP HTTP exporter

### Logging
- Structured logging with Python logging
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging
- Error stack traces
- Agent lifecycle logging

### Analytics
- Meeting analytics table
- Participant count tracking
- Duration tracking
- Languages used tracking
- Trace ID correlation

---

## Current Limitations & Known Issues

### Performance
- No caching layer (Redis)
- No CDN for static assets
- Database connection pooling not optimized
- No rate limiting on API endpoints

### Features
- No recording functionality
- No breakout rooms
- No waiting room for participants
- No moderator controls (mute others, kick participants)
- No meeting templates
- No recurring meetings
- No calendar integration
- No mobile apps (web only)
- No screen sharing translation
- No file sharing in meetings
- No polls or Q&A features

### User Experience
- No in-app notifications
- No presence indicators (online/offline)
- No search functionality
- No meeting history for participants
- No download transcripts feature
- No meeting summaries

### Administration
- No audit logs
- No usage reports
- No billing/subscription system
- No organization/team management
- No SSO/SAML integration
- No LDAP integration

### DevOps
- No automated backups configured
- No disaster recovery plan
- No auto-scaling configured
- No load testing performed
- No CI/CD pipelines
- No automated testing (unit, integration, e2e)

### Security
- No two-factor authentication (2FA)
- No password reset via email
- No password strength requirements
- No session management (logout all devices)
- No IP whitelisting
- No brute force protection

---

## Technical Debt

### Code Quality
- Limited test coverage (no tests)
- No API documentation (beyond Swagger auto-gen)
- Inconsistent error handling
- Magic numbers and strings in code
- Some duplicate code in components

### Architecture
- Translation agent tightly coupled to specific providers
- No abstraction for STT/TTS providers
- Frontend API client not typed
- No request/response DTOs in frontend
- Agent error recovery not robust

### Database
- No indexing strategy review
- Missing foreign key indexes
- No query optimization
- No database monitoring
- No migration rollback testing

### Dependencies
- Some dependencies not pinned to minor versions
- No security vulnerability scanning
- No license compliance checking
- No dependency update strategy

---

## Success Metrics (Current State)

### Implemented Metrics
- Total users count
- Total meetings count
- Active meetings count
- Total participants count
- Meeting analytics with trace IDs

### Missing Metrics
- Daily/Monthly active users
- Average meeting duration
- Translation accuracy metrics
- Avatar response latency
- User satisfaction scores
- Meeting completion rate
- Feature adoption rates
- Error rates and types
- API response times
- System resource utilization

---

## Conclusion

This is a **comprehensive, production-ready multilingual meeting platform** with advanced AI capabilities. The core features are well-implemented with proper architecture, security, and observability. However, there are significant opportunities for enhancement in user experience, administrative features, DevOps automation, and platform scalability.

The following enhancement specifications provide detailed roadmaps for each persona and functional area.
