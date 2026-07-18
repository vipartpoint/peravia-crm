# SMOKE TEST REPORT

This smoke test is designed to be executed immediately after deploying the system to the production server.

## Environment Health
- [ ] **Frontend Accessible:** UI loads successfully at the production URL.
- [ ] **Backend Accessible:** API responds to requests (e.g., `/api/v1/health`).
- [ ] **Database Healthy:** Terminus reports PostgreSQL is connected and responding.
- [ ] **Redis Healthy:** Redis connection established.
- [ ] **MinIO Healthy:** Images and attachments can be uploaded and downloaded.

## Core Workflows
- [ ] **Auth Workflow:** Admin can log in and log out successfully.
- [ ] **Inventory Reservation:** Creating a test order correctly reserves stock.
- [ ] **Notifications:** Background Cron jobs successfully execute and deliver an alert.
- [ ] **AI Assistant:** AI responds to a basic query (e.g., "فروش امروز چقدر بوده؟").
- [ ] **Export Center:** Downloading an Excel report generates a valid `.xlsx` file.

**Smoke Test Final Status:** [ PENDING ]
**Tested By:** _______________
**Date:** _______________
