#!/bin/bash

echo "Running Health Checks..."

# Check Backend
echo -n "Backend API Health: "
curl -sSf http://localhost:3000/api/v1/health > /dev/null
if [ $? -eq 0 ]; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

# Check Frontend
echo -n "Frontend Health: "
curl -sSf http://localhost:3002 > /dev/null
if [ $? -eq 0 ]; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

# Check Database
echo -n "Database Connection: "
docker exec crm_db_client pg_isready -U postgres > /dev/null
if [ $? -eq 0 ]; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

# Check Redis
echo -n "Redis Connection: "
docker exec crm_redis_client redis-cli ping > /dev/null
if [ $? -eq 0 ]; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

echo "All health checks passed!"
