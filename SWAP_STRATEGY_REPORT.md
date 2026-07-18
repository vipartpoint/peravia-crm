# Swap Strategy Report

## Analysis
Swap space is critical in a production environment to prevent the Out-Of-Memory (OOM) killer from prematurely terminating essential services like PostgreSQL, Redis, or the Node.js application during sudden load spikes.

## Recommendation
- **Swap Size:** 4GB
- **Swappiness:** Set `vm.swappiness = 10`. This ensures the kernel prefers to keep data in RAM and only utilizes Swap as a last resort, preserving performance.
- **Location:** `/swapfile` (Root filesystem).
- **Permissions:** 0600 (Root only).

*Note: Swap has NOT been created. This is a design recommendation only.*
