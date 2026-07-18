# Secure Deployment Architecture

## Overview
This document outlines the secure commercial deployment architecture for the Peravia CRM. The primary goal is to deploy the solution to a client's Virtual Private Server (VPS) while rigorously protecting the backend source code and intellectual property.

## Deployment Strategy
- **Containerization**: Both the frontend and backend are distributed exclusively as compiled Docker images. No source code or development dependencies are shipped to the client server.
- **Image Registry**: Images will be pushed to a private or public container registry (e.g., GitHub Container Registry - GHCR) under the organization namespace.
- **Client Deployment Package**: A standalone `client-deploy/` folder contains only the `docker-compose.client.yml`, configuration templates, and operational scripts.

## Key Security Measures
1. **Source Protection**: The backend Dockerfile utilizes a multi-stage build, omitting `.git/`, `src/`, and development scripts from the final image.
2. **License Enforcement**: A NestJS-based LicenseManager intercepts requests to ensure the deployment is running with a valid, non-expired license key tied to the client's domain.
3. **Safe Migrations**: Database changes in production are executed explicitly using `npx prisma migrate deploy` instead of `prisma db push`, ensuring schema integrity.
4. **Environment Secrets**: Sensitive keys (JWT, Encryption, Database) are managed strictly through environment variables. The `.env.client.example` file provides placeholders, never actual secrets.
5. **Network Restrictions**: The deployment script recommends strict firewall (UFW) rules, opening only essential ports (80, 443, SSH).

## Final Status
**SECURE COMMERCIAL DEPLOYMENT READY**
