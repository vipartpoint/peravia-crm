# GitHub Actions Implementation Report

## Implemented Workflows

1. **`ci.yml`** (Continuous Integration)
   - **Triggers**: Executes strictly on `push` to the `main` branch and `pull_request` to the `main` branch.
   - **Scope**: Acts as a strict validation gate. It runs independently separated jobs for the backend and frontend.
   - **Order of Execution**:
     - `Checkout`
     - `Setup Node & Install Dependencies`
     - `Generate Prisma Client` (Backend only)
     - `Lint`
     - `TypeScript Build`
     - `Unit Tests`
     - `Security Scan (npm audit)`
   - **Publishing**: **NONE**. The CI pipeline guarantees that images are *never* published from feature branches, pull requests, or standard untagged commits to the `main` branch.

2. **`release.yml`** (Release & Deployment)
   - **Triggers**: Executes strictly on pushed version tags matching `v*` (e.g., `v1.0.0`).
   - **Scope**: Runs the full suite of builds, containerization, scanning, publishing, and artifact generation.
   - **Order of Execution**:
     1. `Checkout`, `Install dependencies`, `Lint`, `TypeScript build`, `Unit tests`, `Security scan (npm audit)` inside the `build-and-test` job.
     2. `publish-backend` / `publish-frontend` jobs run in parallel after tests pass.
     3. `Docker build` (Local scope for scanning).
     4. `Docker image verification`: Uses `aquasecurity/trivy-action` to scan the built image for `CRITICAL` or `HIGH` vulnerabilities.
     5. `Publish to GHCR`: Pushes the verified image.
     6. `Generate deployment artifacts`: Zips the `client-deploy/` folder and uploads it as a workflow artifact.

## Security & Authentication
- **`GITHUB_TOKEN`**: The `release.yml` explicitly uses the default `${{ secrets.GITHUB_TOKEN }}` to authenticate via `docker/login-action`. No Personal Access Token is required.
- **Permissions Block**: Declared explicitly at the workflow and job levels:
  ```yaml
  permissions:
    contents: read
    packages: write
  ```

## Tagging Strategy
Images pushed to GHCR are tagged automatically via `docker/metadata-action`:
- `type=semver`: Parses the git tag into a semantic version (e.g., `1.0.0`).
- `type=sha`: Appends the short commit hash.
- `type=raw,value=latest`: Explicitly adds the `latest` tag exclusively during tagged release events.

## Deployment Package Validation
Prior to generating the deployment zip artifact (`client-deploy.zip`), an automated validation script enforces strict boundaries, guaranteeing the package does not contain:
- Source code (`src/`)
- Version control history (`.git/`)
- Live environment secrets (`.env`)
- Database dumps (`*.sql`)
- Development documentation (`*.md`, aside from `README.md`)
- Scripts for testing or demo purposes
