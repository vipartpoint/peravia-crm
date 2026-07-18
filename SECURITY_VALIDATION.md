# SECURITY VALIDATION REPORT

This document verifies the application of security hardening measures in the CRM system.

## Validation Checklist

| Control | Description | Expected Outcome | Actual Result | Pass/Fail |
|---------|-------------|------------------|---------------|-----------|
| **JWT Expiration** | Verify tokens expire after `15m` | Token rejected after 15m | | |
| **Session Revocation** | Logout or forced revocation | Subsequent requests fail immediately | | |
| **Locked Account** | 5 failed logins lock account | Login returns 403 Forbidden | | |
| **Rate Limiting** | Spam API with requests | Returns 429 Too Many Requests | | |
| **Permission Override** | Deny specific user from role | User gets 403 despite having the Role | | |
| **Audit Logging** | Export financial report | `AuditLog` table receives new entry | | |
| **Data Masking** | SalesRep views dashboard | Receivables show `***` (Masked) | | |
| **AI Access Control** | SalesRep calls AI endpoint | Returns 403 Forbidden | | |
| **No Stack Traces** | Trigger a 500 server error | Returns clean JSON with `traceId` only | | |
