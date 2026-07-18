# Docker Image Delivery Report

## Overview
To facilitate secure and seamless updates to the client's VPS, the application relies on Docker Image distribution via a Container Registry.

## Implementation
- **Registry Integration**: Both the `backend` and `frontend` services in `docker-compose.client.yml` are configured to pull images from a central registry (e.g., GHCR).
- **Format**: `ghcr.io/[owner]/peravia-crm-backend:[version]`
- **Avoidance of Local Builds**: The client's compose file strictly uses `image:` declarations. It completely removes the `build:` context, physically preventing the client from modifying the build process or accessing raw source files locally.

## Update Workflow
1. Development team tags and pushes a new Docker image to the registry.
2. The client or deployment manager runs `client-deploy.sh` on the VPS.
3. Docker Compose pulls the latest image layers.
4. Services are seamlessly restarted with the new compiled codebase.
