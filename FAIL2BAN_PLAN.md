# Fail2Ban Strategy

## Design Strategy
- **Purpose:** Protect SSH and web application endpoints from brute-force authentication attacks.
- **Jails Designed:**
  - `sshd`: Ban IPs after 3 failed login attempts. Ban time: 1 hour initially, utilizing an incremental ban strategy for repeat offenders.
- **Configuration:** Custom local jail configuration will be created (`/etc/fail2ban/jail.local`) to override defaults without modifying package-managed files.

## Implementation Status
- Fail2Ban is currently NOT installed.
