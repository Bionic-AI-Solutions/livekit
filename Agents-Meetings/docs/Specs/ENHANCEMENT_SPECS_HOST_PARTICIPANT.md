# Host & Participant Personas - Enhancement Specifications

**Platform**: Agents-Meetings (all enhancements apply to this codebase only)

**Context**: Agents-Meetings supports two user types who create meetings:
- **Teacher**: Creates classroom meetings (meeting_type: 'classroom')
- **Host**: Creates regular meetings (meeting_type: 'meeting')

All enhancements below add functionality to the Agents-Meetings platform.

---

## Part 1: Host Persona Enhancements

### Current Host Capabilities

**Existing Features**:
- Create regular meetings (human or avatar host)
- Configure avatar provider
- Set max participants
- Enable/disable translation
- Configure supported languages
- Schedule meetings with duration
- View own created meetings
- Join meetings as host
- End own meetings

---

## Host Enhancement Specifications

### Priority 1: Enhanced Meeting Management

#### 1.1 Advanced Meeting Features
**Description**: Professional meeting tools for hosts

**User Stories**:
- As a host, I want to create waiting rooms for participants
- As a host, I want to admit participants individually or in bulk
- As a host, I want to assign co-hosts with elevated permissions
- As a host, I want to lock meetings after they start
- As a host, I want to create meeting agendas
- As a host, I want to control who can share screen

**Technical Requirements**:
```
Database Schema:
- New table: meeting_hosts
  - meeting_id (UUID, FK to meetings.id)
  - user_id (UUID, FK to users.id)
  - role (Enum: host, co_host)
  - assigned_by (UUID, FK to users.id)
  - assigned_at (DateTime)
  - PK: (meeting_id, user_id)

- New table: waiting_room
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - user_id (UUID, FK to users.id)
  - joined_at (DateTime)
  - admitted_at (DateTime, nullable)
  - rejected_at (DateTime, nullable)
  - status (Enum: waiting, admitted, rejected)

- New table: meeting_agendas
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - items (JSONB) - array of { title, duration_minutes, presenter, notes }
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)
  - updated_at (DateTime)

- Enhance meetings table:
  - waiting_room_enabled (Boolean, default: False)
  - is_locked (Boolean, default: False)
  - locked_at (DateTime, nullable)
  - screen_share_mode (Enum: anyone, host_only, host_and_cohosts)

API Endpoints:
- POST /api/v1/hosts/meetings/{meeting_id}/co-hosts
  - Body: { user_id }
  - Returns: Co-host added
- DELETE /api/v1/hosts/meetings/{meeting_id}/co-hosts/{user_id}
- GET /api/v1/hosts/meetings/{meeting_id}/waiting-room
  - Returns: List of waiting participants
- POST /api/v1/hosts/meetings/{meeting_id}/waiting-room/admit/{user_id}
  - Admits participant
- POST /api/v1/hosts/meetings/{meeting_id}/waiting-room/admit-all
  - Admits all waiting participants
- POST /api/v1/hosts/meetings/{meeting_id}/waiting-room/reject/{user_id}
  - Rejects participant
- POST /api/v1/hosts/meetings/{meeting_id}/lock
  - Locks meeting (no new participants)
- POST /api/v1/hosts/meetings/{meeting_id}/unlock
- POST /api/v1/hosts/meetings/{meeting_id}/agenda
  - Body: { items }
  - Returns: Created agenda
- GET /api/v1/meetings/{meeting_id}/agenda
  - Returns: Meeting agenda (visible to all participants)

Frontend Components:
- WaitingRoomPanel component with:
  - List of waiting participants
  - Admit button per participant
  - Admit all button
  - Reject button per participant
- CoHostManager component
- MeetingLockToggle component
- AgendaEditor component with:
  - Add agenda item button
  - Reorder items (drag & drop)
  - Time allocations
- AgendaDisplay component (for participants)
- ScreenShareControls component

Frontend Pages:
- Enhance meeting creation with waiting room and screen share settings
- Add waiting room panel to active meeting page (for hosts)
- New /meetings/{meeting_id}/agenda - Agenda editor
```

