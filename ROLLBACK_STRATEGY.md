# Rollback Strategy

## Philosophy
In modern deployment architectures, failures must be anticipated. The rollback strategy guarantees that the system can revert to the last known stable state in under 60 seconds with zero data loss.

## Automated Deployment Rollback
The `client-deploy.sh` script handles immediate rollback during a failed deployment.
1. **Pre-condition**: Before pulling new images, the script captures the current `APP_VERSION` from the running containers and creates a complete `pg_dump` of the PostgreSQL database.
2. **Failure Trigger**: If `npx prisma migrate deploy` exits with a non-zero status, OR if the post-deployment health check (`client-verify.sh`) fails.
3. **Rollback Execution**:
   - The script restores the database snapshot, undoing any partial schema migrations or data alterations.
   - The script reverts the Docker Compose orchestration to the exact image tag (`APP_VERSION`) captured in step 1.
   - The containers are restarted, seamlessly bringing the stable environment back online.

## Manual Rollback
If a logical bug is discovered hours after a successful technical deployment:
1. The client modifies the `.env.client` file, changing `APP_VERSION` back to the previous version (e.g., from `v1.2.0` to `v1.1.0`).
2. The client executes `docker-compose -f docker-compose.client.yml up -d`.
3. *Note on Databases*: If the new version introduced database schema changes via Prisma migrations, manual intervention may be required to restore the database backup taken prior to the update, as Prisma cannot automatically reverse destructive schema migrations without a backup.
