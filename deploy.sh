#!/bin/bash

echo "🚀 Starting Deployment to Production Server..."
echo "================================================="

echo "📦 1. Syncing Frontend Source Code..."
rsync -avz --delete --exclude 'node_modules' --exclude '.next' --exclude 'dist' -e "ssh -i ~/.ssh/crm_production_ed25519 -o ServerAliveInterval=60" frontend/src/ roxer@185.190.39.248:"/home/roxer/CRM\ project/frontend/src/"
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" frontend/package*.json roxer@185.190.39.248:"/home/roxer/CRM\ project/frontend/"
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" frontend/next.config.ts roxer@185.190.39.248:"/home/roxer/CRM\ project/frontend/"
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" frontend/tailwind.config.ts roxer@185.190.39.248:"/home/roxer/CRM\ project/frontend/"

echo "📦 2. Syncing Backend Source Code..."
rsync -avz --delete --exclude 'node_modules' --exclude 'dist' -e "ssh -i ~/.ssh/crm_production_ed25519 -o ServerAliveInterval=60" backend/src/ roxer@185.190.39.248:"/home/roxer/CRM\ project/backend/src/"
rsync -avz --delete -e "ssh -i ~/.ssh/crm_production_ed25519" backend/prisma/ roxer@185.190.39.248:"/home/roxer/CRM\ project/backend/prisma/"
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" backend/package*.json roxer@185.190.39.248:"/home/roxer/CRM\ project/backend/"
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" backend/*.ts roxer@185.190.39.248:"/home/roxer/CRM\ project/backend/"

echo "📦 3. Syncing Configs..."
rsync -avz -e "ssh -i ~/.ssh/crm_production_ed25519" docker-compose.production.yml roxer@185.190.39.248:"/home/roxer/CRM\ project/"

echo "⚙️  4. Building and Restarting Docker Containers on Server..."
ssh -i ~/.ssh/crm_production_ed25519 -o ServerAliveInterval=60 roxer@185.190.39.248 "cd '/home/roxer/CRM project' && docker compose -f docker-compose.production.yml up -d --build"

echo "================================================="
echo "✅ Deployment Successfully Finished!"