**Acceptance Criteria**:
- [ ] Waiting room holds participants until admitted
- [ ] Participants see "waiting for host" message
- [ ] Hosts receive notifications when participants join waiting room
- [ ] Admitted participants immediately join meeting
- [ ] Co-hosts have same permissions as host except deleting meeting
- [ ] Locked meetings reject new join attempts
- [ ] Screen share permissions are enforced
- [ ] Agenda is visible to all participants
- [ ] Agenda items can be marked as complete during meeting

---

#### 1.2 Meeting Templates & Scheduling
**Description**: Reusable meeting templates and calendar integration

**User Stories**:
- As a host, I want to create meeting templates for recurring meetings
- As a host, I want to schedule recurring meetings
- As a host, I want to integrate with my calendar (Google, Outlook)
- As a host, I want to send calendar invites to participants
- As a host, I want to see my upcoming meetings in a calendar view

**Technical Requirements**:
```
Database Schema:
- New table: meeting_templates
  - id (UUID, PK)
  - host_id (UUID, FK to users.id)
  - name (String)
  - description (Text, nullable)
  - default_title (String)
  - default_duration_minutes (Integer)
  - default_max_participants (Integer, nullable)
  - default_avatar_provider (String, nullable)
  - default_settings (JSONB) - waiting room, translation, etc.
  - default_participants (JSONB) - array of emails
  - created_at (DateTime)

- New table: recurring_host_meetings (similar to teacher recurring meetings)
  - id (UUID, PK)
  - template_id (UUID, FK to meeting_templates.id, nullable)
  - host_id (UUID, FK to users.id)
  - recurrence_pattern (Enum: daily, weekly, biweekly, monthly)
  - recurrence_config (JSONB)
  - start_date (Date)
  - end_date (Date, nullable)
  - is_active (Boolean)

- New table: calendar_integrations
  - id (UUID, PK)
  - user_id (UUID, FK to users.id)
  - provider (Enum: google, outlook, apple)
  - access_token (String, encrypted)
  - refresh_token (String, encrypted)
  - calendar_id (String)
  - is_active (Boolean)
  - created_at (DateTime)
  - updated_at (DateTime)

API Endpoints:
- POST /api/v1/hosts/meeting-templates
  - Body: Template data
  - Returns: Created template
- GET /api/v1/hosts/meeting-templates
- POST /api/v1/hosts/meetings/from-template/{template_id}
- POST /api/v1/hosts/recurring-meetings
  - Body: { template_id, recurrence_pattern, schedule }
  - Returns: Recurring meeting with instances
- GET /api/v1/hosts/calendar
  - Query params: start_date, end_date
  - Returns: All scheduled meetings in date range
- POST /api/v1/hosts/calendar/integrate
  - Body: { provider, auth_code }
  - Returns: Integration created
- POST /api/v1/hosts/meetings/{meeting_id}/send-invites
  - Creates calendar events for participants
  - Returns: Invites sent confirmation

Frontend Components:
- MeetingTemplateCard component
- TemplateSelector component
- RecurringMeetingScheduler component
- CalendarView component (monthly/weekly/daily)
- CalendarIntegrationSettings component
- InviteComposer component

Frontend Pages:
- New /host/templates - Meeting templates
- New /host/calendar - Calendar view
- New /host/recurring - Recurring meetings
- Enhance meeting creation with template selection
```

**Acceptance Criteria**:
- [ ] Templates save all meeting configurations
- [ ] Creating from template pre-fills form
- [ ] Recurring meetings generate instances correctly
- [ ] Calendar view shows all scheduled meetings
- [ ] Calendar integration syncs both ways
- [ ] Participants receive calendar invites via email
- [ ] Invites include meeting link and details
- [ ] Timezone handling is correct

---

#### 1.3 Participant Management & Controls
**Description**: Enhanced participant management during meetings

