#!/bin/bash

# Configuration
CONTAINER_NAME="crm_db_prod"
DB_USER="crm_user"
DB_NAME="crm_prod_db"

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh /path/to/backup_file.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File $BACKUP_FILE not found!"
  exit 1
fi

echo "WARNING: This will overwrite the current database."
read -p "Are you sure you want to proceed? (y/N) " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Extracting backup..."
gunzip -k -f "$BACKUP_FILE"
EXTRACTED_FILE="${BACKUP_FILE%.gz}"

echo "Restoring database..."
# Drop and recreate public schema to ensure clean restore
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Import the data
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$EXTRACTED_FILE"

if [ $? -eq 0 ]; then
  echo "Restore completed successfully!"
else
  echo "Error during restore!"
fi

# Clean up extracted file
rm -f "$EXTRACTED_FILE"
