#!/bin/bash
# scripts/deploy-safe.sh
# One-Command Safe Deploy System for CRM

set -e

# --- Configuration ---
DEPLOY_MODE=${DEPLOY_MODE:-git_build}
BACKUP_DIR_PG=${BACKUP_DIR_PG:-/var/backups/crm/predeploy/postgres}
BACKUP_DIR_MINIO=${BACKUP_DIR_MINIO:-/var/backups/crm/predeploy/minio}
LOG_DIR=${LOG_DIR:-/var/log/crm/deployments}
LOCK_FILE=${LOCK_FILE:-/tmp/crm_deploy.lock}
COMPOSE_FILE="docker-compose.production.yml"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
PG_BACKUP_FILE="$BACKUP_DIR_PG/crm_predeploy_${TIMESTAMP}.dump"
MINIO_BACKUP_FILE="$BACKUP_DIR_MINIO/crm_minio_${TIMESTAMP}.tar.gz"
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

# --- Globals for Rollback ---
PREVIOUS_HASH=""
MIGRATION_APPLIED=false
DB_BACKUP_CREATED=false
MINIO_BACKUP_CREATED=false
DEPLOY_SUCCESS=false

# --- Helper Functions ---
log() {
  if [ -f "$LOG_FILE" ]; then
    echo -e "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
  else
    echo -e "[$TIMESTAMP] $1"
  fi
}

log_error() {
  if [ -f "$LOG_FILE" ]; then
    echo -e "[$TIMESTAMP] \033[31mERROR: $1\033[0m" | tee -a "$LOG_FILE"
  else
    echo -e "[$TIMESTAMP] \033[31mERROR: $1\033[0m"
  fi
}

log_success() {
  if [ -f "$LOG_FILE" ]; then
    echo -e "[$TIMESTAMP] \033[32mSUCCESS: $1\033[0m" | tee -a "$LOG_FILE"
  else
    echo -e "[$TIMESTAMP] \033[32mSUCCESS: $1\033[0m"
  fi
}

setup_dirs() {
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would create backup and log directories."
    return 0
  fi
  mkdir -p "$BACKUP_DIR_PG" "$BACKUP_DIR_MINIO" "$LOG_DIR"
  chmod 700 "$BACKUP_DIR_PG" "$BACKUP_DIR_MINIO"
}

cleanup() {
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would remove lock file."
    return 0
  fi
  rm -f "$LOCK_FILE"
  if [ "$DEPLOY_SUCCESS" = "false" ]; then
    log_error "Deployment exited abnormally."
  fi
}

trap cleanup EXIT

acquire_lock() {
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would acquire lock file $LOCK_FILE"
    return 0
  fi
  if [ -f "$LOCK_FILE" ]; then
    log_error "Deployment is already in progress (Lock file exists: $LOCK_FILE)"
    exit 1
  fi
  echo $$ > "$LOCK_FILE"
}

preflight_checks() {
  if [ "$DEPLOY_CONFIRM" != "YES" ] && [ "$DRY_RUN" != "YES" ]; then
    log_error "DEPLOY_CONFIRM=YES is required. Stop immediately."
    exit 1
  fi
  
  if [ "$DRY_RUN" != "YES" ]; then
    touch "$LOG_FILE"
  fi
  
  log "Starting Preflight Checks..."
  if ! command -v docker >/dev/null 2>&1; then log_error "Docker is not installed"; exit 1; fi
  if ! command -v git >/dev/null 2>&1; then log_error "Git is not installed"; exit 1; fi
  
  if [ "$DEPLOY_MODE" != "git_build" ] && [ "$DEPLOY_MODE" != "registry_pull" ]; then
    log_error "Invalid DEPLOY_MODE. Must be git_build or registry_pull."
    exit 1
  fi
}

capture_state() {
  log "Capturing state..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would capture previous git hash"
    PREVIOUS_HASH="dry-run-hash"
  else
    PREVIOUS_HASH=$(git rev-parse HEAD)
  fi
  log "Previous Git Hash: $PREVIOUS_HASH"
}

pull_latest() {
  log "Pulling latest code (Mode: $DEPLOY_MODE)..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would run git pull"
    return 0
  fi
  
  if [ "$DEPLOY_MODE" = "git_build" ]; then
    git pull origin main || { log_error "Git pull failed"; exit 1; }
  else
    log "Registry pull mode - git pull skipped or minimal update."
    # Depending on setup, might pull infra repo
  fi
}