**User Stories**:
- As a host, I want to see all participants with their status
- As a host, I want to mute/unmute participants
- As a host, I want to remove disruptive participants
- As a host, I want to pin important speakers
- As a host, I want to send private messages to participants
- As a host, I want to see participant engagement metrics

**Technical Requirements**:
```
Database Schema:
- Enhance meeting_participants table:
  - is_muted_by_host (Boolean, default: False)
  - is_pinned (Boolean, default: False)
  - engagement_score (Integer, 0-100) - based on activity
  - messages_sent (Integer, default: 0)
  - reactions_sent (Integer, default: 0)

- New table: participant_actions
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - action_type (Enum: muted, unmuted, removed, pinned, unpinned, messaged)
  - performed_by (UUID, FK to users.id)
  - timestamp (DateTime)

API Endpoints:
- GET /api/v1/hosts/meetings/{meeting_id}/participants
  - Returns: Participants with detailed status and metrics
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/mute
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/unmute
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/remove
  - Body: { reason: string }
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/pin
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/unpin
- POST /api/v1/hosts/meetings/{meeting_id}/participants/{participant_id}/message
  - Body: { message: string }
  - Sends private message via data channel

Frontend Components:
- EnhancedParticipantList component with:
  - Participant status indicators (mic, camera, speaking)
  - Engagement score visualization
  - Quick actions (mute, pin, message, remove)
  - Search and filter
- ParticipantCard component
- EngagementMeter component
- PrivateMessageDialog component

Frontend Pages:
- Enhance active meeting page with participant panel
```

**Acceptance Criteria**:
- [ ] All participant actions work in real-time
- [ ] Muted participants see indicator
- [ ] Pinned participants appear first in list
- [ ] Private messages are only visible to recipient
- [ ] Removed participants are disconnected immediately
- [ ] Engagement scores update based on activity
- [ ] Host actions are logged
- [ ] Participants can request to unmute (if host-muted)

---

### Priority 2: Meeting Insights & Analytics

#### 2.1 Meeting Analytics & Reports
**Description**: Comprehensive analytics for meeting effectiveness

**User Stories**:
- As a host, I want to see meeting analytics after meetings end
- As a host, I want to see participant engagement metrics
- As a host, I want to see translation usage statistics
- As a host, I want to export meeting reports
- As a host, I want to see trends across my meetings

**Technical Requirements**:
```
Database Schema:
- Enhance meeting_analytics table:
  - avg_engagement_score (Float)
  - chat_participation_rate (Float)
  - video_participation_rate (Float)
  - audio_participation_rate (Float)
  - most_active_participants (JSONB)
  - language_distribution (JSONB)
  - peak_concurrent_participants (Integer)
  - peak_time (DateTime, nullable)

- New table: participant_analytics
  - id (UUID, PK)
  - participant_id (UUID, FK to meeting_participants.id)
  - mic_on_duration_seconds (Integer)
  - camera_on_duration_seconds (Integer)
  - speaking_duration_seconds (Integer)
  - chat_messages_sent (Integer)
  - reactions_count (Integer)
  - engagement_score (Integer)
  - created_at (DateTime)

API Endpoints:
- GET /api/v1/hosts/meetings/{meeting_id}/analytics
  - Returns: Comprehensive meeting analytics
- GET /api/v1/hosts/meetings/{meeting_id}/participant-analytics
  - Returns: Per-participant analytics
- GET /api/v1/hosts/analytics/summary
  - Query params: start_date, end_date
  - Returns: Aggregate analytics across all meetings
- GET /api/v1/hosts/analytics/trends
  - Returns: Trends over time (participation, engagement, duration)
- POST /api/v1/hosts/meetings/{meeting_id}/export-report
  - Query params: format (pdf, csv)
  - Returns: Downloadable report

Frontend Components:
- MeetingAnalyticsDashboard component with:
  - Key metrics cards
  - Participant timeline chart
  - Language distribution pie chart
  - Engagement heatmap
- ParticipantAnalyticsTable component
- TrendsChart component
- ReportExporter component

Frontend Pages:
- New /host/meetings/{meeting_id}/analytics - Detailed analytics
- New /host/analytics - Analytics hub with trends
```

