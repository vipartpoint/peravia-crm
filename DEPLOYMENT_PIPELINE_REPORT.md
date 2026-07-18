# Deployment Pipeline Report

## Workflow Architecture
The `client-deploy.sh` script has been entirely rewritten to enforce a strictly gated, fail-safe deployment pipeline. If any step fails, the script immediately halts or rolls back, preventing broken states.

## Pipeline Steps
1. **Health Check (Current System)**: Verifies the existing system state using `client-verify.sh`. If it is the first deployment, it proceeds safely.
2. **Backup**: If a database container is currently running, a full `pg_dump` is executed into the `/backups` directory before any changes are pulled.
3. **Pull Images**: Docker compose pulls the exact `APP_VERSION` specified in the `.env.client`.
4. **Verify Image Digest**: The pipeline halts if a valid SHA256 image digest cannot be cryptographically verified from the pulled image.
5. **Restart Services**: The updated containers are brought online (`docker compose up -d`).
6. **Run Safe Migrations**: Executes `npx prisma migrate deploy` on the backend container to apply structured schema changes.
7. **Application Verification**: Runs `client-verify.sh` again to ensure the API, Frontend, Database, and Redis are fully functional.
8. **Automatic Rollback**: If either the migration (Step 6) or the final verification (Step 7) fails, the pipeline automatically:
   - Restores the PostgreSQL data from the backup taken in Step 2.
   - Reverts `APP_VERSION` to the previously running image tag.
   - Restarts the containers in their original, stable configuration.
