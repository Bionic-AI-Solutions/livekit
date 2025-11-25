# Teacher Persona - Enhancement Specifications

**Platform**: Agents-Meetings (all enhancements apply to this codebase only)

**Context**: Agents-Meetings supports two meeting types via the `meeting_type` enum:
- **classroom**: Teacher-led meetings with AI avatar hosts
- **meeting**: Regular meetings with human or avatar hosts

All teacher enhancements below add functionality to classroom meetings within Agents-Meetings.

---

## Current Teacher Capabilities

### Existing Features
- Create classroom meetings with AI avatar hosts
- Configure avatar provider (BitHuman, Anam, Tavus, Hedra)
- Set max participants
- Enable/disable translation
- Configure supported languages
- Schedule meetings with duration
- View own created meetings
- Join meetings as teacher
- End own meetings

### Existing Pages (in Agents-Meetings Frontend)
- Admin pages for meeting creation
- Meeting join/room pages (shared with all meeting types)

**Note**: Advanced classroom controls exist in `examples/Platform/classroom-meet` as a reference implementation. All enhancements below will be built into the Agents-Meetings platform.

---

## Enhancement Specifications

### Priority 1: Enhanced Classroom Management

#### 1.1 Advanced Classroom Creation & Templates
**Description**: Streamlined classroom creation with templates and recurring meetings

**User Stories**:
- As a teacher, I want to create classroom templates for recurring classes
- As a teacher, I want to schedule recurring classrooms (daily, weekly)
- As a teacher, I want to duplicate past classrooms
- As a teacher, I want to save default settings for my classrooms
- As a teacher, I want to pre-assign students to classrooms

**Technical Requirements**:
```
Database Schema:
- New table: classroom_templates
  - id (UUID, PK)
  - teacher_id (UUID, FK to users.id)
  - name (String)
  - description (Text, nullable)
  - max_participants (Integer)
  - avatar_provider (String)
  - avatar_config (JSONB)
  - translation_enabled (Boolean)
  - supported_languages (JSONB)
  - default_duration_minutes (Integer)
  - preset_participants (JSONB) - array of user IDs or emails
  - created_at (DateTime)
  - updated_at (DateTime)

- New table: recurring_meetings
  - id (UUID, PK)
  - template_id (UUID, FK to classroom_templates.id)
  - teacher_id (UUID, FK to users.id)
  - recurrence_pattern (Enum: daily, weekly, biweekly, monthly)
  - recurrence_days (JSONB) - for weekly: [1,3,5] for Mon/Wed/Fri
  - start_time (Time)
  - end_time (Time)
  - start_date (Date)
  - end_date (Date, nullable)
  - timezone (String)
  - is_active (Boolean)
  - created_at (DateTime)

- New table: recurring_meeting_instances
  - id (UUID, PK)
  - recurring_meeting_id (UUID, FK to recurring_meetings.id)
  - meeting_id (UUID, FK to meetings.id)
  - scheduled_date (Date)
  - scheduled_start (DateTime)
  - scheduled_end (DateTime)
  - status (Enum: pending, active, completed, cancelled)
  - created_at (DateTime)

API Endpoints:
- POST /api/v1/teachers/classroom-templates
  - Body: { name, description, config }
  - Returns: Created template
- GET /api/v1/teachers/classroom-templates
  - Returns: Teacher's templates
- PUT /api/v1/teachers/classroom-templates/{id}
  - Body: Updated template data
  - Returns: Updated template
- DELETE /api/v1/teachers/classroom-templates/{id}
- POST /api/v1/teachers/classrooms/from-template/{template_id}
  - Body: { scheduled_at, overrides }
  - Returns: Created classroom
- POST /api/v1/teachers/recurring-meetings
  - Body: { template_id, recurrence_pattern, schedule }
  - Returns: Created recurring meeting with instances
- GET /api/v1/teachers/recurring-meetings
  - Returns: Teacher's recurring meetings
- PUT /api/v1/teachers/recurring-meetings/{id}
  - Body: Updated recurrence data
  - Returns: Updated recurring meeting
- POST /api/v1/teachers/recurring-meetings/{id}/instances
  - Regenerate instances after updates
  - Returns: New instances
- GET /api/v1/teachers/calendar
  - Query params: start_date, end_date
  - Returns: All scheduled classrooms in calendar format
- POST /api/v1/teachers/classrooms/{id}/duplicate
  - Creates copy of classroom for new date
  - Returns: Duplicated classroom

Frontend Components:
- ClassroomTemplateCard component
- TemplateSelector component
- RecurringMeetingForm component with:
  - Recurrence pattern selector
  - Day of week selector (for weekly/biweekly)
  - Time picker
  - Date range picker
  - Timezone selector
- ClassroomCalendar component showing:
  - Monthly/weekly/daily views
  - Scheduled classrooms
  - Recurring series indicators
  - Quick actions (edit, cancel)
- QuickCreateClassroom component (from template)
- DefaultSettingsForm component

Frontend Pages:
- New /teacher/templates - Manage classroom templates
- New /teacher/recurring - Manage recurring classrooms
- New /teacher/calendar - Calendar view of all classrooms
- Enhance /teacher/classrooms/new with:
  - Template selector
  - Recurring option
  - Student pre-assignment
  - Quick create from defaults
```

