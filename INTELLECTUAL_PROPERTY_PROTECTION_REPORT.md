# Intellectual Property Protection Report

## Risk Matrix Summary

| Threat Vector | Current Risk Level | Mitigation in Place |
| :--- | :--- | :--- |
| **Source Code Leakage** | **LOW** | Strict Multi-stage build isolates `src/`. |
| **Source Map Leakage** | **LOW** | Disabled in compiler; actively purged. |
| **Business Logic Cloning** | **MEDIUM** | Terser variable mangling and comment stripping. |
| **Container Tampering** | **LOW** | `read_only: true`, `cap_drop: ALL`, non-root user. |
| **License Circumvention** | **MEDIUM** | Global NestJS `APP_GUARD`. Relies on JWT integrity. |

## Remaining Attack Surfaces
1. **Raw JavaScript Access**: Node.js inherently requires plaintext JavaScript to execute. A determined actor with root access can copy `dist/` and utilize AI tools to attempt de-obfuscation.
2. **Environment Variable Injection**: The client controls `.env.client`. If they possess the signing secret (they shouldn't), they could forge a license.

## Future Improvement Recommendations (Not Implemented)
To push protection from "Commercial Grade" to "Enterprise/DRM Grade":
1. **V8 Bytecode Compilation (`bytenode`)**: Instead of deploying `.js` files, compile the Javascript directly into V8 engine bytecode (`.jsc`). This completely removes plaintext logic from the container.
2. **Native Binaries (`pkg` or `bun build --compile`)**: Bundle the entire Node runtime and backend code into a single executable ELF binary.
3. **Asymmetric Licensing**: Transition from JWT (symmetric/shared secret) to Ed25519 asymmetric signatures, ensuring the client VPS only holds the public verification key.
