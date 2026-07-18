# UAT CHECKLIST (User Acceptance Testing)

This checklist verifies the end-to-end functionality of the CRM from a user's perspective. 

**TODO:** In a future phase, these manual steps should be converted to automated E2E tests using `Cypress` or `Jest/Supertest`.

## 1. Authentication & Users
| Scenario | Expected Result | Actual Result | Status | Tester | Date |
|----------|-----------------|---------------|--------|--------|------|
| Login with valid credentials | Redirected to Dashboard, Token received | | | | |
| Login with invalid credentials | Shows "Invalid credentials" error | | | | |
| Account Lockout | After 5 failed attempts, account is locked | | | | |
| Role-based Menu | SalesRep does not see "Security" or "Warehouses" | | | | |

## 2. E2E Business Flow (The "Happy Path")
| Scenario | Expected Result | Actual Result | Status | Tester | Date |
|----------|-----------------|---------------|--------|--------|------|
| 1. Create Lead | Lead created with "New" status | | | | |
| 2. Create Presentation | Presentation logged, Lead status updated | | | | |
| 3. Convert to Customer | Customer profile created from Lead | | | | |
| 4. Create Order (Draft) | Order created, no inventory deducted | | | | |
| 5. Submit for Approval | Order status becomes "PendingApproval" | | | | |
| 6. Manager Approves | Order status -> "Approved", Inventory Reserved | | | | |
| 7. Record Payment | Payment logged, Receivables decreased | | | | |
| 8. Commission Calc | Commission automatically calculated for SalesRep | | | | |

## 3. Inventory & Approvals
| Scenario | Expected Result | Actual Result | Status | Tester | Date |
|----------|-----------------|---------------|--------|--------|------|
| Approve order with insufficient stock | Approval fails with error message, stock untouched | | | | |
| Cancel approved order | Reserved stock is released back to available | | | | |

## 4. Notifications & AI
| Scenario | Expected Result | Actual Result | Status | Tester | Date |
|----------|-----------------|---------------|--------|--------|------|
| Overdue Task | Cron generates "Warning" notification for user | | | | |
| AI Assistant Query | AI answers using CRM data, access restricted to CEO | | | | |