**Acceptance Criteria**:
- [ ] Templates save all classroom settings
- [ ] Creating from template pre-fills all fields
- [ ] Recurring meetings generate instances correctly
- [ ] Calendar shows all scheduled and recurring classrooms
- [ ] Duplicating classroom copies all settings except date
- [ ] Default settings are remembered per teacher
- [ ] Pre-assigned students receive invitations automatically
- [ ] Updating recurring series updates all future instances

---

#### 1.2 Student Management & Roster
**Description**: Comprehensive student management for teachers

**User Stories**:
- As a teacher, I want to maintain a roster of my students
- As a teacher, I want to add students to classrooms in bulk
- As a teacher, I want to track student attendance
- As a teacher, I want to see student participation metrics
- As a teacher, I want to group students (e.g., by class, grade)

**Technical Requirements**:
```
Database Schema:
- New table: teacher_students
  - teacher_id (UUID, FK to users.id)
  - student_id (UUID, FK to users.id)
  - student_group (String, nullable) - e.g., "Grade 10A"
  - notes (Text, nullable)
  - added_at (DateTime)
  - PK: (teacher_id, student_id)

- New table: student_groups
  - id (UUID, PK)
  - teacher_id (UUID, FK to users.id)
  - name (String)
  - description (Text, nullable)
  - color (String, nullable) - for UI coding
  - created_at (DateTime)

- New table: student_group_members
  - group_id (UUID, FK to student_groups.id)
  - student_id (UUID, FK to users.id)
  - PK: (group_id, student_id)

- Enhance meeting_participants table:
  - attendance_status (Enum: present, absent, late, left_early)
  - attendance_duration_minutes (Integer)
  - participation_score (Integer, 0-100) - based on activity

API Endpoints:
- POST /api/v1/teachers/students
  - Body: { student_ids: UUID[], group_id?: UUID }
  - Returns: Added students
- GET /api/v1/teachers/students
  - Query params: group_id (optional)
  - Returns: Teacher's student roster
- DELETE /api/v1/teachers/students/{student_id}
  - Removes from roster (not system)
- POST /api/v1/teachers/students/import
  - Body: CSV file with emails
  - Returns: Import results (added, already exist, failed)
- POST /api/v1/teachers/groups
  - Body: { name, description, color }
  - Returns: Created group
- GET /api/v1/teachers/groups
  - Returns: Teacher's groups
- POST /api/v1/teachers/groups/{group_id}/students
  - Body: { student_ids: UUID[] }
  - Returns: Added students to group
- GET /api/v1/teachers/students/{student_id}/statistics
  - Returns: {
      total_classrooms_attended,
      total_attendance_duration,
      average_participation_score,
      attendance_rate,
      classrooms_list
    }
- POST /api/v1/teachers/classrooms/{meeting_id}/add-group
  - Body: { group_id: UUID }
  - Adds all students from group to classroom
- GET /api/v1/teachers/classrooms/{meeting_id}/attendance
  - Returns: Attendance report for classroom
- PUT /api/v1/teachers/classrooms/{meeting_id}/attendance/{participant_id}
  - Body: { attendance_status, notes }
  - Returns: Updated attendance

Frontend Components:
- StudentRosterTable component with:
  - Student list with groups
  - Search and filter
  - Bulk select
  - Add to classroom button
  - View statistics link
- StudentGroupManager component
- StudentImportDialog component
- StudentStatisticsCard component showing:
  - Attendance rate
  - Participation score
  - Total classrooms
  - Recent activity
- AttendanceTracker component
- AttendanceReport component with:
  - Present/Absent/Late counts
  - Student-by-student status
  - Export attendance
- BulkAddStudents component

Frontend Pages:
- New /teacher/students - Student roster management with:
  - Student list
  - Group management
  - Import students
  - Statistics
- New /teacher/students/{student_id} - Student detail with:
  - Personal info
  - Attendance history
  - Participation metrics
  - Notes
- New /teacher/classrooms/{meeting_id}/attendance - Attendance tracking
```

