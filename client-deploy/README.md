# CRM Commercial Deployment

This package contains all necessary files to securely deploy the CRM backend and frontend on your server.
Source code is not included; the deployment uses compiled Docker images.

## Prerequisites
- Ubuntu 22.04 or 24.04 LTS
- Docker and Docker Compose installed
- Ports 80 and 443 open (and SSH)
- Valid License Key and Client ID from your provider

## 1. Initial Setup
1. Copy this folder (`client-deploy/`) to your server, e.g., `/opt/crm/`.
2. Navigate to the directory: `cd /opt/crm`
3. Copy the environment template: `cp .env.client.example .env.client`
4. Edit `.env.client`:
   - Set your `LICENSE_KEY`, `LICENSE_CLIENT_ID`, and `LICENSE_DOMAIN`.
   - Update `JWT_SECRET`, `ENCRYPTION_KEY`, and database passwords.
   - Adjust Minio and Redis settings if necessary.

## 2. Deployment
To deploy or update the CRM, run the deployment script:
```bash
./scripts/client-deploy.sh
```
This script will:
1. Pull the latest images from the registry.
2. Back up the database (if it's not the first run).
3. Restart the containers.
4. Run safely necessary database migrations.
5. Verify health endpoints.

## 3. Backups
Backups are automatically taken by `client-deploy.sh` before any updates.
To take a manual backup, run:
```bash
docker exec crm_db_client pg_dump -U postgres crm_db > "backups/manual_backup_$(date +%Y%m%d).sql"
```

## 4. Updates
To update the CRM when a new release is available:
1. Log into your server and navigate to `/opt/crm`.
2. Ensure you have backed up your `.env.client`.
3. Simply run `./scripts/client-deploy.sh`. It will pull the latest `latest` tag (or specific version if updated in docker-compose.client.yml).

## 5. Security & Hardening Recommendations
- Use UFW firewall to block all ports except 80, 443, and SSH (22).
- Disable password-based SSH logins and use SSH Keys.
- Keep the server packages updated (`apt update && apt upgrade`).
- Set up Let's Encrypt SSL certificates for NGINX.
