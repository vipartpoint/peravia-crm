#!/bin/bash
# verify-deployment.sh - Runs a suite of health and readiness checks

echo "Starting Deployment Readiness Verification..."

API_URL="http://localhost:3000/api/v1"

echo "1. Checking Core Health Endpoint..."
HEALTH_JSON=$(curl -s $API_URL/health)
if echo "$HEALTH_JSON" | grep -q '"postgres":{"status":"up"}'; then
  echo "[PASS] PostgreSQL is reachable."
else
  echo "[FAIL] PostgreSQL connection failed."
fi

if echo "$HEALTH_JSON" | grep -q '"redis":{"status":"up"}'; then
  echo "[PASS] Redis is reachable."
else
  echo "[FAIL] Redis connection failed."
fi

if echo "$HEALTH_JSON" | grep -q '"minio":{"status":"up"}'; then
  echo "[PASS] MinIO is reachable."
else
  echo "[FAIL] MinIO connection failed."
fi

echo "2. Checking Auth Subsystem..."
AUTH_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"username":"system_check","password":"_"}' || true)
if [ "$AUTH_HTTP_CODE" -eq 401 ] || [ "$AUTH_HTTP_CODE" -eq 400 ]; then
  echo "[PASS] Auth subsystem active (caught bad credentials)."
else
  echo "[FAIL] Auth subsystem unresponsive (HTTP $AUTH_HTTP_CODE)."
fi

echo "3. Checking Portal Subsystem..."
PORTAL_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/portal/order-tracking/verify -H "Content-Type: application/json" -d '{"orderNumber":"1","mobile":"1"}' || true)
if [ "$PORTAL_HTTP_CODE" -eq 400 ] || [ "$PORTAL_HTTP_CODE" -eq 401 ]; then
  echo "[PASS] Portal subsystem active."
else
  echo "[FAIL] Portal subsystem unresponsive (HTTP $PORTAL_HTTP_CODE)."
fi

echo "Readiness Verification Completed."
