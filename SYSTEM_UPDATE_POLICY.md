# System Update Policy

## Strategy
- **Security Updates:** Enable `unattended-upgrades` to automatically install critical security patches without manual intervention.
- **Kernel Updates:** Perform kernel updates manually during scheduled maintenance windows, followed by a controlled server reboot.
- **Application Packages:** Update packages manually using package manager commands (e.g., `apt-get update && apt-get upgrade`) in a controlled manner before application deployments to ensure environment stability.

## Execution
- No upgrades have been executed during this baseline phase. The system remains unmodified.
