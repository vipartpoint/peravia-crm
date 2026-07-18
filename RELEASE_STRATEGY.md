# Release Strategy

## Release Trigger Workflow
Releases are explicitly triggered operations. A release is generated when a semantic version tag (e.g., `v1.2.0`) is pushed to the repository, typically from `main` or a `release/*` branch.

## Artifact Generation
Upon a version tag push, the CD pipeline engages:
1. **Docker Images**: Builds, scans, and pushes the images to GHCR tagged with the exact version (`ghcr.io/owner/peravia/backend:v1.2.0`).
2. **Commit SHA Tags**: Simultaneously tags the image with the git commit SHA (`sha-a1b2c3d`) for absolute cryptographic traceability.
3. **Deployment Package**: The `client-deploy/` folder is zipped into an artifact (e.g., `peravia-crm-deploy-v1.2.0.zip`) and attached to the GitHub Release page.

## Semantic Versioning Rules
- **MAJOR (`vX.0.0`)**: Breaking architectural changes, mandatory database schema overhauls requiring downtime, or major UI redesigns.
- **MINOR (`v1.Y.0`)**: New backward-compatible features, API additions, or significant performance improvements.
- **PATCH (`v1.2.Z`)**: Backward-compatible bug fixes, security patches, or minor configuration tweaks.

## Client Communication
Clients are provided the deployment package ZIP. They extract it, update the `APP_VERSION` variable in `.env.client`, and run the deployment script to upgrade securely.
