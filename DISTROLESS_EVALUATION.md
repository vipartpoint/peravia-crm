# Distroless Evaluation

## Evaluation Objective
Determine the viability of replacing `node:20-alpine` with a Distroless image (e.g., `gcr.io/distroless/nodejs20-debian12`) to further reduce the attack surface.

## Technical Analysis (Prisma ORM)
Prisma relies on a compiled Query Engine (a Rust binary) that dynamically links to system C libraries and OpenSSL.
1. **Alpine (`musl libc`)**: Prisma officially supports Alpine via the `linux-musl-openssl-3.0.x` engine.
2. **Distroless (`glibc` or `musl` depending on variant)**: 
   - Distroless images strip out shell environments, package managers, and many standard libraries.
   - While Prisma *can* be made to run on `distroless/nodejs20-debian12`, it often requires manually injecting specific versions of OpenSSL and `zlib` into the final image, significantly complicating the build process and risking severe runtime crashes upon OS/Node version updates.
   - Additionally, Prisma's migration tooling (`prisma migrate deploy`) often utilizes internal shell hooks which fail silently in a purely shell-less Distroless environment.

## Decision
**REJECTED**. The operational risk of breaking the database ORM across client environments outweighs the marginal security benefit of moving from Alpine to Distroless. 

Instead, the `node:20-alpine` image has been heavily constrained via `cap_drop: ALL`, `read_only: true`, and a non-root `node` user. This achieves a near-Distroless security posture without sacrificing Prisma compatibility or migration reliability.