**Acceptance Criteria**:
- [ ] Teachers can maintain a roster of students
- [ ] Students can be organized into groups
- [ ] Bulk import from CSV works correctly
- [ ] Adding a group to classroom adds all members
- [ ] Attendance is tracked automatically (join/leave times)
- [ ] Teachers can manually mark attendance status
- [ ] Student statistics are accurate
- [ ] Attendance reports are exportable
- [ ] Search and filter work on large rosters (100+ students)

---

#### 1.3 In-Classroom Controls & Features
**Description**: Enhanced teacher controls during active classroom

**User Stories**:
- As a teacher, I want to mute/unmute individual students
- As a teacher, I want to spotlight a student's video
- As a teacher, I want to enable/disable student features (chat, camera, screen share)
- As a teacher, I want to create breakout rooms for group work
- As a teacher, I want to conduct polls during class
- As a teacher, I want to share files with students

**Technical Requirements**:
```
Database Schema:
- New table: classroom_settings
  - meeting_id (UUID, PK, FK to meetings.id)
  - students_can_unmute (Boolean, default: True)
  - students_can_share_video (Boolean, default: True)
  - students_can_share_screen (Boolean, default: False)
  - students_can_chat (Boolean, default: True)
  - students_can_private_chat (Boolean, default: False)
  - raise_hand_enabled (Boolean, default: True)
  - updated_by (UUID, FK to users.id)
  - updated_at (DateTime)

- New table: breakout_rooms
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - room_number (Integer)
  - livekit_room_name (String, unique)
  - duration_minutes (Integer)
  - status (Enum: active, closed)
  - started_at (DateTime)
  - ended_at (DateTime, nullable)
  - created_at (DateTime)

- New table: breakout_room_assignments
  - breakout_room_id (UUID, FK to breakout_rooms.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - joined_at (DateTime, nullable)
  - left_at (DateTime, nullable)
  - PK: (breakout_room_id, participant_id)

- New table: classroom_polls
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - question (Text)
  - options (JSONB) - array of option strings
  - allow_multiple (Boolean, default: False)
  - is_anonymous (Boolean, default: False)
  - status (Enum: draft, active, closed)
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)
  - closed_at (DateTime, nullable)

- New table: poll_responses
  - id (UUID, PK)
  - poll_id (UUID, FK to classroom_polls.id)
  - participant_id (UUID, FK to meeting_participants.id)
  - selected_options (JSONB) - array of selected option indices
  - created_at (DateTime)

- New table: classroom_files
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - file_name (String)
  - file_url (String)
  - file_size_bytes (Integer)
  - file_type (String)
  - uploaded_by (UUID, FK to users.id)
  - uploaded_at (DateTime)

API Endpoints:
- GET /api/v1/teachers/classrooms/{meeting_id}/settings
  - Returns: Classroom settings
- PUT /api/v1/teachers/classrooms/{meeting_id}/settings
  - Body: Updated settings
  - Returns: Updated settings
- POST /api/v1/teachers/classrooms/{meeting_id}/mute-participant/{participant_id}
  - Mutes specific participant
- POST /api/v1/teachers/classrooms/{meeting_id}/mute-all
  - Mutes all students
- POST /api/v1/teachers/classrooms/{meeting_id}/spotlight/{participant_id}
  - Spotlights participant video
- POST /api/v1/teachers/classrooms/{meeting_id}/breakout-rooms
  - Body: { room_count, duration_minutes, assignments }
  - Returns: Created breakout rooms
- POST /api/v1/teachers/classrooms/{meeting_id}/breakout-rooms/close
  - Closes all breakout rooms and returns students to main room
- POST /api/v1/teachers/classrooms/{meeting_id}/polls
  - Body: { question, options, allow_multiple, is_anonymous }
  - Returns: Created poll
- POST /api/v1/teachers/classrooms/{meeting_id}/polls/{poll_id}/open
  - Opens poll for voting
- POST /api/v1/teachers/classrooms/{meeting_id}/polls/{poll_id}/close
  - Closes poll
- GET /api/v1/teachers/classrooms/{meeting_id}/polls/{poll_id}/results
  - Returns: Poll results with counts and percentages
- POST /api/v1/teachers/classrooms/{meeting_id}/files
  - Body: File upload (multipart/form-data)
  - Returns: Uploaded file info
- GET /api/v1/teachers/classrooms/{meeting_id}/files
  - Returns: List of shared files
- DELETE /api/v1/teachers/classrooms/{meeting_id}/files/{file_id}

Frontend Components:
- TeacherControlPanel component with:
  - Mute all button
  - Unmute all button
  - Enable/disable features toggles
  - Breakout rooms button
  - Polls button
  - Files button
- ParticipantControlRow component (per student) with:
  - Mute/unmute button
  - Disable video button
  - Spotlight button
  - Remove button
- BreakoutRoomCreator component with:
  - Number of rooms selector
  - Auto-assign or manual assign
  - Duration picker
  - Room preview
- BreakoutRoomMonitor component showing:
  - All rooms with participant counts
  - Time remaining
  - Close all button
  - Broadcast message to all rooms
- PollCreator component
- PollResults component with:
  - Bar chart visualization
  - Percentage breakdown
  - Export results
- FileSharingPanel component with:
  - Upload button
  - File list with download links
  - Delete file button

Frontend Pages:
- Enhance /classroom/[roomName] with:
  - Teacher control panel (always visible for teachers)
  - Participant management sidebar
  - Polls panel
  - Files panel
  - Breakout room management
```

