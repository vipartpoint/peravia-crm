# SECRET MANAGEMENT REPORT

This document outlines the transition from environment-variable-based secrets to production-grade secret management.

## Current Setup (Docker Secrets)
To mitigate the risk of `.env` files being leaked or inadvertently committed, the `docker-compose.production.yml` has been updated to use **Docker Secrets** for the most critical keys:
- `JWT_SECRET`
- `ENCRYPTION_KEY`

These are read from physical files located in the `.secrets/` directory on the host machine.
**Security Measure:** The `.secrets/*` path has been added to `.gitignore`. **DO NOT** commit this folder.

## Migration Path to AWS KMS / HashiCorp Vault
For true Enterprise-Grade security, Docker Secrets should eventually be replaced by a centralized key management system.

### Phase 1: HashiCorp Vault (On-Premise / Cloud Agnostic)
1. Deploy a Vault cluster.
2. In the Next.js and NestJS startup sequence, integrate `node-vault`.
3. The applications authenticate with Vault using an AppRole (RoleID and SecretID).
4. Vault injects the `JWT_SECRET` and `ENCRYPTION_KEY` directly into memory at runtime. No secret files touch the disk.

### Phase 2: AWS KMS (If hosted on AWS)
1. Use AWS Systems Manager (SSM) Parameter Store or AWS Secrets Manager.
2. Assign an IAM Task Role to the ECS/EKS containers.
3. The Node.js application uses the AWS SDK to fetch parameters dynamically during boot.

## Action Required by DevOps
Before executing `docker-compose up`:
1. Create the `.secrets` directory on the production server.
2. Generate highly secure random strings and place them in `jwt_secret.txt` and `encryption_key.txt`.
3. Set strict file permissions (`chmod 400 .secrets/*`).
