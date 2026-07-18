# DATA RETENTION POLICY

This document defines the lifecycle of operational and analytical data in the CRM system.
Currently, the system DOES NOT automatically delete any of these records. However, this policy dictates the agreed-upon retention periods for compliance and performance considerations. Future updates may introduce automated cleanup CRON jobs based on this policy.

## Retention Periods

### 1. Audit Logs (`AuditLog`)
- **Retention:** 5 Years
- **Purpose:** Security compliance, tracing user actions, and forensic analysis.
- **Action:** Retain indefinitely in active database for 1 year, move to cold storage/archives thereafter if size becomes an issue.

### 2. Notifications (`Notification`)
- **Retention:** 12 Months
- **Purpose:** Keeping user history clean and reducing database size.
- **Action:** Delete notifications older than 12 months.

### 3. AI Chat History (`AIChatSession`, `AIChatMessage`)
- **Retention:** 2 Years
- **Purpose:** Context training and review of executive questions.
- **Action:** Delete sessions and their associated messages older than 24 months.

### 4. Automation Logs (`AutomationExecutionLog`)
- **Retention:** 30 Days
- **Purpose:** Debugging failed CRON jobs and background tasks.
- **Action:** Delete logs older than 30 days to save space.

### 5. Active Sessions (`ActiveSession`)
- **Retention:** 90 Days
- **Purpose:** Security auditing and tracking active devices.
- **Action:** Delete invalidated sessions older than 90 days. Valid sessions remain until explicitly revoked or expired.

## Manual Cleanup Process
To enforce these policies manually before automation is built:
```sql
-- Example: Clean old automation logs
DELETE FROM "AutomationExecutionLog" WHERE "createdAt" < NOW() - INTERVAL '30 days';
```
