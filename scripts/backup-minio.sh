#!/bin/bash

# Configuration
BACKUP_DIR="/opt/crm/backups/minio"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ARCHIVE="${BACKUP_DIR}/crm_minio_backup_${TIMESTAMP}.tar.gz"

# Minio data volume is usually mapped to crm_minio_data
# We can use a temporary docker container to mount the volume and tar it

mkdir -p "$BACKUP_DIR"

echo "Starting MinIO backup..."

docker run --rm \
  -v crm_minio_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar -czf /backup/$(basename "$BACKUP_ARCHIVE") -C /data .

if [ $? -eq 0 ]; then
  echo "MinIO backup successful! File saved to: $BACKUP_ARCHIVE"
  
  # Delete backups older than 30 days
  find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +30 -exec rm {} \;
  echo "Old backups cleaned up."
else
  echo "Error: MinIO backup failed!"
  exit 1
fi
