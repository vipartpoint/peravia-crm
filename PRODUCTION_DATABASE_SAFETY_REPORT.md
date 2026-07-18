# Production Database Safety Report

## 1. Migration Enforcement
**CRITICAL RULE**: The command `prisma db push` is strictly forbidden in production environments.
- `prisma db push` syncs the schema by forcefully modifying the database, which can result in catastrophic data loss (e.g., dropping columns, resetting tables).
- The deployment architecture exclusively utilizes `npx prisma migrate deploy`.

## 2. How `migrate deploy` Protects Data
- It relies on a pre-generated history of SQL migration files (`prisma/migrations/*`).
- It applies only new, pending migrations sequentially.
- It never automatically drops tables or columns unless explicitly declared and reviewed in a SQL migration file generated during development.
- It guarantees that the database state transitions predictably without automated, destructive assumptions.

## 3. Pre-Migration Backups
Before `migrate deploy` is ever executed, the deployment pipeline guarantees a full `pg_dump` backup is saved locally on the client's server. If a migration fails mid-execution, the automatic rollback mechanism seamlessly restores this exact snapshot, ensuring zero data loss.
