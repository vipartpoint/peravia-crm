# Docker Image Security Report

## 1. Vulnerability Scanning Pre-Requisite
Before any Docker image is tagged and published to GHCR, it must pass rigorous security scanning within the CI/CD pipeline:
- **Dependency Scanning**: `npm audit` or equivalent tooling must run to verify that no critical vulnerabilities exist within the Node.js dependencies.
- **Container Scanning**: A dedicated vulnerability scanner (e.g., Trivy or Docker Scout) will analyze the built container image layers.
- **Enforcement**: If any *CRITICAL* vulnerabilities are detected, the pipeline will fail, and the image will *not* be published to the registry.

## 2. Image Digest Integrity
During the client-side deployment, simply pulling a tag is insufficient for strict integrity. 
The updated `client-deploy.sh` script now implements a cryptographic digest verification step. After `docker pull`, the script executes `docker inspect --format='{{index .RepoDigests 0}}'` to verify that a valid SHA256 digest exists and matches the pulled manifest, ensuring the image layers have not been tampered with in transit.
