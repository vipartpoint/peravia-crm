# Server Deployment Runbook

## Target Environment
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS.
- **Dependencies**: Docker Engine, Docker Compose.

## Security Hardening
Before deploying the CRM, the following server hardening steps MUST be executed:
1. **Firewall (UFW)**: 
   - Enable UFW.
   - Allow incoming connections only on ports `80` (HTTP), `443` (HTTPS), and `22` (SSH).
2. **SSH Configuration**: 
   - Disable root password login.
   - Mandate SSH Key authentication (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
3. **SSL/TLS**: 
   - Utilize Let's Encrypt (Certbot) to secure traffic routed through the NGINX reverse proxy.
4. **Monitoring**:
   - Optional: Install `fail2ban` to protect against brute-force SSH attacks.
   - Schedule daily automated backups of the PostgreSQL volume.

## Deployment Flow
1. Upload the `client-deploy/` folder to the VPS (e.g., `/opt/peravia-crm`).
2. Copy `.env.client.example` to `.env.client` and inject the actual `LICENSE_KEY` and secrets.
3. Make the scripts executable: `chmod +x scripts/*.sh`
4. Execute the deployment script: `./scripts/client-deploy.sh`
5. Monitor the output for the health verification step. If verification fails, inspect container logs: `docker compose -f docker-compose.client.yml logs backend`.
