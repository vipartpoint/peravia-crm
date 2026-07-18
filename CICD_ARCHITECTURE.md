# Secure CI/CD Pipeline Architecture

## Overview
The CI/CD pipeline for the Peravia CRM is designed with security, stability, and reproducibility as top priorities. It acts as the gatekeeper, ensuring that code is validated, tested, and scanned for vulnerabilities before it is ever built into a release candidate.

## Core Principles
1. **Separation of Concerns**: The pipeline is distinctly separated into `build`, `test`, and `publish` stages.
2. **Immutable Artifacts**: Container images are strictly tagged with semantic versioning (SemVer) and commit SHAs, never solely relying on mutable `latest` tags.
3. **Shift-Left Security**: Vulnerability and dependency scanning occur prior to image publication.
4. **Restricted Publishing Contexts**: Production container images are never published from ephemeral or feature branches.

## Architectural Components

### 1. Source Control Management (SCM)
- Governed by a strict branching strategy (`main`, `feature/*`, `release/*`).
- Pull requests act as the primary security and code review boundary.

### 2. Continuous Integration (CI)
Triggered on all pull requests and pushes.
- **Validation**: Lints the codebase and runs TypeScript compilation.
- **Testing**: Executes unit tests in a pristine environment.
- **Build Verification**: Ensures that the Docker image *can* build successfully, even if it won't be published.

### 3. Continuous Deployment / Publishing (CD)
Triggered strictly on `main`, `release/*` branches, or tagged releases (e.g., `v1.0.0`).
- **Security Scanning**: Analyzes container layers using Trivy/Docker Scout.
- **Publication**: Pushes verified images to GitHub Container Registry (GHCR).
- **Artifact Generation**: Bundles the `client-deploy/` directory as an immutable release asset.
