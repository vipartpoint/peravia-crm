# Production Security Roadmap

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **Security Status:** No firewalls (UFW inactive), default SSH, no Fail2Ban, no kernel hardening applied.

## Current State
The server represents a baseline vanilla Ubuntu 24.04.4 LTS installation without specialized security controls, rendering it highly vulnerable to automated network scanning, brute-force attacks, and container escapes.

## Target State
A zero-trust, heavily armored production host. The roadmap will enforce defense-in-depth across the OS, Network, Container, and Application layers, strictly tailored for a commercial dedicated CRM VPS.

## Implementation Order
1. **SSH Hardening:** Enforce key-only auth, disable root/password login, implement Fail2Ban.
2. **Network Hardening:** Enable UFW, restrict ingress to TCP 80, 443, 22.
3. **Kernel Hardening:** Apply strict `sysctl` rules (enable SYN cookies, disable IPv6 if unused, restrict `dmesg`, protect against IP spoofing).
4. **Docker Hardening:** Secure `daemon.json`, restrict socket access, configure user namespaces.
5. **Secrets Management:** Centralize `.env` files into a protected vault or strict file permissions (`0600` owned by `roxer`).
6. **Container Security:** Enforce read-only root filesystems, drop capabilities, run as non-root.
7. **Audit Logging & Monitoring:** Configure `auditd` to track access to `/etc/shadow` and `/opt/peravia/licenses`. Implement metric collection.
8. **Automatic Security Updates:** Enable and configure `unattended-upgrades` for critical CVEs.
9. **Image Verification:** Implement Docker Content Trust.
10. **Application & Backup Encryption:** Ensure TLS termination via Nginx, DB encryption at rest, AES-256 for all backups.
11. **License Protection:** Monitor file integrity of the commercial license modules.
12. **Incident Response & Disaster Recovery:** Finalize playbooks for compromise and regional outages.

## Risk Analysis
- **Availability Loss:** Aggressive kernel hardening or UFW misconfiguration can block legitimate CRM traffic or sever administrative SSH access.
- **Operational Friction:** Highly restrictive container security (e.g., read-only filesystems) may break legacy Node.js dependencies writing to disk.

## Rollback Strategy
- Maintain a verified pre-hardening VPS Snapshot.
- Apply security controls incrementally (e.g., UFW first, then sysctl, then Docker) with verification at each step to isolate failures.

## Runtime Verification
- Execute `sysctl -a` to verify kernel parameters match the hardened baseline.
- Execute `ufw status numbered` to verify exact port exposure.
- Execute `fail2ban-client status sshd` to verify brute-force protection is active.

## Security Considerations
- **No Kubernetes Assumptions:** Security is localized to this dedicated VPS and Docker Compose. No ephemeral node assumptions apply.
- **Commercial Licensing:** The `/opt/peravia/licenses` directory requires file integrity monitoring (e.g., via `AIDE`) to detect tampering.

## Dependencies
- Pre-existing VPS snapshot.
- Dedicated maintenance window for implementing Phase 2 and 3 configurations.

## Acceptance Criteria
- All 12 implementation phases are fully executed and validated via third-party audit tools (e.g., `lynis`).
- Server receives an A+ security posture rating internally.
