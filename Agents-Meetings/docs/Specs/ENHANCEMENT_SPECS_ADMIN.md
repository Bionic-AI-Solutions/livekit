# Admin Persona - Enhancement Specifications

**Platform**: Agents-Meetings (all enhancements apply to this codebase only)

**Context**: Admins have full platform control over the Agents-Meetings application, including user management, meeting management, and system configuration.

---

## Current Admin Capabilities

### Existing Features
- Dashboard with real-time statistics
- User management (approve/reject, activate/deactivate, delete)
- Meeting management (view all, edit, add/remove participants, end meetings)
- System configuration access

### Existing Pages
1. `/admin/dashboard` - Statistics overview
2. `/admin/users` - User management
3. `/admin/meetings` - Meeting management
4. `/admin/meetings/new` - Create meeting

---

## Enhancement Specifications

### Priority 1: Critical Admin Features

#### 1.1 Audit Logs & Activity Tracking
**Description**: Comprehensive audit trail for all admin actions and system events

**User Stories**:
- As an admin, I want to see who performed what action and when
- As an admin, I want to track all user approvals/rejections with timestamps
- As an admin, I want to see meeting creation/deletion history
- As an admin, I want to export audit logs for compliance

**Technical Requirements**:
```
Database Schema:
- Table: audit_logs
  - id (UUID, PK)
  - user_id (UUID, FK to users.id, nullable for system events)
  - action_type (Enum: user_created, user_updated, user_deleted, user_approved, user_rejected,
                       meeting_created, meeting_updated, meeting_deleted, meeting_ended,
                       participant_added, participant_removed, login_success, login_failed, etc.)
  - entity_type (Enum: user, meeting, participant, system)
  - entity_id (UUID, nullable)
  - action_details (JSONB) - stores before/after state
  - ip_address (String)
  - user_agent (String)
  - timestamp (DateTime)
  - trace_id (String, nullable) - for correlation

API Endpoints:
- GET /api/v1/admin/audit-logs
  - Query params: start_date, end_date, action_type, entity_type, user_id, limit, offset
  - Returns: Paginated audit logs with filtering
- GET /api/v1/admin/audit-logs/export
  - Query params: format (csv, json, xlsx), filters
  - Returns: Downloadable file
- GET /api/v1/admin/audit-logs/{entity_type}/{entity_id}
  - Returns: All audit logs for specific entity

Frontend Components:
- AuditLogTable component with:
  - Sortable columns (timestamp, user, action, entity)
  - Filterable (date range, action type, user)
  - Searchable (entity ID, details)
  - Expandable rows showing full details
  - Export button (CSV/Excel)
- AuditLogViewer component for entity-specific history
- DateRangePicker component
- ActionTypeFilter component

Frontend Pages:
- /admin/audit-logs - Main audit log viewer
- Add "View History" button to user and meeting detail pages
```

**Acceptance Criteria**:
- [ ] All admin actions are logged automatically
- [ ] All user login attempts are logged (success/failure)
- [ ] All meeting lifecycle events are logged
- [ ] Audit logs are searchable and filterable
- [ ] Export functionality works for CSV and Excel
- [ ] Logs display user-friendly action descriptions
- [ ] Sensitive data (passwords) is never logged
- [ ] Logs are paginated for performance
- [ ] Entity-specific history is accessible from detail pages

---

#### 1.2 Advanced User Management
**Description**: Enhanced user management with bulk operations, advanced filtering, and user insights

**User Stories**:
- As an admin, I want to bulk approve/reject multiple pending users
- As an admin, I want to see user activity statistics (meetings attended, duration)
- As an admin, I want to export user lists with custom fields
- As an admin, I want to search users by name, email, or role
- As an admin, I want to impersonate users to troubleshoot issues
- As an admin, I want to see user login history