**Acceptance Criteria**:
- [ ] Analytics are calculated automatically after meeting ends
- [ ] Participant-level metrics are accurate
- [ ] Engagement scores reflect actual participation
- [ ] Reports are exportable in PDF and CSV
- [ ] Trends show data over custom date ranges
- [ ] Analytics are accessible for past 90 days minimum

---

## Part 2: Participant Persona Enhancements

### Current Participant Capabilities

**Existing Features**:
- Join meetings with meeting ID
- Select language preference (14+ languages)
- Real-time translation (audio and captions)
- Video conferencing (camera, mic, speaker)
- Chat with translation
- Change language during meeting
- View participant list
- Leave meeting

**Note**: Hand-raising feature (demonstrated in `examples/Platform/classroom-meet`) is a proposed enhancement for classroom participants (see Interactive Features below).

---

## Participant Enhancement Specifications

### Priority 1: Enhanced Meeting Experience

#### 1.1 Pre-Meeting Features
**Description**: Better preparation before joining meetings

**User Stories**:
- As a participant, I want to test my audio/video before joining
- As a participant, I want to see meeting details before joining
- As a participant, I want to set my display name and profile picture
- As a participant, I want to see who else is invited
- As a participant, I want to RSVP to meeting invitations

**Technical Requirements**:
```
Database Schema:
- New table: participant_profiles
  - user_id (UUID, PK, FK to users.id)
  - display_name (String)
  - profile_picture_url (String, nullable)
  - bio (Text, nullable)
  - updated_at (DateTime)

- New table: meeting_invitations
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - invitee_email (String)
  - invitee_user_id (UUID, FK to users.id, nullable)
  - invitation_message (Text, nullable)
  - rsvp_status (Enum: pending, accepted, declined, tentative)
  - rsvp_at (DateTime, nullable)
  - invited_by (UUID, FK to users.id)
  - invited_at (DateTime)

API Endpoints:
- PUT /api/v1/participants/profile
  - Body: { display_name, profile_picture_url, bio }
  - Returns: Updated profile
- GET /api/v1/participants/profile
- GET /api/v1/meetings/{meeting_id}/preview
  - Returns: {
      title,
      description,
      scheduled_at,
      duration_minutes,
      host_name,
      participant_count,
      translation_enabled,
      supported_languages
    }
- GET /api/v1/participants/invitations
  - Returns: All meeting invitations for user
- POST /api/v1/participants/invitations/{invitation_id}/rsvp
  - Body: { status: "accepted" | "declined" | "tentative" }
  - Returns: Updated invitation
- POST /api/v1/participants/test-devices
  - Initiates device test session
  - Returns: Test session info

Frontend Components:
- DeviceTestPanel component with:
  - Camera preview
  - Microphone level indicator
  - Speaker test button
  - Device selectors
- MeetingPreview component showing:
  - Meeting details
  - Host information
  - Invited participants
  - Agenda (if available)
- ProfileEditor component
- RSVPButtons component

Frontend Pages:
- New /participants/profile - Profile editor
- New /participants/invitations - Meeting invitations
- New /meeting/preview/{meeting_id} - Pre-join preview with device test
- Enhance /meeting/join with device test option
```

**Acceptance Criteria**:
- [ ] Device test works without joining meeting
- [ ] Camera preview shows actual camera feed
- [ ] Microphone test shows volume levels
- [ ] Speaker test plays audible sound
- [ ] Profile picture appears in participant list
- [ ] RSVP status is visible to host
- [ ] Meeting preview shows accurate information
- [ ] Preview is accessible before scheduled time

---

#### 1.2 In-Meeting Enhancements
**Description**: Better meeting experience and interaction tools

**User Stories**:
- As a participant, I want to react with emojis during meeting
- As a participant, I want to view shared screen in fullscreen
- As a participant, I want to change my background (blur/virtual)
- As a participant, I want to see who is speaking
- As a participant, I want to adjust individual participant volumes
- As a participant, I want to take personal notes during meeting

