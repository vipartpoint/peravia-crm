# Backup Architecture

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **Backup Status:** No backups configured or active.
- **Data Location:** Future data to reside in `/opt/peravia/docker`, `/opt/peravia/licenses`, and Docker volumes.

## Current State
Data is entirely ephemeral and vulnerable. No backup cron jobs, staging directories, or offsite storage integrations exist.

## Target State
A comprehensive, automated, and encrypted backup architecture. 
Backups must encompass:
- PostgreSQL database dumps.
- Docker Volumes (uploaded assets).
- MinIO object storage buckets.
- Commercial License files.
- Encryption Keys and Application Secrets (`.env`).
- Nginx configurations.
- `docker-compose` YAML manifests.
All backups will undergo AES-256 encryption prior to local staging and subsequent transmission to offsite immutable storage.

## Implementation Order
1. Provision local staging directory `/opt/peravia/backups`.
2. Generate AES-256 encryption keys specifically for backup protection.
3. Develop bash scripts utilizing `pg_dump`, `tar`, and `openssl` to capture and encrypt PostgreSQL, volumes, MinIO, and configuration files.
4. Integrate `rclone` or equivalent CLI to sync encrypted archives to the offsite immutable bucket.
5. Configure system `cron` for daily execution.
6. Implement backup monitoring and failure alerting via webhooks.

## Risk Analysis
- **Silent Failures:** Cron jobs failing without notifications lead to false assumptions of safety.
- **Encryption Lockout:** Losing the AES-256 decryption key renders all backups completely useless.
- **Data Leakage:** Transferring unencrypted backups over the internet or storing them in misconfigured S3 buckets exposes sensitive CRM data.

## Rollback Strategy
- Backup scripts are stateless. Rolling back involves removing the cron job and deleting the staging directory `/opt/peravia/backups`.
- Revert any IAM policies created for offsite storage access.

## Runtime Verification
- **Automatic Verification:** The backup script must automatically compute SHA-256 checksums (integrity verification) before and after offsite transfer.
- **Automatic Restore Testing:** A monthly scheduled pipeline must automatically pull the latest backup, decrypt it, import it into a transient staging database, and run smoke tests to verify data consistency.

## Security Considerations
- **Offsite Immutable Storage:** The remote storage (e.g., S3 Object Lock) must enforce WORM (Write Once, Read Many) policies to protect against ransomware deleting backups.
- **Retention & Rotation Policy:** Maintain 7 days local, 30 days daily offsite, and 12 months monthly offsite. Older backups must be automatically rotated and purged.
- **Failure Alerting:** Any non-zero exit code from the backup scripts must immediately trigger high-priority alerts to the engineering team.

## Dependencies
- Provisioned Offsite Immutable Storage bucket (e.g., AWS S3).
- AES-256 key management infrastructure.
- Configured webhook endpoints for alerting.

## Acceptance Criteria
- Full backup lifecycle (dump, encrypt, sync, verify, alert) successfully executes autonomously.
- Encrypted data at rest in offsite storage cannot be deleted before the retention period expires.
