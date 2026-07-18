# GitHub Actions Pipeline Design

## Workflow Files
The pipeline will be driven by two primary workflow files:
1. `.github/workflows/ci.yml`: Executes on all Pull Requests and pushes to non-release branches. (Lint, Build, Test).
2. `.github/workflows/release.yml`: Executes on pushes to `main`, `release/*`, and version tags. (Lint, Build, Test, Scan, Publish, Artifacts).

## Pipeline Execution Order (Release Workflow)

### Stage 1: Continuous Integration
1. **Checkout**: `actions/checkout` fetches the repository.
2. **Install Dependencies**: `npm ci` is run in a cached Node environment.
3. **Lint**: `npm run lint` ensures code quality and stylistic integrity.
4. **TypeScript Build**: `npm run build` verifies the application compiles successfully without type errors.
5. **Unit Tests**: `npm run test` validates business logic.

### Stage 2: Security & Packaging
6. **Docker Build**: The image is built locally within the GitHub Actions runner but is NOT pushed yet.
7. **Security Scan**: A vulnerability scanner (e.g., Aquasec Trivy) scans the local image. The workflow aborts if critical vulnerabilities are found.
8. **Docker Image Verification**: Verifies the image layers are intact and structural integrity is maintained.

### Stage 3: Publishing (Restricted)
9. **Publish to GHCR**: 
   - Authenticats to GHCR.
   - Pushes the image.
   - Tags applied: `vX.Y.Z` (Semantic Version), `sha-XXXXXXX` (Commit Hash), and optionally `latest`.
10. **Generate Deployment Artifacts**: Zips the `client-deploy/` directory and attaches it to the GitHub Release.

## Execution Constraints
- **Pull Requests**: Execute Stages 1 & 2 (Build only, no push).
- **Feature Branches**: Execute Stage 1.
- **Releases/Tags**: Execute Stages 1, 2, & 3.
