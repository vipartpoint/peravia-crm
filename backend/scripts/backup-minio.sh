#!/bin/bash
# scripts/backup-minio.sh
set -e

# Load env variables
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
fi

MINIO_ENDPOINT=${MINIO_ENDPOINT:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-admin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-admin123}
MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME:-crm-documents}

BACKUP_DIR=${MINIO_BACKUP_DIR:-/var/backups/crm/minio}
LOG_DIR="$(dirname "$0")/../logs"
LOG_FILE="$LOG_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
chmod 700 "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="crm_minio_backup_${TIMESTAMP}.tar.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"
TMP_DIR="/tmp/crm_minio_backup_${TIMESTAMP}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] START MinIO backup" >> "$LOG_FILE"

# Make sure Docker network alias is correct if run from inside Docker network, 
# otherwise we use minio/mc image with host network
if docker run --rm -v "$TMP_DIR:/backup_tmp" --network host --entrypoint sh minio/mc -c "\
  mc alias set myminio http://$MINIO_ENDPOINT:$MINIO_PORT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY && \
  mc mirror myminio/$MINIO_BUCKET_NAME /backup_tmp"; then
  
    # Compress the mirrored data
    tar -czf "$FILEPATH" -C "$TMP_DIR" .
    rm -rf "$TMP_DIR"
    chmod 600 "$FILEPATH"
    
    FILESIZE=$(ls -lh "$FILEPATH" | awk '{print $5}')
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SUCCESS MinIO backup saved to $FILEPATH (Size: $FILESIZE)" >> "$LOG_FILE"
else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FAILED MinIO backup" >> "$LOG_FILE"
    rm -rf "$TMP_DIR"
    exit 1
fi

# Apply 30-day retention
echo "Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -type f -name "crm_minio_backup_*.tar.gz" -mtime +30 -exec rm {} \;
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Retention policy applied." >> "$LOG_FILE"