**Technical Requirements**:
```
Database Schema:
- New table: meeting_reactions
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - reaction_type (Enum: thumbs_up, applause, heart, laugh, thinking, raised_hand)
  - created_at (DateTime)

- New table: participant_notes
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - note_content (Text)
  - created_at (DateTime)
  - updated_at (DateTime)

- New table: participant_settings
  - user_id (UUID, PK, FK to users.id)
  - default_language (String)
  - virtual_background_enabled (Boolean, default: False)
  - virtual_background_url (String, nullable)
  - background_blur_enabled (Boolean, default: False)
  - noise_cancellation_enabled (Boolean, default: True)
  - auto_mute_on_join (Boolean, default: False)
  - auto_video_off_on_join (Boolean, default: False)

API Endpoints:
- POST /api/v1/participants/meetings/{meeting_id}/react
  - Body: { reaction_type }
  - Returns: Reaction created
- POST /api/v1/participants/meetings/{meeting_id}/notes
  - Body: { note_content }
  - Returns: Note saved
- GET /api/v1/participants/meetings/{meeting_id}/notes
  - Returns: Participant's notes for meeting
- GET /api/v1/participants/settings
  - Returns: Participant settings
- PUT /api/v1/participants/settings
  - Body: Updated settings
  - Returns: Updated settings

Frontend Components:
- ReactionBar component with:
  - Emoji buttons
  - Animation for reactions
  - Reaction count display
- BackgroundSelector component with:
  - Blur toggle
  - Virtual background selector
  - Upload custom background
- NotesPanel component with:
  - Rich text editor
  - Auto-save
  - Timestamp insertion
  - Export notes button
- SpeakingIndicator component
- ParticipantVolumeControls component
- FullscreenToggle component

Frontend Pages:
- New /participants/settings - Participant settings
- Enhance meeting room with:
  - Reaction bar
  - Notes panel (collapsible sidebar)
  - Background controls
  - Volume controls
```

**Acceptance Criteria**:
- [ ] Reactions appear for all participants in real-time
- [ ] Reactions disappear after 3-5 seconds
- [ ] Background blur works on supported browsers
- [ ] Virtual backgrounds apply without lag
- [ ] Notes auto-save every 30 seconds
- [ ] Notes are exportable to text/markdown
- [ ] Speaking indicator highlights active speaker
- [ ] Volume controls only affect local playback
- [ ] Fullscreen mode works for screen shares

---

#### 1.3 Translation & Accessibility
**Description**: Enhanced translation and accessibility features

**User Stories**:
- As a participant, I want to toggle captions on/off
- As a participant, I want to adjust caption size and position
- As a participant, I want to see original language alongside translation
- As a participant, I want to download meeting transcript
- As a participant, I want to enable keyboard shortcuts
- As a participant, I want high-contrast mode for accessibility

**Technical Requirements**:
```
Database Schema:
- Enhance participant_settings table:
  - captions_enabled (Boolean, default: True)
  - caption_size (Enum: small, medium, large)
  - caption_position (Enum: top, bottom)
  - show_original_language (Boolean, default: False)
  - keyboard_shortcuts_enabled (Boolean, default: True)
  - high_contrast_mode (Boolean, default: False)
  - font_size_multiplier (Float, default: 1.0)

- New table: meeting_transcripts
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - language (String)
  - transcript_data (JSONB) - array of { speaker, text, timestamp }
  - generated_at (DateTime)

API Endpoints:
- GET /api/v1/participants/meetings/{meeting_id}/transcript
  - Query params: language
  - Returns: Transcript in requested language
- POST /api/v1/participants/meetings/{meeting_id}/download-transcript
  - Query params: format (txt, srt, vtt, json)
  - Returns: Downloadable transcript file
- GET /api/v1/participants/keyboard-shortcuts
  - Returns: List of available shortcuts

Frontend Components:
- CaptionControls component with:
  - On/off toggle
  - Size selector
  - Position selector
  - Show original toggle
- EnhancedCaptionsDisplay component with:
  - Adjustable size
  - Adjustable position
  - Original + translation display
- TranscriptViewer component
- AccessibilitySettings component
- KeyboardShortcutsDialog component

Frontend Pages:
- Enhance /participants/settings with accessibility section
- Add caption controls to meeting room toolbar
- New /meetings/{meeting_id}/transcript - View/download transcript
```

