# MIGRATION POLICY

This document defines the strict rules for making database changes in the Production environment.

## 1. Golden Rule
**NEVER run `npx prisma db push` in production.**
`db push` can cause data loss, drop tables without warning, and cannot be rolled back safely.

## 2. Using Prisma Migrations
All database schema changes in production MUST be applied using Prisma Migrate.

### Development Workflow
When making schema changes in development:
1. Update `schema.prisma`.
2. Generate migration: `npx prisma migrate dev --name <descriptive_name>`
3. Commit the generated `prisma/migrations` folder to Git.

### Production & CI/CD Workflow
When deploying changes to production or running in CI/CD pipelines:
1. Ensure the database is fully backed up (see backup scripts).
2. Run migration: `npx prisma migrate deploy`
3. Restart the application.

### Strictly Prohibited
- **`npx prisma migrate dev` in non-dev environments**: `migrate dev` is designed exclusively for local development. It drops databases upon drift detection and requires an interactive TTY.
- **Pseudo-TTY Workarounds**: Never use `script`, `pty.spawn`, or other pseudo-TTY hacks in pipelines or servers to bypass the interactive prompt of `migrate dev`. This can cause catastrophic data loss in production. Only `migrate deploy` is permitted.

## 3. Reversibility
Every migration must be evaluated for reversibility.
- If adding a column, ensure it's nullable or has a default value.
- If renaming a column, prefer adding the new column, migrating data, then dropping the old column in a future release.
- Avoid dropping columns/tables unless completely deprecated and safely backed up.

## 4. Emergency Rollback
Prisma migrations are forward-only. If a bad migration is applied:
1. Restore the database from the immediate pre-migration backup.
2. Revert the codebase to the previous stable commit.
3. Restart the application.
4. Manually mark the failed migration as rolled back in the Prisma migrations table if necessary.