**Acceptance Criteria**:
- [ ] Teacher can mute individual students
- [ ] Mute all mutes all students except teacher
- [ ] Feature toggles immediately affect student capabilities
- [ ] Breakout rooms create separate LiveKit rooms
- [ ] Students automatically join assigned breakout rooms
- [ ] Closing breakout rooms returns all students to main room
- [ ] Polls display real-time results to teacher
- [ ] Students can respond to polls once (unless allow multiple)
- [ ] Anonymous polls don't show who voted for what
- [ ] File sharing supports common formats (PDF, DOC, PPT, images)
- [ ] File size limits are enforced (e.g., 10MB per file)
- [ ] All controls update in real-time for students

---

### Priority 2: Assessment & Feedback

#### 2.1 Quiz & Assessment Tools
**Description**: Conduct quizzes and assessments during or after class

**User Stories**:
- As a teacher, I want to create quizzes with multiple question types
- As a teacher, I want to conduct quizzes during class
- As a teacher, I want to grade quizzes automatically
- As a teacher, I want to see individual and class performance
- As a teacher, I want to export quiz results

**Technical Requirements**:
```
Database Schema:
- New table: quizzes
  - id (UUID, PK)
  - teacher_id (UUID, FK to users.id)
  - meeting_id (UUID, FK to meetings.id, nullable) - if conducted in a classroom
  - title (String)
  - description (Text, nullable)
  - time_limit_minutes (Integer, nullable)
  - passing_score (Integer, nullable) - percentage
  - show_correct_answers (Boolean, default: True)
  - shuffle_questions (Boolean, default: False)
  - status (Enum: draft, published, active, closed)
  - created_at (DateTime)
  - published_at (DateTime, nullable)

- New table: quiz_questions
  - id (UUID, PK)
  - quiz_id (UUID, FK to quizzes.id)
  - question_type (Enum: multiple_choice, true_false, short_answer, essay)
  - question_text (Text)
  - options (JSONB, nullable) - for multiple choice
  - correct_answer (JSONB) - varies by type
  - points (Integer)
  - order (Integer)
  - created_at (DateTime)

- New table: quiz_attempts
  - id (UUID, PK)
  - quiz_id (UUID, FK to quizzes.id)
  - student_id (UUID, FK to users.id)
  - started_at (DateTime)
  - submitted_at (DateTime, nullable)
  - score (Integer, nullable) - out of total points
  - percentage (Float, nullable)
  - status (Enum: in_progress, submitted, graded)
  - time_spent_minutes (Integer, nullable)

- New table: quiz_responses
  - id (UUID, PK)
  - attempt_id (UUID, FK to quiz_attempts.id)
  - question_id (UUID, FK to quiz_questions.id)
  - response (JSONB)
  - is_correct (Boolean, nullable)
  - points_earned (Integer, default: 0)
  - feedback (Text, nullable) - teacher feedback
  - graded_at (DateTime, nullable)

API Endpoints:
- POST /api/v1/teachers/quizzes
  - Body: { title, description, settings }
  - Returns: Created quiz
- GET /api/v1/teachers/quizzes
  - Returns: Teacher's quizzes
- PUT /api/v1/teachers/quizzes/{quiz_id}
  - Body: Updated quiz data
  - Returns: Updated quiz
- POST /api/v1/teachers/quizzes/{quiz_id}/questions
  - Body: { question_type, question_text, options, correct_answer, points }
  - Returns: Created question
- PUT /api/v1/teachers/quizzes/{quiz_id}/questions/{question_id}
- DELETE /api/v1/teachers/quizzes/{quiz_id}/questions/{question_id}
- POST /api/v1/teachers/quizzes/{quiz_id}/publish
  - Returns: Published quiz
- POST /api/v1/teachers/quizzes/{quiz_id}/activate
  - Activates quiz in classroom (if meeting_id set)
- POST /api/v1/teachers/quizzes/{quiz_id}/close
  - Closes quiz, no more submissions
- GET /api/v1/teachers/quizzes/{quiz_id}/attempts
  - Returns: All student attempts with scores
- GET /api/v1/teachers/quizzes/{quiz_id}/statistics
  - Returns: {
      total_attempts,
      average_score,
      passing_rate,
      question_statistics: [{
        question_id,
        correct_count,
        incorrect_count,
        average_points
      }]
    }
- PUT /api/v1/teachers/quizzes/attempts/{attempt_id}/grade
  - Body: { responses: [{ question_id, points_earned, feedback }] }
  - Returns: Graded attempt
- GET /api/v1/teachers/quizzes/{quiz_id}/export
  - Query params: format (csv, xlsx)
  - Returns: Quiz results export

Student Endpoints:
- GET /api/v1/quizzes/available
  - Returns: Available quizzes for student
- POST /api/v1/quizzes/{quiz_id}/start
  - Returns: Quiz attempt with questions
- POST /api/v1/quizzes/attempts/{attempt_id}/submit
  - Body: { responses: [{ question_id, response }] }
  - Returns: Submitted attempt
- GET /api/v1/quizzes/attempts/{attempt_id}/results
  - Returns: Attempt results (after grading)

Frontend Components (Teacher):
- QuizBuilder component with:
  - Title and description
  - Settings (time limit, passing score, etc.)
  - Add question button
- QuestionEditor component with:
  - Question type selector
  - Text editor
  - Options editor (for multiple choice)
  - Correct answer selector
  - Points input
- QuizAttemptsList component
- QuizStatistics component with:
  - Score distribution chart
  - Question performance table
  - Export button
- GradingInterface component for manual grading

Frontend Components (Student):
- QuizTaker component with:
  - Question display
  - Answer input
  - Timer
  - Submit button
- QuizResults component with:
  - Score display
  - Correct/incorrect breakdown
  - Feedback display

Frontend Pages:
- New /teacher/quizzes - Quiz management
- New /teacher/quizzes/new - Create quiz
- New /teacher/quizzes/{quiz_id}/edit - Edit quiz
- New /teacher/quizzes/{quiz_id}/attempts - View attempts
- New /teacher/quizzes/{quiz_id}/grade - Grade essay/short answer
- New /student/quizzes - Available quizzes
- New /student/quizzes/{quiz_id}/take - Take quiz
- New /student/quizzes/attempts/{attempt_id}/results - View results
```

