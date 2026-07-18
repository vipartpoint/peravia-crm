#!/bin/bash
set -e

echo "Starting CRM Deployment..."

# 1. Pull latest images
echo "Pulling latest Docker images..."
docker compose -f docker-compose.client.yml pull

# 2. Database Backup (if exists)
if docker ps | grep -q crm_db_client; then
  echo "Backing up database..."
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  docker exec crm_db_client pg_dump -U postgres crm_db > "backups/$BACKUP_FILE"
  echo "Backup completed: $BACKUP_FILE"
else
  echo "No database container running. Skipping backup for first deployment."
fi

# 3. Restart Containers
echo "Restarting services..."
docker compose -f docker-compose.client.yml up -d

# Wait for DB to be healthy
echo "Waiting for database..."
sleep 10

# 4. Run Migrations (Safe for production: prisma migrate deploy)
echo "Running database migrations..."
docker exec crm_backend_client npx prisma migrate deploy

# 5. Verify Health
echo "Verifying deployment health..."
./scripts/client-verify.sh

echo "Deployment completed successfully!"
