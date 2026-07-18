# Server Baseline Report

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **Mounted Filesystems:** `/dev/sda1` mounted on `/` (ext4)
- **Active Services:** `sshd`, `systemd-journald`, `cron`, `systemd-timesyncd`
- **Listening Ports:** `TCP 22`
- **Installed Packages:** Minimal Ubuntu 24.04 base packages
- **SSH Configuration:** Default `/etc/ssh/sshd_config`
- **Swap Status:** 0B (No swap configured)

## Current State
The server is running a fresh installation of Ubuntu 24.04.4 LTS. It possesses significant compute resources (8 vCPU, 16GB RAM) suitable for a dedicated commercial CRM production environment. It lacks baseline hardening, swap memory, and required directory structures. Default configurations expose it to potential brute-force attacks via SSH.

## Target State
A fully hardened, production-ready VPS infrastructure optimized for Docker-based commercial workloads. This includes configured swap space (4GB minimum) to prevent OOM termination of critical PostgreSQL/Node.js processes, a secured network perimeter, and all unnecessary services disabled.

## Implementation Order
1. Execute preliminary baseline audit (capture existing state).
2. Configure 4GB swap space and set `vm.swappiness=10`.
3. Update package index and apply critical OS updates.
4. Establish `/opt/peravia` directory structure.
5. Create baseline snapshots before proceeding to security hardening.

## Risk Analysis
- **Resource Exhaustion:** Without swap, memory spikes can trigger OOM killer.
- **Service Vulnerability:** Default OS installations often contain unnecessary services that expand the attack surface.
- **Configuration Drift:** Manual changes to the baseline without tracking can lead to inconsistent deployments and security vulnerabilities.

## Rollback Strategy
- **Infrastructure Snapshot:** Prior to executing any configurations, a complete VPS-level snapshot must be taken.
- **Immediate Reversion:** If kernel updates or swap configurations induce instability, the snapshot will be restored immediately to return to the baseline state.

## Runtime Verification
- `uname -r` must return `6.8.0-111-generic` or higher.
- `free -m` must display 16GB RAM and exactly 4GB Swap.
- `df -h` must display 96GB total disk space on `/`.
- `ss -tulpn` must show only authorized ports (currently 22).

## Security Considerations
- **Immutable Infrastructure:** Treat the server OS as a pristine host for containers. Do not store state directly on the root filesystem outside of designated `/opt/peravia` mount points.
- **Minimalism:** Do not install compilers (`gcc`), debuggers, or unnecessary network tools (`nmap`, `nc`) on the production server.

## Dependencies
- VPS provider snapshot capability.
- Root or sudo (`roxer`) access to the server.

## Acceptance Criteria
- Server matches all Target State requirements.
- Swap is actively mounted and persistent across reboots in `/etc/fstab`.
- No unauthorized services are listening on public interfaces.
