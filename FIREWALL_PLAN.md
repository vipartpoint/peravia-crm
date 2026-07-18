# Firewall Plan

## Design Strategy (UFW)
- **Default Policy:** Deny all incoming traffic, Allow all outgoing traffic.
- **Allowed Ports (Ingress):**
  - `TCP 22`: SSH Access (Consider custom port if applicable).
  - `TCP 80`: HTTP (For Let's Encrypt certificate challenges and HTTP-to-HTTPS redirects).
  - `TCP 443`: HTTPS (Application web traffic).
- **Blocked Ports:** All other ports. Database (5432) and Redis (6379) will not be accessible from external networks, restricted purely to internal Docker networks.

## Implementation Status
- UFW is currently INACTIVE.
- Firewall rules have NOT been applied.