**Technical Requirements**:
```
Database Schema Changes:
- Add to users table:
  - last_login_at (DateTime, nullable)
  - last_login_ip (String, nullable)
  - login_count (Integer, default: 0)
  - failed_login_attempts (Integer, default: 0)
  - locked_until (DateTime, nullable) - for account lockout

- New table: user_sessions
  - id (UUID, PK)
  - user_id (UUID, FK to users.id)
  - token_hash (String)
  - ip_address (String)
  - user_agent (String)
  - created_at (DateTime)
  - expires_at (DateTime)
  - last_activity_at (DateTime)
  - is_active (Boolean)

- New table: user_statistics
  - user_id (UUID, PK, FK to users.id)
  - total_meetings_attended (Integer, default: 0)
  - total_meetings_hosted (Integer, default: 0)
  - total_meeting_duration_minutes (Integer, default: 0)
  - last_meeting_at (DateTime, nullable)
  - preferred_language (String, nullable)
  - updated_at (DateTime)

API Endpoints:
- POST /api/v1/admin/users/bulk-approve
  - Body: { user_ids: UUID[] }
  - Returns: Bulk operation result
- POST /api/v1/admin/users/bulk-reject
  - Body: { user_ids: UUID[], reason: string }
  - Returns: Bulk operation result
- POST /api/v1/admin/users/bulk-delete
  - Body: { user_ids: UUID[] }
  - Returns: Bulk operation result
- GET /api/v1/admin/users/{user_id}/statistics
  - Returns: User activity statistics
- GET /api/v1/admin/users/{user_id}/sessions
  - Returns: Active and historical sessions
- POST /api/v1/admin/users/{user_id}/revoke-sessions
  - Body: { session_ids?: UUID[] } - if empty, revokes all
  - Returns: Revocation result
- POST /api/v1/admin/users/{user_id}/impersonate
  - Returns: Impersonation token with admin context
- GET /api/v1/admin/users/export
  - Query params: format (csv, xlsx), filters, fields
  - Returns: User export file
- POST /api/v1/admin/users/{user_id}/reset-password
  - Body: { new_password: string }
  - Returns: Success/error

Frontend Components:
- UserBulkActionBar component with:
  - Checkbox for select all
  - Bulk approve button
  - Bulk reject button
  - Bulk delete button
  - Selected count indicator
- UserStatisticsCard component showing:
  - Meetings attended/hosted
  - Total meeting time
  - Last activity
  - Preferred language
- UserSessionList component showing:
  - Active sessions with device/location
  - Revoke session buttons
- UserAdvancedSearch component with:
  - Multi-field search
  - Role filter
  - Status filter (pending/active/inactive)
  - Last login date range
  - Registration date range
- UserExportDialog component
- ImpersonationBanner component (shown when impersonating)

Frontend Pages:
- Enhance /admin/users with:
  - Bulk selection checkboxes
  - Advanced search panel
  - Export button
  - Quick filters (pending approval, locked accounts, inactive 30+ days)
- New /admin/users/{user_id} - User detail page with:
  - User statistics
  - Session management
  - Audit log history
  - Meeting history
  - Impersonate button
  - Reset password button
```

**Acceptance Criteria**:
- [ ] Bulk approve/reject/delete operations work correctly
- [ ] User statistics are accurate and updated in real-time
- [ ] Session management allows revoking individual or all sessions
- [ ] User export includes selectable fields
- [ ] Advanced search supports multiple criteria
- [ ] Impersonation mode has clear visual indicator
- [ ] Impersonation logs admin actions separately
- [ ] Failed login attempts trigger account lockout after threshold
- [ ] Password reset by admin sends email notification to user

---

#### 1.3 Enhanced Meeting Management Dashboard
**Description**: Advanced meeting analytics, monitoring, and management tools

**User Stories**:
- As an admin, I want to see real-time meeting statistics on a dashboard
- As an admin, I want to monitor active meetings with participant counts
- As an admin, I want to see translation usage statistics
- As an admin, I want to see avatar usage statistics
- As an admin, I want to identify and end problematic meetings
- As an admin, I want to see meeting trends over time