**Acceptance Criteria**:
- [ ] Teachers can create quizzes with multiple question types
- [ ] Multiple choice and true/false are auto-graded
- [ ] Short answer and essay require manual grading
- [ ] Time limits are enforced
- [ ] Students cannot submit after time expires
- [ ] Quiz results show correct answers (if enabled)
- [ ] Statistics accurately reflect performance
- [ ] Export includes all attempt data
- [ ] Quizzes can be reused across multiple classrooms

---

#### 2.2 Feedback & Annotations
**Description**: Provide feedback to students during and after class

**User Stories**:
- As a teacher, I want to give private feedback to students during class
- As a teacher, I want to annotate shared screens or whiteboards
- As a teacher, I want to rate student participation
- As a teacher, I want to send post-class feedback summaries

**Technical Requirements**:
```
Database Schema:
- New table: student_feedback
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - student_id (UUID, FK to users.id)
  - teacher_id (UUID, FK to users.id)
  - feedback_text (Text)
  - feedback_type (Enum: positive, constructive, note)
  - is_private (Boolean, default: True)
  - created_at (DateTime)

- New table: participation_ratings
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - student_id (UUID, FK to users.id)
  - teacher_id (UUID, FK to users.id)
  - rating (Integer) - 1-5 scale
  - comments (Text, nullable)
  - rated_at (DateTime)

- New table: whiteboard_sessions
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - created_by (UUID, FK to users.id)
  - data (JSONB) - whiteboard state
  - created_at (DateTime)
  - updated_at (DateTime)

API Endpoints:
- POST /api/v1/teachers/feedback
  - Body: { meeting_id, student_id, feedback_text, feedback_type, is_private }
  - Returns: Created feedback
- GET /api/v1/teachers/classrooms/{meeting_id}/feedback
  - Returns: All feedback for classroom
- POST /api/v1/teachers/classrooms/{meeting_id}/participation-rating
  - Body: { student_id, rating, comments }
  - Returns: Created rating
- GET /api/v1/teachers/students/{student_id}/feedback-history
  - Returns: All feedback for student across all classrooms
- POST /api/v1/teachers/classrooms/{meeting_id}/send-summary
  - Sends post-class summary to all students
  - Returns: Success confirmation
- POST /api/v1/teachers/whiteboard
  - Body: { meeting_id, data }
  - Returns: Created/updated whiteboard
- GET /api/v1/teachers/whiteboard/{meeting_id}
  - Returns: Whiteboard data

Frontend Components:
- FeedbackDrawer component with:
  - Student selector
  - Feedback type selector
  - Text area
  - Private/public toggle
  - Send button
- ParticipationRater component with:
  - Student list
  - Star rating (1-5)
  - Quick notes
- WhiteboardCanvas component with:
  - Drawing tools
  - Text tool
  - Shapes
  - Colors
  - Eraser
  - Clear button
  - Save button
- ClassSummaryComposer component

Frontend Pages:
- Add feedback drawer to classroom page
- New /teacher/classrooms/{meeting_id}/summary - Post-class summary
```

