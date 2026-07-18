# GHCR Deployment Plan

## 1. Authentication Strategy
- **Primary Mechanism**: The GitHub Actions pipeline will utilize the built-in `GITHUB_TOKEN` to authenticate and publish images to the GitHub Container Registry (`ghcr.io`).
- **Fallback Mechanism**: A Personal Access Token (`CR_PAT`) will ONLY be requested and utilized if the default `GITHUB_TOKEN` lacks sufficient permissions (e.g., across certain organizational boundaries where `packages: write` cannot be implicitly granted).

## 2. Registry Structure
To ensure future scalability and support for additional microservices (e.g., API Gateway, Worker Services, Reporting Engine), we are adopting a nested registry namespace architecture.

### Target Images:
- **Backend:** `ghcr.io/<owner>/peravia/backend:<version>`
- **Frontend:** `ghcr.io/<owner>/peravia/frontend:<version>`

This avoids flat naming conventions (like `peravia-crm-backend`) and groups all related services logically under the `/peravia/` path.
