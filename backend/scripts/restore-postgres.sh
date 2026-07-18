#!/bin/bash
# scripts/restore-postgres.sh
set -e

if [ "$CONFIRM_RESTORE" != "YES" ]; then
    echo "ERROR: You must set CONFIRM_RESTORE=YES to run this script."
    echo "Warning: Never restore directly into production without explicit confirmation!"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

FILEPATH="$1"

if [ ! -f "$FILEPATH" ]; then
    echo "ERROR: File $FILEPATH does not exist."
    exit 1
fi

# Load env variables
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
fi

DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-crm_db}
CONTAINER_NAME="crm_postgres"

echo "Restoring database from $FILEPATH..."

# Restore using docker exec
gunzip -c "$FILEPATH" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "Restore completed successfully."
