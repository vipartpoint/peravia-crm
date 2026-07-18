# PRODUCTION CHECKLIST

Before marking the project as Production-Ready, verify all the following items:

## 1. Security & Access
- [ ] **Auth Test:** Login, Logout, and Token Expiration behave exactly as expected.
- [ ] **Roles Test:** Ensure `SalesRep` cannot access `Reports` or `Warehouses` management.
- [ ] **Permissions Test:** Granular `UserPermissions` override `RolePermissions` correctly.
- [ ] **Sensitive Data Masking Test:** Financial amounts are masked (e.g., `*** تومان`) for unauthorized users. Password hashes are never returned in API responses.
- [ ] **AI Assistant Security Test:** Only `CEO` and `SalesManager` can access AI. Ensure the AI does not expose passwords or sensitive configuration data.

## 2. Functionality
- [ ] **Notification Cron Test:** Overdue tasks, low stock, and bounced cheques successfully generate and deduplicate notifications (no spam).
- [ ] **Order Inventory Reservation Test:** Creating an Approved order deducts `availableQuantity`. Cancelling the order restores it. Negative stock is strictly prevented.
- [ ] **Payment Update Test:** Approving a payment updates the customer's balance and reduces their total receivables.
- [ ] **Export Audit Test:** Exporting an Excel financial report correctly triggers an `AuditLog` entry.

## 3. DevOps & Infrastructure
- [ ] **Health Endpoint Works:** `GET /health` returns `200 OK` with DB, Redis, and MinIO status.
- [ ] **Backup Test:** `backup-db.sh` runs successfully and outputs a valid SQL file.
- [ ] **Restore Test:** `restore-db.sh` successfully imports the SQL file to a test database without errors.
- [ ] **Migrations Work:** `npx prisma migrate deploy` successfully tracks applied migrations without using `db push`.
- [ ] **Environment Variables:** Application safely crashes on startup if a critical `.env` variable (like `JWT_SECRET` or `ENCRYPTION_KEY`) is missing.
- [ ] **Rate Limiting:** Sending 100 fast requests to `/api/v1/auth/login` triggers a HTTP 429 Too Many Requests response.