**Technical Requirements**:
```
Database Schema Changes:
- Enhance meeting_analytics table:
  - total_participants (Integer)
  - peak_participants (Integer)
  - average_participants (Float)
  - translation_requests_count (Integer)
  - avatar_interactions_count (Integer)
  - chat_messages_count (Integer)
  - screen_shares_count (Integer)
  - started_at (DateTime)
  - ended_at (DateTime)

- New table: meeting_events
  - id (UUID, PK)
  - meeting_id (UUID, FK to meetings.id)
  - event_type (Enum: participant_joined, participant_left, translation_started,
                      translation_stopped, avatar_interaction, chat_message, screen_share, etc.)
  - participant_id (UUID, FK to meeting_participants.id, nullable)
  - event_data (JSONB)
  - timestamp (DateTime)

API Endpoints:
- GET /api/v1/admin/meetings/dashboard-stats
  - Returns: {
      active_meetings_count,
      total_participants_now,
      meetings_today,
      meetings_this_week,
      meetings_this_month,
      average_meeting_duration,
      most_used_languages,
      avatar_vs_human_hosts_ratio,
      translation_usage_percentage
    }
- GET /api/v1/admin/meetings/active
  - Returns: List of active meetings with real-time participant counts and status
- GET /api/v1/admin/meetings/{meeting_id}/analytics
  - Returns: Detailed analytics for specific meeting
- GET /api/v1/admin/meetings/{meeting_id}/events
  - Returns: Event timeline for meeting
- GET /api/v1/admin/meetings/trends
  - Query params: period (day, week, month, year)
  - Returns: Meeting trends data for charts
- POST /api/v1/admin/meetings/{meeting_id}/record-event
  - Body: { event_type, event_data }
  - Returns: Event created
- GET /api/v1/admin/meetings/reports/usage
  - Query params: start_date, end_date, group_by (language, host_type, meeting_type)
  - Returns: Usage report data

Frontend Components:
- MeetingDashboardStatsGrid component with cards:
  - Active Meetings (real-time count with trend)
  - Total Participants Now
  - Meetings Today/Week/Month
  - Average Duration
  - Translation Usage %
  - Avatar Usage %
- ActiveMeetingsMonitor component with:
  - Real-time updating list
  - Participant count badges
  - Duration timer
  - Quick action buttons (view, end)
  - Status indicators (translation active, avatar active)
- MeetingTrendsChart component showing:
  - Meetings over time (line chart)
  - Participants over time (area chart)
  - Language distribution (pie chart)
  - Host type distribution (bar chart)
- MeetingAnalyticsDetail component showing:
  - Timeline of events
  - Participant join/leave graph
  - Translation request count
  - Avatar interaction count
  - Peak participants time
- UsageReportTable component with:
  - Grouping options
  - Export functionality
  - Drill-down capability

Frontend Pages:
- Enhance /admin/dashboard with:
  - Meeting-focused statistics
  - Active meetings monitor
  - Trend charts
- New /admin/meetings/analytics - Analytics hub with:
  - Time period selector
  - Multiple visualization options
  - Export reports
- New /admin/meetings/{meeting_id}/analytics - Detailed analytics
```

**Acceptance Criteria**:
- [ ] Dashboard updates in real-time (WebSocket or polling)
- [ ] Active meetings show accurate participant counts
- [ ] Trend charts display data for last 7/30/90 days
- [ ] Meeting analytics capture all relevant events
- [ ] Usage reports are exportable to CSV/Excel
- [ ] Charts are interactive and responsive
- [ ] Performance is acceptable even with many active meetings
- [ ] Analytics data is retained for historical reporting

---

### Priority 2: System Administration Features

#### 2.1 System Configuration Management
**Description**: Centralized system configuration with UI for admins

**User Stories**:
- As an admin, I want to configure supported languages without code changes
- As an admin, I want to enable/disable avatar providers
- As an admin, I want to set system-wide defaults (max participants, meeting duration)
- As an admin, I want to configure email templates
- As an admin, I want to manage API keys and integrations

**Technical Requirements**:
```
Database Schema:
- New table: system_settings
  - key (String, PK)
  - value (JSONB)
  - data_type (Enum: string, number, boolean, json, array)
  - category (Enum: languages, avatars, meetings, email, integrations, security)
  - description (Text)
  - is_sensitive (Boolean) - for API keys
  - updated_by (UUID, FK to users.id)
  - updated_at (DateTime)

- New table: email_templates
  - id (UUID, PK)
  - template_key (String, unique) - registration_confirmation, user_approved, etc.
  - subject (String)
  - html_body (Text)
  - plain_text_body (Text)
  - variables (JSONB) - list of available variables
  - is_active (Boolean)
  - updated_by (UUID, FK to users.id)
  - updated_at (DateTime)

API Endpoints:
- GET /api/v1/admin/settings
  - Query params: category (optional)
  - Returns: All settings or filtered by category
- PUT /api/v1/admin/settings/{key}
  - Body: { value: any }
  - Returns: Updated setting
- GET /api/v1/admin/email-templates
  - Returns: All email templates
- PUT /api/v1/admin/email-templates/{template_key}
  - Body: { subject, html_body, plain_text_body }
  - Returns: Updated template
- POST /api/v1/admin/email-templates/{template_key}/test
  - Body: { recipient_email, test_data }
  - Returns: Test email sent confirmation

Frontend Components:
- SettingsCategoryTabs component
- SettingForm component with:
  - Dynamic form fields based on data_type
  - Validation
  - Save/Reset buttons
  - Sensitive data masking
- EmailTemplateEditor component with:
  - Rich text editor for HTML
  - Plain text editor
  - Variable insertion tool
  - Preview pane
  - Test email button
- LanguageManagement component with:
  - Add/remove languages
  - Set default language
  - Enable/disable translation
- AvatarProviderManagement component with:
  - Enable/disable providers
  - Set default provider
  - Configure provider-specific settings

Frontend Pages:
- New /admin/settings - System settings management with:
  - Tabbed interface by category
  - Language settings
  - Avatar settings
  - Meeting defaults
  - Email configuration
  - Integration settings
  - Security settings
- New /admin/email-templates - Email template editor
```