**Acceptance Criteria**:
- [ ] Captions can be toggled on/off
- [ ] Caption size changes immediately
- [ ] Caption position can be top or bottom
- [ ] Original language shows alongside translation (if enabled)
- [ ] Transcripts are available after meeting ends
- [ ] Transcript formats (TXT, SRT, VTT) are valid
- [ ] Keyboard shortcuts work for common actions
  - M: Mute/unmute
  - V: Video on/off
  - R: Raise hand
  - Ctrl+D: Toggle captions
  - Ctrl+E: Open emoji reactions
- [ ] High-contrast mode meets WCAG AA standards

---

### Priority 2: Post-Meeting Features

#### 2.1 Meeting History & Recordings
**Description**: Access to past meetings and recordings

**User Stories**:
- As a participant, I want to see my meeting history
- As a participant, I want to access recordings of meetings I attended
- As a participant, I want to review notes from past meetings
- As a participant, I want to download transcripts
- As a participant, I want to see meeting summaries

**Technical Requirements**:
```
Database Schema:
- New table: meeting_summaries
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - summary_text (Text)
  - key_points (JSONB) - array of key points
  - action_items (JSONB) - array of action items
  - generated_by (Enum: ai, host)
  - generated_at (DateTime)

API Endpoints:
- GET /api/v1/participants/meeting-history
  - Query params: start_date, end_date, limit, offset
  - Returns: Paginated list of attended meetings
- GET /api/v1/participants/meetings/{meeting_id}/details
  - Returns: Full meeting details, notes, transcript availability
- GET /api/v1/participants/meetings/{meeting_id}/summary
  - Returns: Meeting summary with key points and action items
- GET /api/v1/participants/meetings/{meeting_id}/materials
  - Returns: Materials shared during/after meeting

Frontend Components:
- MeetingHistoryList component with:
  - Meeting cards with date, title, host
  - Filter by date range
  - Search by title/host
- MeetingDetailsCard component
- MeetingSummaryDisplay component
- ActionItemsList component

Frontend Pages:
- New /participants/history - Meeting history
- New /participants/meetings/{meeting_id} - Meeting details with:
  - Summary
  - Notes
  - Transcript
  - Recording (if available)
  - Shared materials
```

**Acceptance Criteria**:
- [ ] Meeting history shows all attended meetings
- [ ] History is paginated for performance
- [ ] Search and filter work correctly
- [ ] Recording access respects permissions
- [ ] Summaries accurately capture key points
- [ ] Action items are clearly listed
- [ ] Materials are downloadable

---

#### 2.2 Feedback & Ratings
**Description**: Provide feedback on meetings and hosts

**User Stories**:
- As a participant, I want to rate meeting quality
- As a participant, I want to provide feedback to the host
- As a participant, I want to report issues or inappropriate behavior
- As a participant, I want to see if my feedback was acknowledged

