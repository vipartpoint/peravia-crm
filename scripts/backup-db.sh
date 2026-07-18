#!/bin/bash

# Configuration
BACKUP_DIR="/opt/crm/backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/crm_db_backup_${TIMESTAMP}.sql"
CONTAINER_NAME="crm_db_prod"
DB_USER="crm_user"
DB_NAME="crm_prod_db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

# Run pg_dump inside the container
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successful! File saved to: $BACKUP_FILE"
  # Compress the backup
  gzip "$BACKUP_FILE"
  echo "Backup compressed: ${BACKUP_FILE}.gz"
  
  # Delete backups older than 30 days
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
  echo "Old backups cleaned up."
else
  echo "Error: Database backup failed!"
  rm -f "$BACKUP_FILE"
  exit 1
fi