**Acceptance Criteria**:
- [ ] Settings are updated in real-time without restart
- [ ] Sensitive settings (API keys) are masked in UI
- [ ] Email templates support variable substitution
- [ ] Email template testing sends actual test emails
- [ ] Changes are logged in audit logs
- [ ] Invalid configurations are rejected with clear errors
- [ ] Settings have validation rules
- [ ] Category-based organization is intuitive

---

#### 2.2 Role & Permission Management
**Description**: Granular permission system beyond basic roles

**User Stories**:
- As an admin, I want to create custom roles with specific permissions
- As an admin, I want to assign multiple roles to users
- As an admin, I want to see who has access to what
- As an admin, I want to create role templates for common scenarios

**Technical Requirements**:
```
Database Schema:
- New table: roles (replaces enum in users table)
  - id (UUID, PK)
  - name (String, unique)
  - description (Text)
  - is_system_role (Boolean) - true for admin, teacher, host, participant
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)

- New table: permissions
  - id (UUID, PK)
  - name (String, unique) - e.g., "users.create", "meetings.delete", "settings.edit"
  - resource (String) - users, meetings, settings, etc.
  - action (String) - create, read, update, delete, approve, etc.
  - description (Text)

- New table: role_permissions
  - role_id (UUID, FK to roles.id)
  - permission_id (UUID, FK to permissions.id)
  - PK: (role_id, permission_id)

- New table: user_roles
  - user_id (UUID, FK to users.id)
  - role_id (UUID, FK to roles.id)
  - assigned_by (UUID, FK to users.id)
  - assigned_at (DateTime)
  - PK: (user_id, role_id)

Migrate existing role enum to roles table:
- Admin role with all permissions
- Teacher role with meeting creation permissions
- Host role with meeting creation permissions
- Participant role with basic permissions

API Endpoints:
- GET /api/v1/admin/roles
  - Returns: All roles with permission counts
- POST /api/v1/admin/roles
  - Body: { name, description, permission_ids }
  - Returns: Created role
- PUT /api/v1/admin/roles/{role_id}
  - Body: { name, description, permission_ids }
  - Returns: Updated role
- DELETE /api/v1/admin/roles/{role_id}
  - Only non-system roles can be deleted
  - Returns: Success/error
- GET /api/v1/admin/permissions
  - Returns: All available permissions
- POST /api/v1/admin/users/{user_id}/roles
  - Body: { role_ids: UUID[] }
  - Returns: Updated user roles
- GET /api/v1/admin/roles/{role_id}/users
  - Returns: Users with this role

Frontend Components:
- RoleList component
- RoleForm component with:
  - Name and description fields
  - Permission selector (grouped by resource)
  - Permission search
- PermissionMatrix component showing:
  - Resources as rows
  - Actions as columns
  - Checkboxes at intersections
- UserRoleAssignment component

Frontend Pages:
- New /admin/roles - Role management with:
  - List of roles
  - Create/edit role dialog
  - Permission matrix view
  - Users per role view
- Enhance /admin/users/{user_id} with:
  - Role assignment section
  - Permission summary
```

**Acceptance Criteria**:
- [ ] Custom roles can be created with any permission combination
- [ ] System roles cannot be deleted or have permissions removed
- [ ] Users can have multiple roles (permissions are additive)
- [ ] Permission checks work correctly throughout the system
- [ ] Role changes take effect immediately
- [ ] Audit logs track role assignments and changes
- [ ] UI clearly shows which permissions a role grants
- [ ] Permission names are user-friendly

---

#### 2.3 System Health Monitoring
**Description**: Real-time system health and performance monitoring

