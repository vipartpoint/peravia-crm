# DEPLOYMENT GUIDE

This guide details the steps to deploy the CRM to a production server using Docker Compose.

## Prerequisites
- A Linux server (Ubuntu 22.04 recommended)
- Docker & Docker Compose installed
- Git
- A domain name pointing to the server's IP (e.g., `crm.yourcompany.com`)

## 1. Initial Server Setup
1. Clone the repository on the server:
   ```bash
   git clone <repo_url> /opt/crm
   cd /opt/crm
   ```
2. Set up environment variables:
   ```bash
   cp backend/.env.production.example backend/.env
   cp frontend/.env.production.example frontend/.env
   ```
3. Edit the `.env` files with secure, randomly generated secrets (see `JWT_SECRET`, `ENCRYPTION_KEY`). **DO NOT use the default example keys.**

## 2. Running the Infrastructure (Database, Redis, MinIO)
Before building the apps, start the persistent services:
```bash
docker-compose -f docker-compose.production.yml up -d db redis minio
```

## 3. Database Migration & Seeding
In production, we use `Prisma Migrate Deploy` instead of `db push`.
```bash
# Run migrations inside the backend container (or locally pointed to prod DB)
docker-compose -f docker-compose.production.yml run --rm backend npx prisma migrate deploy

# If this is the very first install, run the seed script
docker-compose -f docker-compose.production.yml run --rm backend npx prisma db seed
```

## 4. Starting the Application
Build and start the Backend and Frontend containers:
```bash
docker-compose -f docker-compose.production.yml up -d --build backend frontend
```
The backend should now be running on port 3000 (internal) and frontend on 3002. Use a reverse proxy (like Nginx) to expose them securely.

## 5. Nginx Reverse Proxy (Example)
Create an Nginx configuration (`/etc/nginx/sites-available/crm`):
```nginx
server {
    listen 80;
    server_name crm.yourcompany.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_addrs;
    }

    location / {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Enable the site and obtain an SSL certificate using `certbot`.

## 6. Backups
Ensure Cron jobs are set up to run the scripts located in `scripts/` (e.g., `backup-db.sh`). Do not store backup files inside the git repository. Move them to cold storage (e.g., AWS S3 or external hard drive).

## Common Errors
- **`P2002` Prisma Error:** Unique constraint failed. Check if you accidentally seeded twice.
- **502 Bad Gateway:** The backend container is restarting or down. Check logs with `docker logs crm-backend`.
- **JWT Signature Invalid:** The `JWT_SECRET` in `.env` changed, invalidating all current sessions. Users must log in again.
