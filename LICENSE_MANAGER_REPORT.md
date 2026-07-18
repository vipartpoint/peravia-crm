# License Manager Report

## Architecture
The License Manager is a NestJS module responsible for enforcing commercial licensing directly within the backend's runtime environment.

## Components
1. **LicenseService**:
   - Reads `LICENSE_KEY`, `LICENSE_CLIENT_ID`, and `LICENSE_DOMAIN` from environment variables.
   - Decodes the `LICENSE_KEY` (a JWT token) to verify the payload against the provided client ID and domain.
   - Validates the license expiration date.
2. **LicenseGuard**:
   - Acts as an interceptor for incoming HTTP requests.
   - If the license is found to be invalid, expired, or missing, it blocks access to protected API endpoints, returning a `402 Payment Required` status.
3. **LicenseController**:
   - Exposes a health/status endpoint at `GET /api/v1/system/license-status`.
   - Explicitly restricted to users with the `SystemAdmin` role.
   - Bypasses the LicenseGuard to allow administrators to diagnose licensing issues without needing direct server access.

## Protection Mechanism
By coupling the license validation to the API layer, the backend remains partially functional for health checks and status diagnostics, but completely restricts access to core CRM business logic if the commercial agreement is violated.