**Acceptance Criteria**:
- [ ] Teachers can send private feedback during class
- [ ] Students receive feedback notifications
- [ ] Public feedback is visible to all in classroom
- [ ] Participation ratings are saved per student per class
- [ ] Whiteboard state is saved and synchronized
- [ ] All participants see whiteboard updates in real-time
- [ ] Summary emails include feedback and ratings
- [ ] Feedback history is accessible per student

---

### Priority 3: Content & Resources

#### 3.1 Lesson Planning & Materials
**Description**: Organize lesson plans and teaching materials

**User Stories**:
- As a teacher, I want to create lesson plans for classrooms
- As a teacher, I want to attach materials (slides, PDFs, links) to classrooms
- As a teacher, I want to share resources with students before/during/after class
- As a teacher, I want to organize materials by subject or topic

**Technical Requirements**:
```
Database Schema:
- New table: lesson_plans
  - id (UUID, PK)
  - teacher_id (UUID, FK to users.id)
  - title (String)
  - subject (String, nullable)
  - grade_level (String, nullable)
  - objectives (JSONB) - array of learning objectives
  - activities (JSONB) - array of activity descriptions
  - materials_needed (JSONB) - array of material names
  - notes (Text, nullable)
  - created_at (DateTime)
  - updated_at (DateTime)

- New table: lesson_plan_classrooms
  - lesson_plan_id (UUID, FK to lesson_plans.id)
  - meeting_id (UUID, FK to meetings.id)
  - PK: (lesson_plan_id, meeting_id)

- New table: teaching_materials
  - id (UUID, PK)
  - teacher_id (UUID, FK to users.id)
  - title (String)
  - description (Text, nullable)
  - material_type (Enum: file, link, video, document)
  - url (String, nullable)
  - file_path (String, nullable)
  - file_size_bytes (Integer, nullable)
  - subject (String, nullable)
  - tags (JSONB) - array of tags
  - created_at (DateTime)

- New table: classroom_materials
  - meeting_id (UUID, FK to meetings.id)
  - material_id (UUID, FK to teaching_materials.id)
  - availability (Enum: before_class, during_class, after_class, always)
  - added_at (DateTime)
  - PK: (meeting_id, material_id)

API Endpoints:
- POST /api/v1/teachers/lesson-plans
  - Body: { title, subject, objectives, activities, materials_needed }
  - Returns: Created lesson plan
- GET /api/v1/teachers/lesson-plans
  - Query params: subject, grade_level
  - Returns: Teacher's lesson plans
- PUT /api/v1/teachers/lesson-plans/{id}
- POST /api/v1/teachers/lesson-plans/{id}/attach-to-classroom
  - Body: { meeting_id }
  - Returns: Association created
- POST /api/v1/teachers/materials
  - Body: File upload or link data
  - Returns: Created material
- GET /api/v1/teachers/materials
  - Query params: subject, material_type, tags
  - Returns: Teacher's materials
- POST /api/v1/teachers/classrooms/{meeting_id}/add-material
  - Body: { material_id, availability }
  - Returns: Material added to classroom
- GET /api/v1/teachers/classrooms/{meeting_id}/materials
  - Returns: All materials for classroom

Frontend Components:
- LessonPlanEditor component
- LessonPlanCard component
- MaterialLibrary component with:
  - Upload button
  - Filter by type/subject/tags
  - Search
  - Grid/list view
- MaterialCard component with preview
- MaterialSelector component (for adding to classroom)

Frontend Pages:
- New /teacher/lesson-plans - Manage lesson plans
- New /teacher/lesson-plans/new - Create lesson plan
- New /teacher/materials - Material library
- Enhance classroom creation with lesson plan and material selection
```