**Technical Requirements**:
```
Database Schema:
- New table: meeting_ratings
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - overall_rating (Integer) - 1-5 stars
  - audio_quality_rating (Integer, nullable)
  - video_quality_rating (Integer, nullable)
  - translation_quality_rating (Integer, nullable)
  - host_effectiveness_rating (Integer, nullable)
  - feedback_text (Text, nullable)
  - is_anonymous (Boolean, default: False)
  - created_at (DateTime)

- New table: meeting_reports
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - reported_by (UUID, FK to users.id)
  - report_type (Enum: technical_issue, inappropriate_behavior, spam, other)
  - description (Text)
  - status (Enum: pending, under_review, resolved, dismissed)
  - resolved_by (UUID, FK to users.id, nullable)
  - resolved_at (DateTime, nullable)
  - resolution_notes (Text, nullable)
  - created_at (DateTime)

API Endpoints:
- POST /api/v1/participants/meetings/{meeting_id}/rate
  - Body: {
      overall_rating,
      audio_quality_rating,
      video_quality_rating,
      translation_quality_rating,
      host_effectiveness_rating,
      feedback_text,
      is_anonymous
    }
  - Returns: Rating submitted
- POST /api/v1/participants/meetings/{meeting_id}/report
  - Body: { report_type, description }
  - Returns: Report submitted
- GET /api/v1/hosts/meetings/{meeting_id}/ratings
  - Returns: All ratings for meeting (for host)
- GET /api/v1/admin/reports
  - Returns: All reports (for admins)
- PUT /api/v1/admin/reports/{report_id}/resolve
  - Body: { resolution_notes }
  - Returns: Resolved report

Frontend Components:
- MeetingRatingDialog component with:
  - Star ratings for categories
  - Text feedback area
  - Anonymous checkbox
  - Submit button
- ReportIssueDialog component
- RatingsDisplay component (for hosts)

Frontend Pages:
- Post-meeting rating prompt (modal)
- Enhance /host/meetings/{meeting_id}/analytics with ratings section
- New /admin/reports - Report management (admin only)
```

**Acceptance Criteria**:
- [ ] Rating dialog appears after leaving meeting
- [ ] Ratings can be anonymous
- [ ] Hosts can see aggregated ratings
- [ ] Individual ratings are anonymous if selected
- [ ] Reports are submitted to admins
- [ ] Admins can review and resolve reports
- [ ] Participants receive confirmation of report submission
- [ ] Feedback helps improve host performance

---

### Priority 3: Collaboration & Engagement

#### 3.1 Interactive Features
**Description**: Enhanced collaboration tools during meetings

**User Stories**:
- As a participant, I want to use a shared whiteboard
- As a participant, I want to collaborate on documents in real-time
- As a participant, I want to create and vote on polls
- As a participant, I want to ask questions in Q&A
- As a participant, I want to create breakout discussions

**Technical Requirements**:
```
Database Schema:
- New table: whiteboard_data (if not created for teachers)
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - canvas_data (JSONB)
  - version (Integer)
  - updated_by (UUID, FK to users.id)
  - updated_at (DateTime)

- New table: collaborative_documents
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - title (String)
  - content (Text) - using CRDT or operational transformation
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)
  - updated_at (DateTime)

- New table: qa_questions
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - question_text (Text)
  - asked_by (UUID, FK to users.id)
  - is_anonymous (Boolean)
  - upvotes (Integer, default: 0)
  - is_answered (Boolean, default: False)
  - answer_text (Text, nullable)
  - answered_by (UUID, FK to users.id, nullable)
  - answered_at (DateTime, nullable)
  - created_at (DateTime)

- New table: qa_upvotes
  - question_id (UUID, FK to qa_questions.id)
  - user_id (UUID, FK to users.id)
  - PK: (question_id, user_id)

API Endpoints:
- POST /api/v1/meetings/{meeting_id}/whiteboard/update
  - Body: { canvas_data, version }
  - Returns: Updated whiteboard
- GET /api/v1/meetings/{meeting_id}/whiteboard
  - Returns: Current whiteboard state
- WebSocket /ws/meetings/{meeting_id}/whiteboard for real-time updates
- POST /api/v1/meetings/{meeting_id}/documents
  - Body: { title, initial_content }
  - Returns: Created document
- GET /api/v1/meetings/{meeting_id}/documents
- PUT /api/v1/meetings/{meeting_id}/documents/{doc_id}
  - Body: { operations } - CRDT operations
  - Returns: Updated document
- WebSocket /ws/meetings/{meeting_id}/documents/{doc_id} for real-time collaboration
- POST /api/v1/meetings/{meeting_id}/qa/questions
  - Body: { question_text, is_anonymous }
  - Returns: Created question
- POST /api/v1/meetings/{meeting_id}/qa/questions/{question_id}/upvote
- POST /api/v1/meetings/{meeting_id}/qa/questions/{question_id}/answer
  - Body: { answer_text }
  - Returns: Answered question
- GET /api/v1/meetings/{meeting_id}/qa/questions
  - Returns: All questions sorted by upvotes

Frontend Components:
- WhiteboardCanvas component with:
  - Drawing tools
  - Shapes
  - Text
  - Eraser
  - Colors
  - Undo/redo
  - Save/export
- CollaborativeEditor component
- QAPanel component with:
  - Question list sorted by upvotes
  - Ask question button
  - Upvote buttons
  - Answer display
- QAModeration component (for hosts)

Frontend Pages:
- Add whiteboard tab to meeting room
- Add collaborative docs tab to meeting room
- Add Q&A tab to meeting room
```

