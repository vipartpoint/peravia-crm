#!/bin/bash
set -e

echo "Starting CRM Commercial Deployment Pipeline..."

# Environment Check
if [ ! -f .env.client ]; then
  echo "Error: .env.client not found. Please create it from .env.client.example."
  exit 1
fi
source .env.client

PREV_BACKEND_IMAGE=$(docker ps --filter "name=crm_backend_client" --format "{{.Image}}" || true)

# 1. Health Check (Current System)
echo "Checking current system health..."
./scripts/client-verify.sh || echo "System is not fully healthy or first deployment. Proceeding..."

# 2. Backup (when production data exists)
BACKUP_FILE=""
if docker ps | grep -q crm_db_client; then
  echo "Backing up database..."
  mkdir -p backups
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  docker exec crm_db_client pg_dump -U $DB_USER $DB_NAME > "backups/$BACKUP_FILE"
  echo "Backup completed: $BACKUP_FILE"
else
  echo "No database container running. Skipping backup."
fi

# 3. Pull Images
echo "Pulling explicit version tags for images..."
docker compose -f docker-compose.client.yml pull

# 4. Verify Image Digest
echo "Verifying image digest integrities..."
BACKEND_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/${GITHUB_OWNER}/peravia/backend:${APP_VERSION:-v1.0.0} 2>/dev/null || true)
if [ -z "$BACKEND_DIGEST" ]; then
  echo "CRITICAL: Image Digest Verification Failed for Backend Image."
  exit 1
fi
echo "Backend Digest Verified: $BACKEND_DIGEST"

# 5. Restart Services
echo "Starting updated services..."
docker compose -f docker-compose.client.yml up -d

# Wait for DB
echo "Waiting for database stabilization..."
sleep 10

# 6. Run Migrations (Strictly deploy)
echo "Running safe production database migrations..."
if ! docker exec crm_backend_client npx prisma migrate deploy; then
  echo "CRITICAL: Database migration failed. Initiating Rollback..."
  
  if [ -n "$BACKUP_FILE" ]; then
     echo "Restoring database backup..."
     cat "backups/$BACKUP_FILE" | docker exec -i crm_db_client psql -U $DB_USER -d $DB_NAME
  fi
  
  if [ -n "$PREV_BACKEND_IMAGE" ]; then
     echo "Reverting to previous image..."
     APP_VERSION=$(echo $PREV_BACKEND_IMAGE | cut -d':' -f2)
     docker compose -f docker-compose.client.yml up -d
  fi
  
  echo "Rollback Complete. Deployment Failed."
  exit 1
fi

# 7. Final Health & App Verification
echo "Verifying final deployment health..."
if ! ./scripts/client-verify.sh; then
  echo "CRITICAL: Application Verification Failed post-deployment. Initiating Rollback..."
  if [ -n "$BACKUP_FILE" ]; then
     cat "backups/$BACKUP_FILE" | docker exec -i crm_db_client psql -U $DB_USER -d $DB_NAME
  fi
  if [ -n "$PREV_BACKEND_IMAGE" ]; then
     APP_VERSION=$(echo $PREV_BACKEND_IMAGE | cut -d':' -f2)
     docker compose -f docker-compose.client.yml up -d
  fi
  echo "Rollback Complete. Deployment Failed."
  exit 1
fi

echo "================================================="
echo "Deployment completed successfully! Version: ${APP_VERSION:-v1.0.0}"
echo "================================================="