**Acceptance Criteria**:
- [ ] Lesson plans can be created and reused
- [ ] Materials can be uploaded or linked
- [ ] Materials can be organized by subject and tags
- [ ] Materials attached to classrooms are accessible to students
- [ ] Availability controls when students can access materials
- [ ] File uploads support common educational formats
- [ ] Material library supports search and filtering
- [ ] Lesson plans can be duplicated and edited

---

#### 3.2 Recording & Playback
**Description**: Record classrooms and provide playback to students

**User Stories**:
- As a teacher, I want to record my classrooms
- As a teacher, I want to manage recorded classrooms
- As a teacher, I want to share recordings with specific students or groups
- As a teacher, I want to see recording analytics (views, watch time)

**Technical Requirements**:
```
Database Schema:
- New table: classroom_recordings
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - teacher_id (UUID, FK to users.id)
  - title (String)
  - description (Text, nullable)
  - recording_url (String)
  - thumbnail_url (String, nullable)
  - duration_seconds (Integer)
  - file_size_bytes (BigInteger)
  - status (Enum: processing, ready, failed)
  - started_at (DateTime)
  - ended_at (DateTime)
  - created_at (DateTime)

- New table: recording_access
  - recording_id (UUID, FK to classroom_recordings.id)
  - user_id (UUID, FK to users.id, nullable)
  - group_id (UUID, FK to student_groups.id, nullable)
  - granted_by (UUID, FK to users.id)
  - granted_at (DateTime)
  - PK: (recording_id, user_id, group_id)
  - CHECK: user_id IS NOT NULL OR group_id IS NOT NULL

- New table: recording_views
  - id (UUID, PK)
  - recording_id (UUID, FK to classroom_recordings.id)
  - viewer_id (UUID, FK to users.id)
  - watch_duration_seconds (Integer)
  - completed (Boolean, default: False)
  - started_at (DateTime)
  - last_watched_at (DateTime)

API Endpoints:
- POST /api/v1/teachers/classrooms/{meeting_id}/start-recording
  - Returns: Recording started confirmation
- POST /api/v1/teachers/classrooms/{meeting_id}/stop-recording
  - Returns: Recording stopped, processing status
- GET /api/v1/teachers/recordings
  - Returns: Teacher's recordings
- PUT /api/v1/teachers/recordings/{recording_id}
  - Body: { title, description }
  - Returns: Updated recording
- DELETE /api/v1/teachers/recordings/{recording_id}
- POST /api/v1/teachers/recordings/{recording_id}/share
  - Body: { user_ids?: UUID[], group_ids?: UUID[] }
  - Returns: Access granted
- GET /api/v1/teachers/recordings/{recording_id}/analytics
  - Returns: {
      total_views,
      unique_viewers,
      average_watch_duration,
      completion_rate,
      viewer_list: [{ user, watch_duration, completed }]
    }
- GET /api/v1/students/recordings
  - Returns: Recordings accessible to student
- POST /api/v1/recordings/{recording_id}/track-view
  - Body: { watch_duration_seconds }
  - Returns: View tracked

Integration with LiveKit Egress:
- Use LiveKit Egress service for recording
- Store recordings in S3/cloud storage
- Generate thumbnails automatically
- Transcode to web-friendly formats

Frontend Components:
- RecordingControls component with:
  - Start/stop recording button
  - Recording indicator (red dot)
  - Recording duration timer
- RecordingLibrary component with:
  - Recording cards with thumbnails
  - Filter by date/classroom
  - Search
- RecordingPlayer component with:
  - Video player
  - Playback controls
  - Speed controls
  - Transcript (if available)
- RecordingSharingDialog component
- RecordingAnalytics component with:
  - View count
  - Watch time chart
  - Viewer list

Frontend Pages:
- New /teacher/recordings - Recording library
- New /teacher/recordings/{recording_id} - Recording detail with analytics
- New /student/recordings - Accessible recordings
- New /recordings/{recording_id}/watch - Recording player
```

