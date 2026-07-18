#!/bin/bash
# PRISMA MIGRATE DEPLOY ROLLBACK STRATEGY

echo "======================================================="
echo "🚨 PRISMA PRODUCTION ROLLBACK SCRIPT"
echo "======================================================="

# Ensure we are in the backend directory
cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
  echo "❌ Error: Missing migration name to rollback."
  echo "Usage: ./scripts/rollback.sh <migration_name>"
  echo "Example: ./scripts/rollback.sh 20260610182722_add_backend_stabilization_indexes"
  exit 1
fi

MIGRATION_NAME=$1

echo "⚠️  You are about to rollback migration: $MIGRATION_NAME"
echo "⚠️  Prisma migrations are forward-only. This script will mark the migration as rolled back in the Prisma metadata table."
echo "⚠️  It will NOT automatically revert the database structure (e.g. drop columns added by the migration)."
echo "⚠️  You MUST restore the database from the pre-deployment backup, OR apply a forward-fix migration."
echo ""
read -p "Are you sure you want to mark this migration as rolled back? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🔄 Marking migration $MIGRATION_NAME as rolled back..."
    npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"
    
    if [ $? -eq 0 ]; then
      echo "✅ Successfully marked migration as rolled back."
      echo "Next Steps:"
      echo "1. Run the database restore script: ./scripts/restore-db.sh <backup_file>"
      echo "2. Revert the codebase to the previous stable commit."
      echo "3. Restart the application: docker-compose restart backend"
    else
      echo "❌ Failed to mark migration as rolled back. Please check the logs."
    fi
else
    echo "Rollback cancelled."
    exit 0
fi
