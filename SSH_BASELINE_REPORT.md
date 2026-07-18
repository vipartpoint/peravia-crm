# SSH Baseline Report

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **Service Status:** `sshd` is active (running)
- **Listening Port:** `TCP 22`
- **Configuration:** Default `/etc/ssh/sshd_config`
  - `PasswordAuthentication`: `yes`
  - `PermitRootLogin`: `prohibit-password`
  - `PubkeyAuthentication`: `yes`

## Current State
The server allows password authentication for users and root login via keys. It relies on the default SSH configuration which is not suitable for a zero-trust production environment. Port 22 is exposed without secondary rate limiting (Fail2Ban/UFW).

## Target State
A hardened SSH daemon restricted exclusively to Ed25519/RSA-4096 cryptographic keys. The SSH port will remain `22`. Security will not rely on obscurity, but rather strictly on key-based authentication, `Fail2Ban` rate limiting, `UFW` firewalls, and explicit disabling of root and password login. A verified fallback Recovery Key will be staged for emergency access.

## Implementation Order
1. Verify `roxer` user possesses a valid Ed25519 public key in `~/.ssh/authorized_keys`.
2. Verify secondary Recovery Key is in place for `roxer`.
3. Modify `/etc/ssh/sshd_config` to set `PasswordAuthentication no`.
4. Modify `/etc/ssh/sshd_config` to set `PermitRootLogin no`.
5. Restart `sshd` service.
6. Configure `UFW` to allow TCP 22.
7. Configure `Fail2Ban` SSHD jail.

## Risk Analysis
- **Lockout:** Disabling password authentication before key verification will result in a permanent lockout from the VPS.
- **Brute-Force Attacks:** Relying solely on keys without Fail2Ban still allows resource exhaustion from continuous connection attempts.
- **Recovery Failure:** Without a verified secondary Recovery Key, loss of the primary developer laptop implies total loss of server access.

## Rollback Strategy
- Maintain an active SSH session during the restart of the `sshd` service.
- If the new configuration prevents secondary logins, immediately revert `/etc/ssh/sshd_config` to its previous state using the active session and restart the daemon.
- OOB (Out-Of-Band) Console access via the VPS provider as a last resort.

## Runtime Verification
- Attempt SSH connection using a password; it MUST be rejected immediately.
- Attempt SSH connection as `root`; it MUST be rejected.
- Verify `roxer` can authenticate successfully using the primary Ed25519 key.
- Verify `roxer` can authenticate successfully using the Recovery Key.

## Security Considerations
- **No Security by Obscurity:** Retain port 22. Standardizing ports simplifies UFW rules and audit logging.
- **Key Management:** Private keys must be stored in secure hardware or encrypted password managers.
- **Auditing:** SSH logs in `/var/log/auth.log` must be monitored by Fail2Ban.

## Dependencies
- Pre-generated Ed25519 SSH keypair.
- Pre-generated Recovery SSH keypair.

## Acceptance Criteria
- `PasswordAuthentication` is strictly `no`.
- `PermitRootLogin` is strictly `no`.
- SSH access is verified using multiple keys.
- Server is protected by Fail2Ban and UFW on port 22.
