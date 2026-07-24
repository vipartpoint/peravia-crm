#!/usr/bin/env bash
set -e

echo "====================================="
echo "  Deploying CRM Production Stack     "
echo "====================================="

# 1. Pre-flight checks
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env is missing. Please create it using production credentials."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Error: frontend/.env is missing. Please create it using production credentials."
    exit 1
fi

if [ ! -d ".secrets" ]; then
    echo "❌ Error: .secrets directory is missing."
    exit 1
fi

if [ ! -f ".secrets/jwt_secret.txt" ] || [ ! -f ".secrets/encryption_key.txt" ]; then
    echo "❌ Error: Secret files missing in .secrets/"
    exit 1
fi

# 2. Build images
echo "🔨 Building Docker images..."
docker compose -f docker-compose.production.yml build

# 3. Start DB, Redis, MinIO first
echo "🚀 Starting infrastructure containers (db, redis, minio)..."
docker compose -f docker-compose.production.yml up -d db redis minio

# 4. Wait for dependencies
echo "⏳ Waiting for PostgreSQL to be ready..."
# We can use docker inspect or pg_isready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f docker-compose.production.yml exec db pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Error: PostgreSQL failed to become ready."
    docker compose -f docker-compose.production.yml logs db
    exit 1
fi

echo "⏳ Waiting for Redis..."
# Redis should be ready quickly, just give it a sec
sleep 2

# 5. Run Prisma migrations
echo "🔄 Running Prisma migrations..."
if ! docker compose -f docker-compose.production.yml run --rm backend sh -c "npx --yes prisma migrate deploy"; then
    echo "❌ Error: Prisma migration failed."
    exit 1
fi

# 6. Start the rest of the stack
echo "🚀 Starting backend and frontend..."
docker compose -f docker-compose.production.yml up -d backend frontend

# 7. Wait for backend health
echo "⏳ Waiting for backend health check..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/v1/health | grep -q '"status":"ok"'; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Error: Backend failed to become healthy."
    docker compose -f docker-compose.production.yml logs backend
    exit 1
fi

# 8. Print final container status
echo "====================================="
echo "✅ Deployment successful! Container status:"
docker compose -f docker-compose.production.yml ps
echo "====================================="
