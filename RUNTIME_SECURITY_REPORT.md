# Runtime Security Report

## Dockerfile Hardening
- **Non-Root User**: The final container strictly runs as the built-in `node` user (UID 1000). The `USER node` directive ensures the Node.js process does not have root privileges over the internal OS.
- **File Ownership**: All production assets (`dist`, `node_modules`, `prisma`, `start.sh`) are copied using `--chown=node:node`.
- **Healthcheck**: A native Docker `HEALTHCHECK` is defined using a low-privilege `wget` spider request targeting the `/api/v1/system/license-status` endpoint, ensuring orchestration tools can detect deadlocks without external monitoring scripts.

## Compose Orchestration Security (`docker-compose.client.yml`)
- **`read_only: true`**: The container's root filesystem is mounted as read-only. This physically prevents attackers from modifying application files, downloading malware, or altering scripts even if they gain remote code execution (RCE).
- **`tmpfs: - /tmp`**: Provides a temporary in-memory filesystem for ephemeral data required by Node.js or Prisma during runtime, bypassing the `read_only` restriction safely.
- **`cap_drop: - ALL`**: Strips all Linux capabilities (e.g., `CAP_NET_RAW`, `CAP_SYS_ADMIN`), minimizing the container's ability to escalate privileges against the host kernel.
- **`security_opt: - no-new-privileges:true`**: Prevents child processes from gaining higher privileges than their parent, neutralizing setuid/setgid binary escalation attacks.