**User Stories**:
- As an admin, I want to see system health at a glance
- As an admin, I want to be alerted when services are down
- As an admin, I want to see resource usage (CPU, memory, database)
- As an admin, I want to see API performance metrics
- As an admin, I want to see agent status (translation, avatar, room manager)

**Technical Requirements**:
```
API Endpoints:
- GET /api/v1/admin/health
  - Returns: {
      status: "healthy" | "degraded" | "down",
      services: {
        database: { status, latency_ms, connection_count },
        livekit: { status, url, connected },
        mail_service: { status, url },
        langfuse: { status, url },
        agents: {
          translation: { status, active_rooms, last_heartbeat },
          avatar: { status, active_rooms, last_heartbeat },
          room_manager: { status, active_rooms, last_heartbeat }
        }
      },
      system: {
        uptime_seconds,
        api_version,
        environment
      }
    }
- GET /api/v1/admin/metrics
  - Returns: {
      api_requests_total,
      api_requests_per_minute,
      api_average_response_time_ms,
      api_error_rate,
      database_query_count,
      database_average_query_time_ms,
      active_connections,
      cache_hit_rate (if Redis added)
    }
- GET /api/v1/admin/system-resources
  - Returns: {
      cpu_usage_percent,
      memory_usage_mb,
      memory_available_mb,
      disk_usage_gb,
      disk_available_gb,
      network_in_mbps,
      network_out_mbps
    }
  - Note: Requires system monitoring agent (Prometheus, etc.)

Frontend Components:
- SystemHealthDashboard component with:
  - Overall health status indicator
  - Service status cards (green/yellow/red)
  - Real-time metrics
  - Auto-refresh toggle
- ServiceStatusCard component showing:
  - Service name
  - Status badge
  - Latency/connection info
  - Last checked timestamp
- MetricsChart component showing:
  - API requests over time
  - Response times over time
  - Error rate over time
- ResourceUsageGauges component showing:
  - CPU usage gauge
  - Memory usage gauge
  - Disk usage gauge
- AgentStatusTable component showing:
  - Agent type
  - Status
  - Active rooms
  - Last heartbeat
  - Actions (restart, view logs)

Frontend Pages:
- New /admin/health - System health monitoring with:
  - Overall status summary
  - Service statuses
  - Performance metrics
  - Resource usage
  - Agent statuses
  - Auto-refresh (every 5-10 seconds)
```

**Acceptance Criteria**:
- [ ] Health checks run automatically every 30-60 seconds
- [ ] Service status is accurate and updates in real-time
- [ ] Metrics display historical data (last hour/day)
- [ ] Down services are clearly highlighted
- [ ] Agent status shows last heartbeat time
- [ ] Resource usage alerts when thresholds exceeded
- [ ] Page supports manual refresh and auto-refresh
- [ ] Performance is acceptable with frequent updates

---

### Priority 3: Reporting & Analytics

#### 3.1 Usage Reports & Analytics
**Description**: Comprehensive reporting system for usage, engagement, and trends

**User Stories**:
- As an admin, I want to generate usage reports for specific time periods
- As an admin, I want to see user engagement metrics
- As an admin, I want to see language usage statistics
- As an admin, I want to see avatar vs human host preferences
- As an admin, I want to export reports for stakeholders

