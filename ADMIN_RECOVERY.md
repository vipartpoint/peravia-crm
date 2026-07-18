# ADMIN RECOVERY PROCESS

This document outlines the emergency procedures to recover System Administrator access in the production environment.

## Scenario 1: Lost Admin Access / Locked Account
If the primary `SystemAdmin` account is locked due to too many failed logins or the password is forgotten, and no other SystemAdmin is available to unlock it:

### Steps via Database
1. SSH into the production database server (or use a secure DB client).
2. Run the following SQL query to reset the lock status and failed login count:
   ```sql
   UPDATE "User"
   SET "isLocked" = false, "failedLogins" = 0
   WHERE "username" = 'admin';
   ```
3. If the password is forgotten, you can generate a new bcrypt hash locally (e.g., using `bcrypt.hashSync('newpassword', 10)`) and update it:
   ```sql
   UPDATE "User"
   SET "passwordHash" = '<new_bcrypt_hash>'
   WHERE "username" = 'admin';
   ```

## Scenario 2: MFA Recovery
If the admin has lost their phone/Authenticator app and cannot generate the MFA code:

### Steps via Database
1. Disable MFA for the admin user directly in the database:
   ```sql
   UPDATE "User"
   SET "mfaEnabled" = false, "mfaSecret" = null
   WHERE "username" = 'admin';
   ```
2. The admin can now log in using just their username and password.
3. Once logged in, the admin MUST set up MFA again from the security settings page.

## Scenario 3: Database Restore (Disaster Recovery)
If the database is corrupted or data is maliciously altered, restore from the latest automated backup.

### Steps
1. Stop the backend application to prevent new corrupt data from being written.
   ```bash
   docker-compose stop backend
   ```
2. Locate the latest backup file (e.g., `backup_db_YYYYMMDD_HHMMSS.sql`).
3. Drop the current public schema and restore the backup (use with caution):
   ```bash
   # Drop current schema
   docker exec -it postgres_container psql -U crm_user -d crm_prod_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   
   # Restore backup
   docker exec -i postgres_container psql -U crm_user -d crm_prod_db < /path/to/backup_db_YYYYMMDD_HHMMSS.sql
   ```
4. Start the backend application.
   ```bash
   docker-compose start backend
   ```

**IMPORTANT:** Always securely store the generated backup files and `ENCRYPTION_KEY`. If `ENCRYPTION_KEY` is lost, MFA secrets and encrypted fields will be irrecoverable even if the database is restored.
