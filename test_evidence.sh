echo "=== 1. docker image inspect ==="
docker image inspect crm-backend-hardened:latest | jq '.[0].Config'
echo "=== 2. docker history ==="
docker history crm-backend-hardened:latest
echo "=== 3. find *.ts ==="
docker run --rm crm-backend-hardened:latest find /app -name "*.ts"
echo "=== 4. find *.map ==="
docker run --rm crm-backend-hardened:latest find /app -name "*.map"
echo "=== 5. find .git ==="
docker run --rm crm-backend-hardened:latest find /app -name ".git"
echo "=== 6. find .env ==="
docker run --rm crm-backend-hardened:latest find /app -name ".env"
echo "=== 7. find src ==="
docker run --rm crm-backend-hardened:latest find /app -name "src"
echo "=== 8. npm ls --omit=dev ==="
docker run --rm crm-backend-hardened:latest npm ls --omit=dev
echo "=== 9. id ==="
docker run --rm crm-backend-hardened:latest id
echo "=== 10. cat .build-info.json ==="
docker run --rm crm-backend-hardened:latest cat /app/.build-info.json