**Technical Requirements**:
```
Database Schema:
- New table: scheduled_reports
  - id (UUID, PK)
  - name (String)
  - report_type (Enum: usage, engagement, languages, avatars, custom)
  - frequency (Enum: daily, weekly, monthly)
  - parameters (JSONB)
  - recipients (JSONB) - email addresses
  - format (Enum: pdf, csv, xlsx)
  - is_active (Boolean)
  - last_generated_at (DateTime, nullable)
  - next_scheduled_at (DateTime)
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)

API Endpoints:
- GET /api/v1/admin/reports/usage
  - Query params: start_date, end_date, group_by (day, week, month)
  - Returns: Usage statistics
- GET /api/v1/admin/reports/engagement
  - Query params: start_date, end_date
  - Returns: {
      total_users,
      active_users,
      dau (daily active users),
      wau (weekly active users),
      mau (monthly active users),
      average_meetings_per_user,
      average_meeting_duration,
      user_retention_rate
    }
- GET /api/v1/admin/reports/languages
  - Query params: start_date, end_date
  - Returns: Language usage breakdown with counts and percentages
- GET /api/v1/admin/reports/avatars
  - Query params: start_date, end_date
  - Returns: Avatar vs human host usage, provider breakdown
- GET /api/v1/admin/reports/custom
  - Body: { metrics: string[], filters: {}, group_by: string }
  - Returns: Custom report data
- POST /api/v1/admin/reports/export
  - Body: { report_type, parameters, format }
  - Returns: Download URL or file stream
- GET /api/v1/admin/scheduled-reports
  - Returns: All scheduled reports
- POST /api/v1/admin/scheduled-reports
  - Body: { name, report_type, frequency, parameters, recipients, format }
  - Returns: Created scheduled report
- POST /api/v1/admin/scheduled-reports/{id}/run
  - Manually trigger report generation
  - Returns: Report generated confirmation

Frontend Components:
- ReportBuilder component with:
  - Report type selector
  - Date range picker
  - Metric selector
  - Filter builder
  - Preview button
  - Export button
- UsageChart component showing:
  - Meetings over time
  - Users over time
  - Participants over time
- EngagementMetricsGrid component with cards:
  - Total users
  - Active users
  - DAU/WAU/MAU
  - Retention rate
  - Avg meetings per user
- LanguageDistributionChart component (pie/bar chart)
- AvatarUsageChart component (stacked bar chart)
- ScheduledReportList component
- ScheduledReportForm component

Frontend Pages:
- New /admin/reports - Report hub with:
  - Report type tabs
  - Custom report builder
  - Quick reports (predefined)
  - Scheduled reports manager
- New /admin/reports/usage - Usage reports
- New /admin/reports/engagement - Engagement reports
- New /admin/reports/languages - Language analytics
- New /admin/reports/avatars - Avatar usage analytics
```

**Acceptance Criteria**:
- [ ] Reports generate accurate data based on date ranges
- [ ] Custom reports allow flexible metric and filter selection
- [ ] Exports produce properly formatted files (CSV, Excel, PDF)
- [ ] Scheduled reports run automatically and email recipients
- [ ] Charts are interactive and visually appealing
- [ ] Report generation completes in reasonable time (<30 seconds)
- [ ] Historical data is available for at least 90 days
- [ ] Reports handle edge cases (no data, single data point)

---

#### 3.2 User Engagement Analytics
**Description**: Deep insights into user behavior and engagement patterns

**User Stories**:
- As an admin, I want to see user cohort analysis
- As an admin, I want to identify power users and inactive users
- As an admin, I want to see feature adoption rates
- As an admin, I want to understand user journey and drop-off points

**Technical Requirements**:
```
Database Schema:
- New table: user_cohorts
  - cohort_id (String, PK) - e.g., "2024-W01" for weekly cohorts
  - cohort_date (Date)
  - user_count (Integer)
  - created_at (DateTime)

- New table: user_cohort_members
  - cohort_id (String, FK to user_cohorts.cohort_id)
  - user_id (UUID, FK to users.id)
  - PK: (cohort_id, user_id)

- New table: feature_usage
  - id (UUID, PK)
  - user_id (UUID, FK to users.id)
  - feature_name (Enum: translation, avatar_host, chat, screen_share, etc.)
  - usage_count (Integer, default: 1)
  - first_used_at (DateTime)
  - last_used_at (DateTime)
  - updated_at (DateTime)

API Endpoints:
- GET /api/v1/admin/analytics/cohorts
  - Query params: cohort_type (weekly, monthly), period
  - Returns: Cohort retention data
- GET /api/v1/admin/analytics/power-users
  - Query params: top_n (default: 20), metric (meetings_hosted, meetings_attended, duration)
  - Returns: List of most engaged users
- GET /api/v1/admin/analytics/inactive-users
  - Query params: days_inactive (default: 30)
  - Returns: List of inactive users
- GET /api/v1/admin/analytics/feature-adoption
  - Returns: Feature usage statistics and adoption rates
- GET /api/v1/admin/analytics/user-journey
  - Returns: Common user paths from registration to engagement
- GET /api/v1/admin/analytics/churn-risk
  - Returns: Users at risk of churning based on engagement patterns

Frontend Components:
- CohortRetentionMatrix component showing:
  - Cohorts as rows
  - Time periods as columns
  - Retention percentages in cells
  - Color-coded heatmap
- PowerUsersList component
- InactiveUsersList component with:
  - User details
  - Days since last activity
  - Quick action (send email, deactivate)
- FeatureAdoptionChart component showing:
  - Feature names
  - Adoption percentages
  - Trend over time
- UserJourneyFunnel component
- ChurnRiskList component with:
  - Risk score
  - Indicators (decreased activity, no logins, etc.)

Frontend Pages:
- New /admin/analytics/cohorts - Cohort analysis
- New /admin/analytics/users - User segmentation with:
  - Power users section
  - Inactive users section
  - Churn risk section
- New /admin/analytics/features - Feature adoption analytics
```