**Acceptance Criteria**:
- [ ] Whiteboard updates in real-time for all participants
- [ ] Drawing is smooth and responsive
- [ ] Collaborative editor shows other participants' cursors
- [ ] Document changes sync without conflicts
- [ ] Questions can be anonymous
- [ ] Upvoting increases question priority
- [ ] Hosts can mark questions as answered
- [ ] Q&A list updates in real-time

---

## Implementation Priority Summary

### Host Enhancements - Must Have (P1)
1. Advanced Meeting Features (waiting room, co-hosts, lock)
2. Meeting Templates & Scheduling
3. Participant Management & Controls

### Host Enhancements - Should Have (P2)
4. Meeting Analytics & Reports

### Participant Enhancements - Must Have (P1)
5. Pre-Meeting Features (device test, preview, RSVP)
6. In-Meeting Enhancements (reactions, notes, backgrounds)
7. Translation & Accessibility

### Participant Enhancements - Should Have (P2)
8. Meeting History & Recordings
9. Feedback & Ratings

### Participant Enhancements - Nice to Have (P3)
10. Interactive Features (whiteboard, Q&A, collaborative docs)

---

## Estimated Development Effort

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| **Host Features** |
| Advanced Meeting Features | 5 days | 5 days | 2 days | 12 days |
| Meeting Templates | 4 days | 4 days | 2 days | 10 days |
| Participant Management | 4 days | 4 days | 1 day | 9 days |
| Meeting Analytics | 4 days | 5 days | 2 days | 11 days |
| **Participant Features** |
| Pre-Meeting Features | 4 days | 4 days | 2 days | 10 days |
| In-Meeting Enhancements | 5 days | 6 days | 2 days | 13 days |
| Translation & Accessibility | 4 days | 5 days | 2 days | 11 days |
| Meeting History | 3 days | 4 days | 1 day | 8 days |
| Feedback & Ratings | 3 days | 3 days | 1 day | 7 days |
| Interactive Features | 6 days | 7 days | 2 days | 15 days |
| **TOTAL** | **42 days** | **47 days** | **17 days** | **106 days** |

---

## Success Metrics

### Host Success Metrics
1. **Meeting Management**
   - Waiting room admit time <10 seconds
   - Co-host feature usage >40%
   - Template reuse rate >60%

2. **Engagement**
   - Participant engagement score >70%
   - Mute/unmute response time <2 seconds
   - Screen share success rate >98%

3. **Analytics**
   - Report generation time <15 seconds
   - Analytics accuracy 100%
   - Host satisfaction with insights >4/5

### Participant Success Metrics
1. **Pre-Meeting**
   - Device test completion rate >80%
   - RSVP response rate >70%
   - Join success rate >95%

2. **In-Meeting**
   - Reaction usage >50% of meetings
   - Notes taken in >30% of meetings
   - Caption usage >40% of participants

3. **Post-Meeting**
   - Rating completion rate >60%
   - Transcript download rate >25%
   - Recording view rate >40%

4. **Accessibility**
   - Keyboard shortcut usage >20%
   - Caption customization >30%
   - High-contrast mode usage >5%
