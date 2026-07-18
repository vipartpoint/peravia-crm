# Disaster Recovery Plan

## Current Runtime Evidence
- **OS Version:** Ubuntu 24.04.4 LTS
- **Kernel:** 6.8.0-111-generic
- **Compute:** 8 vCPU
- **Memory:** 16GB RAM
- **Storage:** 96GB Disk
- **Users:** `root`, `roxer`
- **DR Status:** No recovery mechanisms, offsite backups, or isolation protocols exist.

## Current State
The infrastructure is a single point of failure. A compromise, data corruption event, or hardware failure on this specific Ubuntu 24.04.4 VPS will result in total, irrecoverable loss of the CRM platform and customer data.

## Target State
A robust, documented, and practiced Disaster Recovery (DR) and Incident Response (IR) protocol ensuring Rapid Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO), while preserving forensic evidence during security incidents.

## Implementation Order
1. Define and automate the VPS provisioning process for a replacement server.
2. Document the Snapshot restoration workflow for OS-level corruption.
3. Document the Backup Restore workflow for PostgreSQL and Docker Volumes.
4. Document the Secrets and Encryption Key Restore workflow.
5. Document the License Restore workflow to reactivate the commercial CRM.
6. Document DNS Recovery (Cloudflare cutover).
7. Establish Forensic Isolation protocols.

## Risk Analysis
- **Forensic Destruction:** Immediately destroying a compromised VPS destroys critical IOCs (Indicators of Compromise) required to patch the vulnerability.
- **Incomplete Recovery:** Failing to restore License files or Encryption keys renders the restored database completely unusable.

## Rollback Strategy
- **Rollback Validation:** During DR drills, the restored environment must be validated rigorously. If the restored environment fails Acceptance Criteria, the drill is rolled back, and the DR playbook is revised.

## Runtime Verification
- **Recovery Verification (Bi-Annual Drill):**
  1. Provision a clean staging VPS.
  2. Execute baseline and Docker installation scripts.
  3. Pull offsite AES-256 backups and decrypt them.
  4. Restore PostgreSQL, MinIO, and configuration files.
  5. Start Docker Compose.
  6. Verify CRM UI login and data integrity.

## Security Considerations
- **Forensic Isolation:** DO NOT destroy the VPS immediately after compromise. The compromised server must be isolated from the internet (via cloud provider security groups) and preserved for forensic investigation. A new VPS must be spun up in parallel for the recovery effort.
- **Key Rotation:** Upon recovering from a compromise, ALL encryption keys, JWT secrets, and database passwords MUST be rotated immediately on the new server.

## Dependencies
- Functional Backup Architecture with offsite immutable storage.
- DNS provider API access (e.g., Cloudflare) for rapid A-record cutover.

## Acceptance Criteria
- A complete dry-run recovery from offsite backups to a fully functional CRM instance succeeds within the 4-hour RTO.
- The forensic isolation procedure is documented and approved by the security team.