**Acceptance Criteria**:
- [ ] Cohort analysis shows accurate retention over time
- [ ] Power users are correctly identified by metrics
- [ ] Inactive users list is actionable (send re-engagement email)
- [ ] Feature adoption rates match actual usage
- [ ] Churn risk algorithm identifies at-risk users
- [ ] Analytics update daily
- [ ] UI clearly explains metrics and calculations
- [ ] Exports are available for all analytics

---

### Priority 4: Communication & Notifications

#### 4.1 Admin Notification System
**Description**: Real-time notifications for admins about important events

**User Stories**:
- As an admin, I want to be notified when users register
- As an admin, I want to be notified when meetings encounter errors
- As an admin, I want to be notified when system health degrades
- As an admin, I want to configure notification preferences

**Technical Requirements**:
```
Database Schema:
- New table: notifications
  - id (UUID, PK)
  - user_id (UUID, FK to users.id)
  - type (Enum: user_registration, meeting_error, system_health, agent_down, etc.)
  - title (String)
  - message (Text)
  - severity (Enum: info, warning, error, critical)
  - is_read (Boolean, default: False)
  - action_url (String, nullable)
  - created_at (DateTime)
  - read_at (DateTime, nullable)

- New table: notification_preferences
  - user_id (UUID, PK, FK to users.id)
  - notification_type (Enum)
  - enabled (Boolean)
  - delivery_methods (JSONB) - ["in_app", "email", "sms"]
  - PK: (user_id, notification_type)

API Endpoints:
- GET /api/v1/notifications
  - Query params: is_read, type, limit, offset
  - Returns: User's notifications
- PUT /api/v1/notifications/{id}/read
  - Marks notification as read
- POST /api/v1/notifications/mark-all-read
  - Marks all notifications as read
- DELETE /api/v1/notifications/{id}
  - Deletes notification
- GET /api/v1/notifications/unread-count
  - Returns: { count: number }
- GET /api/v1/notifications/preferences
  - Returns: User's notification preferences
- PUT /api/v1/notifications/preferences
  - Body: { notification_type, enabled, delivery_methods }
  - Returns: Updated preferences
- WebSocket endpoint: /ws/notifications
  - Real-time notification push

Frontend Components:
- NotificationBell component with:
  - Unread count badge
  - Dropdown with recent notifications
  - "View all" link
- NotificationItem component showing:
  - Icon based on type
  - Title and message
  - Timestamp
  - Mark as read button
  - Action button (if action_url)
- NotificationPreferences component with:
  - Toggle switches per notification type
  - Delivery method checkboxes
- NotificationToast component for real-time alerts

Frontend Pages:
- Add NotificationBell to admin navbar
- New /admin/notifications - All notifications with:
  - Filter by type
  - Filter by read/unread
  - Mark all as read
  - Delete notifications
- New /admin/notifications/preferences - Notification settings

Backend Services:
- NotificationService with methods:
  - create_notification(user_id, type, title, message, severity, action_url)
  - send_notification(notification_id, delivery_methods)
  - broadcast_to_admins(type, title, message)
- WebSocket manager for real-time push
```

**Acceptance Criteria**:
- [ ] Admins receive notifications for configured events
- [ ] Unread count is accurate and updates in real-time
- [ ] Clicking notification marks it as read
- [ ] Action URLs navigate to relevant pages
- [ ] Preferences are respected (email, in-app)
- [ ] WebSocket notifications push without page refresh
- [ ] Notification sound plays for critical alerts
- [ ] Email notifications include full context

---

#### 4.2 Broadcast Messaging
**Description**: Send announcements and messages to users

**User Stories**:
- As an admin, I want to send announcements to all users
- As an admin, I want to send targeted messages to specific user segments
- As an admin, I want to schedule announcements for future delivery
- As an admin, I want to see announcement delivery statistics

