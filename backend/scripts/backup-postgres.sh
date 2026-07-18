#!/bin/bash
# scripts/backup-postgres.sh
set -e

# Load environment variables if .env exists
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
fi

DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-crm_db}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/crm/postgres}
CONTAINER_NAME="crm_postgres"
LOG_DIR="$(dirname "$0")/../logs"
LOG_FILE="$LOG_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
chmod 700 "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="crm_pg_backup_${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] START PostgreSQL backup" >> "$LOG_FILE"

# Backup using docker exec
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"; then
    chmod 600 "$FILEPATH"
    FILESIZE=$(ls -lh "$FILEPATH" | awk '{print $5}')
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SUCCESS Backup saved to $FILEPATH (Size: $FILESIZE)" >> "$LOG_FILE"
else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FAILED PostgreSQL backup" >> "$LOG_FILE"
    exit 1
fi

# Apply 30-day retention
echo "Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -type f -name "crm_pg_backup_*.sql.gz" -mtime +30 -exec rm {} \;
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Retention policy applied." >> "$LOG_FILE"