backup_postgres() {
  log "Backing up PostgreSQL..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would run pg_dump -Fc to $PG_BACKUP_FILE"
    return 0
  fi
  
  docker exec crm_db_prod pg_dump -Fc -U postgres crm_db > "$PG_BACKUP_FILE" || { log_error "DB Backup failed"; exit 1; }
  chmod 600 "$PG_BACKUP_FILE"
  DB_BACKUP_CREATED=true
  log_success "Database backup created: $PG_BACKUP_FILE"
}

backup_minio() {
  log "Backing up MinIO..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would backup MinIO to $MINIO_BACKUP_FILE"
    return 0
  fi
  
  # Ensure volume exists and run a transient container to tar it
  docker run --rm -v crm_minio_data:/data -v "$BACKUP_DIR_MINIO":/backups alpine tar czf "/backups/crm_minio_${TIMESTAMP}.tar.gz" -C / data || { log_error "MinIO Backup failed"; exit 1; }
  chmod 600 "$MINIO_BACKUP_FILE"
  MINIO_BACKUP_CREATED=true
  log_success "MinIO backup created: $MINIO_BACKUP_FILE"
}

run_migration() {
  log "Running Prisma migrations..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would run prisma migrate deploy"
    return 0
  fi
  
  # Run migration on backend container (might need to start it or run a transient one)
  # It is safer to run it against the new code. We'll use a temporary container based on the backend build context.
  if docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy; then
    MIGRATION_APPLIED=true
    log_success "Migration successful."
  else
    log_error "Migration failed."
    rollback
    exit 1
  fi
}

build_and_restart() {
  log "Building/Pulling and Restarting containers..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would build/pull and restart containers"
    return 0
  fi
  
  if [ "$DEPLOY_MODE" = "git_build" ]; then
    docker compose -f "$COMPOSE_FILE" build || { log_error "Build failed"; rollback; exit 1; }
  else
    docker compose -f "$COMPOSE_FILE" pull || { log_error "Image pull failed"; rollback; exit 1; }
  fi
  
  docker compose -f "$COMPOSE_FILE" up -d || { log_error "Restart failed"; rollback; exit 1; }
}

verify_deployment() {
  log "Verifying deployment..."
  if [ "$DRY_RUN" = "YES" ]; then
    echo "[DRY-RUN] Would run scripts/verify-deployment.sh"
    return 0
  fi
  
  sleep 5 # Wait for services to start
  if bash scripts/verify-deployment.sh; then
    log_success "Deployment Verification Passed."
  else
    log_error "Deployment Verification Failed."
    rollback
    exit 1
  fi
}

rollback() {
  log_error "Initiating Rollback..."
  
  ROLLBACK_FAILED=false

  # 1. Revert Git
  if [ "$DEPLOY_MODE" = "git_build" ] && [ -n "$PREVIOUS_HASH" ]; then
    log "Reverting Git to $PREVIOUS_HASH..."
    git reset --hard "$PREVIOUS_HASH" || ROLLBACK_FAILED=true
  fi

  # 2. Restore DB if migration was applied (or just to be safe if DB backup exists)
  if [ "$DB_BACKUP_CREATED" = true ] && [ "$MIGRATION_APPLIED" = true ]; then
    log "Restoring PostgreSQL from $PG_BACKUP_FILE..."
    docker exec -i crm_db_prod pg_restore --clean --if-exists -U postgres -d crm_db < "$PG_BACKUP_FILE" || ROLLBACK_FAILED=true
  fi

  # 3. Restore MinIO if needed (Optional depending on if files were corrupted, but we have it backed up)
  # log "Skipping MinIO restore unless explicitly requested, backup available at $MINIO_BACKUP_FILE"

  # 4. Restart containers with reverted code
  log "Restarting containers with previous state..."
  if [ "$DEPLOY_MODE" = "git_build" ]; then
    docker compose -f "$COMPOSE_FILE" build || ROLLBACK_FAILED=true
  fi
  docker compose -f "$COMPOSE_FILE" up -d || ROLLBACK_FAILED=true
  
  if [ "$ROLLBACK_FAILED" = true ]; then
    log_error "CRITICAL: MANUAL INTERVENTION REQUIRED. Rollback failed."
  else
    log_success "ROLLBACK SUCCESSFUL."
  fi
}

# --- Main Execution ---

if [ "$1" = "--dry-run" ]; then
  DRY_RUN="YES"
  echo ">>> RUNNING IN DRY-RUN MODE <<<"
fi

setup_dirs
acquire_lock
preflight_checks
capture_state
pull_latest
backup_postgres
backup_minio
run_migration
build_and_restart
verify_deployment

DEPLOY_SUCCESS=true
log_success "Deployment completed successfully! Current hash: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