**Technical Requirements**:
```
Database Schema:
- New table: announcements
  - id (UUID, PK)
  - title (String)
  - message (Text)
  - target_audience (Enum: all_users, admins, teachers, hosts, participants, custom)
  - custom_filter (JSONB, nullable) - for custom targeting
  - delivery_methods (JSONB) - ["in_app", "email"]
  - status (Enum: draft, scheduled, sending, sent, failed)
  - scheduled_at (DateTime, nullable)
  - sent_at (DateTime, nullable)
  - recipient_count (Integer, default: 0)
  - delivered_count (Integer, default: 0)
  - read_count (Integer, default: 0)
  - created_by (UUID, FK to users.id)
  - created_at (DateTime)

- New table: announcement_recipients
  - id (UUID, PK)
  - announcement_id (UUID, FK to announcements.id)
  - user_id (UUID, FK to users.id)
  - delivered (Boolean, default: False)
  - delivered_at (DateTime, nullable)
  - read (Boolean, default: False)
  - read_at (DateTime, nullable)

API Endpoints:
- POST /api/v1/admin/announcements
  - Body: { title, message, target_audience, custom_filter, delivery_methods, scheduled_at }
  - Returns: Created announcement
- GET /api/v1/admin/announcements
  - Returns: All announcements with statistics
- GET /api/v1/admin/announcements/{id}
  - Returns: Announcement details and stats
- POST /api/v1/admin/announcements/{id}/send
  - Manually trigger sending (for drafts)
- DELETE /api/v1/admin/announcements/{id}
  - Only drafts and scheduled can be deleted
- GET /api/v1/announcements
  - Returns: Announcements for current user

Frontend Components:
- AnnouncementComposer component with:
  - Title and message fields
  - Rich text editor
  - Target audience selector
  - Custom filter builder
  - Delivery method checkboxes
  - Schedule picker
  - Preview button
  - Send/Schedule/Save draft buttons
- AnnouncementList component
- AnnouncementStatsCard component showing:
  - Recipients count
  - Delivered count
  - Read count
  - Delivery rate

Frontend Pages:
- New /admin/announcements - Announcement management with:
  - Create announcement button
  - List of past announcements
  - Stats for each
- New /admin/announcements/new - Create announcement
- Add announcement viewing to user pages
```

**Acceptance Criteria**:
- [ ] Announcements can be sent to all users or specific roles
- [ ] Custom filters allow advanced targeting (e.g., inactive 30+ days)
- [ ] Scheduled announcements send at correct time
- [ ] Delivery statistics are accurate
- [ ] Email announcements have proper formatting
- [ ] In-app announcements appear as notifications
- [ ] Users can mark announcements as read
- [ ] Admins can preview before sending

---

## Implementation Priority Summary

### Must Have (P1)
1. Audit Logs & Activity Tracking
2. Advanced User Management
3. Enhanced Meeting Management Dashboard

### Should Have (P2)
4. System Configuration Management
5. Role & Permission Management
6. System Health Monitoring

### Nice to Have (P3)
7. Usage Reports & Analytics
8. User Engagement Analytics
9. Admin Notification System
10. Broadcast Messaging

---

## Estimated Development Effort

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| Audit Logs | 3 days | 3 days | 1 day | 7 days |
| Advanced User Mgmt | 4 days | 4 days | 2 days | 10 days |
| Meeting Dashboard | 3 days | 4 days | 1 day | 8 days |
| System Config | 3 days | 3 days | 1 day | 7 days |
| Role & Permissions | 5 days | 4 days | 2 days | 11 days |
| Health Monitoring | 4 days | 3 days | 1 day | 8 days |
| Usage Reports | 4 days | 4 days | 1 day | 9 days |
| Engagement Analytics | 4 days | 4 days | 1 day | 9 days |
| Notifications | 4 days | 3 days | 1 day | 8 days |
| Broadcast Messaging | 3 days | 3 days | 1 day | 7 days |
| **TOTAL** | **37 days** | **35 days** | **12 days** | **84 days** |

**Note**: Estimates assume 1 senior full-stack developer. Adjust for team size and experience.

---

## Success Metrics for Admin Enhancements

1. **Efficiency Gains**
   - Time to approve users reduced by 70%
   - Time to identify issues reduced by 80%
   - Report generation time < 30 seconds

2. **System Reliability**
   - 99.9% uptime visibility
   - <5 minute mean time to detect issues
   - <15 minute mean time to respond

3. **Data Insights**
   - 100% of admin actions audited
   - 90-day historical reporting available
   - Real-time dashboard updates <5 seconds

4. **User Management**
   - Bulk operations support 100+ users
   - Advanced search returns results <2 seconds
   - Session management across all devices

5. **Communication**
   - Notification delivery success rate >95%
   - Admin response time to alerts <1 hour
   - Announcement read rate >60%
