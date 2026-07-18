# Final Deployment Checklist

Before proceeding with GitHub Authentication and Registry operations, the following mandatory architectural requirements have been verified and integrated into the deployment package:

- [x] **GitHub Authentication Strategy**: CI pipeline will prioritize `GITHUB_TOKEN`. A PAT will only be requested if technically necessary for GHCR access.
- [x] **Docker Image Versioning**: `docker-compose.client.yml` and `.env.client` have been refactored to use explicit semantic version tags (e.g., `v1.0.0`) via the `APP_VERSION` variable.
- [x] **Production Database Safety**: `client-deploy.sh` exclusively uses `npx prisma migrate deploy`. The `prisma db push` command is strictly absent from the deployment lifecycle.
- [x] **Docker Image Integrity**: The deployment script now actively verifies the cryptographic Image Digest (SHA256) post-pull and fails if the digest is missing or invalid.
- [x] **Security Scan Prerequisite**: Pipeline documentation mandates dependency and container vulnerability scanning before image publishing.
- [x] **Gated Deployment Pipeline**: The 8-step deployment workflow (Health -> Backup -> Pull -> Verify Digest -> Migrate -> Restart -> Verify -> Rollback) is fully implemented in `client-deploy.sh`.
- [x] **License Roadmap**: The current JWT implementation remains. A roadmap task has been documented to transition to Asymmetric RSA/Ed25519 signed licenses in future iterations.
- [x] **Scalable Registry Structure**: Image paths have been updated to the structured `ghcr.io/<owner>/peravia/backend` and `ghcr.io/<owner>/peravia/frontend` format.
- [x] **Package Validation**: Verified that the `client-deploy/` folder contains exactly and only the artifacts required for runtime deployment (compose file, env template, nginx config, readme, shell scripts). No source code, git history, or development reports are included.

All mandatory architectural revisions have been completed. The system is ready to request credentials and proceed with publishing.