**Acceptance Criteria**:
- [ ] Teachers can start/stop recording during classroom
- [ ] Recording indicator is visible to all participants
- [ ] Recordings are processed and available within 30 minutes
- [ ] Teachers can share with specific students or groups
- [ ] Students can only access recordings shared with them
- [ ] View tracking is accurate (watch duration, completion)
- [ ] Analytics show detailed viewership data
- [ ] Recordings can be downloaded by teacher
- [ ] Recording quality is acceptable (720p minimum)
- [ ] Recordings include all audio tracks (original languages)

---

## Implementation Priority Summary

### Must Have (P1)
1. Advanced Classroom Creation & Templates
2. Student Management & Roster
3. In-Classroom Controls & Features

### Should Have (P2)
4. Quiz & Assessment Tools
5. Feedback & Annotations

### Nice to Have (P3)
6. Lesson Planning & Materials
7. Recording & Playback

---

## Estimated Development Effort

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| Classroom Templates | 4 days | 4 days | 2 days | 10 days |
| Student Management | 5 days | 5 days | 2 days | 12 days |
| In-Class Controls | 6 days | 6 days | 3 days | 15 days |
| Quiz Tools | 6 days | 6 days | 2 days | 14 days |
| Feedback & Annotations | 4 days | 4 days | 1 day | 9 days |
| Lesson Planning | 4 days | 4 days | 1 day | 9 days |
| Recording & Playback | 5 days | 5 days | 2 days | 12 days |
| **TOTAL** | **34 days** | **34 days** | **13 days** | **81 days** |

---

## Success Metrics for Teacher Enhancements

1. **Classroom Management Efficiency**
   - Time to create classroom reduced by 60%
   - Template reuse rate >70%
   - Recurring classroom setup time <2 minutes

2. **Student Engagement**
   - Attendance tracking accuracy 100%
   - Average participation score >75%
   - Hand raise response time <30 seconds

3. **Assessment Effectiveness**
   - Quiz creation time <10 minutes
   - Auto-grading accuracy 100%
   - Manual grading time reduced by 50%

4. **Content Delivery**
   - Material access rate >80%
   - Recording completion rate >60%
   - Lesson plan reuse >3x per plan

5. **Communication**
   - Feedback delivery time <1 minute
   - Summary email open rate >70%
   - Parent satisfaction with communication >4/5
