# Docker Installation Plan

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **Docker Status:** Not installed
- **Docker Socket:** Does not exist
- **Docker Networks:** None
- **Docker Volumes:** None

## Current State
The VPS has no container runtime installed. It is currently a blank Ubuntu 24.04.4 LTS host.

## Target State
A production-grade Docker CE installation sourced directly from the official Docker repository, featuring `Buildx` and `Compose Plugin`. The daemon will utilize the `overlay2` storage driver and enforce strict log rotation (`json-file`, `max-size=50m`, `max-file=3`) and `live-restore`. The Docker socket will be secured, and strict prune policies will be enforced.

## Implementation Order
1. Install prerequisites (`apt-transport-https`, `ca-certificates`, `curl`, `gnupg`).
2. Add official Docker GPG key and APT repository.
3. Install `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin`, `docker-compose-plugin`.
4. Configure `/etc/docker/daemon.json` (overlay2, log rotation, live restore).
5. Start and enable Docker service.
6. Establish baseline Docker network architecture (custom bridge networks, isolating DB from reverse proxy).
7. Establish baseline Docker volume architecture (named volumes for persistent data).
8. Configure `cron` for aggressive docker prune policies (weekly cleanup of dangling images).

## Risk Analysis
- **Storage Exhaustion:** Without daemon-level log rotation, container logs will consume the 96GB disk, causing complete system failure.
- **Socket Exploitation:** Exposing the Docker socket to unprivileged containers allows trivial privilege escalation to root.
- **Network Collision:** Default Docker bridge (`172.17.0.0/16`) may collide with corporate VPN or VPC subnets.

## Rollback Strategy
- Stop the Docker service: `systemctl stop docker`.
- Purge all Docker packages: `apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`.
- Recursively delete `/var/lib/docker` and `/var/lib/containerd`.
- Restore VPS snapshot if deep kernel networking artifacts persist.

## Runtime Verification
- `docker info` must confirm `Storage Driver: overlay2`.
- `docker info` must confirm `Live Restore Enabled: true`.
- Inspecting the daemon configuration must show log limits applied globally.
- Running `docker compose version` returns v2.x architecture.

## Security Considerations
- **Image Signing Strategy:** Implement Docker Content Trust (`DOCKER_CONTENT_TRUST=1`) to enforce pulling only cryptographically signed images.
- **Future Registry Authentication:** Implement short-lived credential helpers or encrypted credential stores for GitHub Container Registry (GHCR) access, avoiding plain text `/root/.docker/config.json`.
- **Docker Socket Security:** Never mount `/var/run/docker.sock` into any application container (e.g., Node.js or Nginx).

## Dependencies
- Outbound internet access to `download.docker.com`.
- Sudo privileges (`roxer`).

## Acceptance Criteria
- Docker daemon is running with all defined security and operational constraints in `daemon.json`.
- Custom network bridges are active and segregating traffic.
- Prune policies are active via cron.
