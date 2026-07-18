#!/bin/bash
# scripts/test-restore-postgres.sh
set -e

# Load env variables
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
fi

DB_USER=${POSTGRES_USER:-postgres}
CONTAINER_NAME="crm_postgres"
BACKUP_DIR=${BACKUP_DIR:-/var/backups/crm/postgres}
TEST_DB="crm_db_test_restore"
LOG_DIR="$(dirname "$0")/../logs"
LOG_FILE="$LOG_DIR/restore-test.log"

mkdir -p "$LOG_DIR"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] START PostgreSQL Restore Test" >> "$LOG_FILE"

# Find latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/crm_pg_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FAILED No backup file found in $BACKUP_DIR" >> "$LOG_FILE"
    exit 1
fi

echo "Testing restore with file: $LATEST_BACKUP"

# 1. Create temporary database
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEST_DB;"

# 2. Restore latest backup into temporary database
if gunzip -c "$LATEST_BACKUP" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$TEST_DB" > /dev/null; then
    echo "Restore completed. Running validations..."
    
    # 3. Basic Validation Queries
    USERS_COUNT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$TEST_DB" -t -c 'SELECT count(*) FROM "User";' | tr -d ' ')
    CUSTOMERS_COUNT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$TEST_DB" -t -c 'SELECT count(*) FROM "Customer";' | tr -d ' ')
    
    echo "Validation Results:"
    echo "Users: $USERS_COUNT"
    echo "Customers: $CUSTOMERS_COUNT"
    
    if [ "$USERS_COUNT" -gt 0 ]; then
        echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SUCCESS Restore Test Passed (Users: $USERS_COUNT, Customers: $CUSTOMERS_COUNT)" >> "$LOG_FILE"
    else
        echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] WARNING Restore Test Passed but tables are empty" >> "$LOG_FILE"
    fi
else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FAILED Restore process crashed" >> "$LOG_FILE"
fi

# 4. Drop temporary database
echo "Cleaning up temporary test database..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"

echo "Test restore workflow finished."
