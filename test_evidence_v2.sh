echo "=== 1. find *.ts ==="
docker run --rm crm-backend-hardened:latest find /app -name "*.ts" > ts_output.txt
cat ts_output.txt | grep -v "/app/node_modules/" || true
echo "=== 2. find scripts ==="
docker run --rm crm-backend-hardened:latest find /app/scripts || true
echo "=== 3. find prisma *.ts ==="
docker run --rm crm-backend-hardened:latest find /app/prisma -name "*.ts" || true
echo "=== 4. find *.map ==="
docker run --rm crm-backend-hardened:latest find /app -name "*.map" > map_output.txt
cat map_output.txt | grep -v "/app/node_modules/" || true
echo "=== 5. find .git ==="
docker run --rm crm-backend-hardened:latest find /app -name ".git" || true
echo "=== 6. find .env ==="
docker run --rm crm-backend-hardened:latest find /app -name ".env" || true
