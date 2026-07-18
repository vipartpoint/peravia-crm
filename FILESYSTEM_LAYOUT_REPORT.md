# Filesystem Layout Report

## Verification
- Default installation validated. Standard single `/` root partition layout structure is assumed for the baseline VPS.

## Recommended Final Production Directories
The following directories are required for the production runtime of the CRM application:

- `/opt/peravia`: Base directory for application and infrastructure.
- `/opt/peravia/docker`: Docker Compose files, container configurations, and environment variables.
- `/opt/peravia/backups`: Local staging area for automated backups before offsite transfer.
- `/opt/peravia/logs`: Centralized application and container logs.
- `/opt/peravia/licenses`: Secure storage for runtime license keys.
- `/opt/peravia/runtime`: Ephemeral runtime data and state configurations.

*Note: Directories will be created during the provisioning phase. Do NOT create them yet.*
