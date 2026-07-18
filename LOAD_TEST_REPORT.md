# LOAD TEST REPORT

This document records the baseline performance metrics of the CRM system under simulated user load using `k6`.

## Baseline Thresholds
As per requirements:
- **Average Response Time:** < 500ms
- **P95 Response Time:** < 1500ms
- **Error Rate:** < 1%

## Test Execution Results

| Test Suite | Max VUs (Users) | Duration | Avg Response Time | P95 Response Time | Error Rate | Status |
|------------|-----------------|----------|-------------------|-------------------|------------|--------|
| `login-test.js` | 50 | 1m 40s | *Pending* | *Pending* | *Pending* | [ PENDING ] |
| `dashboard-test.js` | 100 | 3m | *Pending* | *Pending* | *Pending* | [ PENDING ] |
| `orders-test.js` | 50 | 2m | *Pending* | *Pending* | *Pending* | [ PENDING ] |
| `reports-test.js` | 20 | 1m 40s | *Pending* | *Pending* | *Pending* | [ PENDING ] |
| `notifications-test.js`| 50 | 2m | *Pending* | *Pending* | *Pending* | [ PENDING ] |

## Instructions for Running Tests
Ensure the backend is running locally or on a staging server.

```bash
# Install k6 on macOS
brew install k6

# Run a specific test
k6 run load-tests/dashboard-test.js
```

## Risk Assessment
If any test fails to meet the baseline thresholds:
- **Avg > 500ms but P95 < 1500ms:** Medium Risk. Monitor and plan database indexing.
- **P95 > 1500ms or Error Rate > 1%:** High Risk. Must be investigated before Go-Live.
