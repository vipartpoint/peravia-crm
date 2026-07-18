# Reverse Engineering Assessment

## Threat Model
**Scenario**: The client possesses full `root` SSH access to their VPS. They can execute `docker exec -u 0 -it crm_backend_client sh` (bypassing the `USER node` restriction via Docker daemon access).

## Attack Vectors & Analysis

1. **Source Code Recovery**
   - **Risk**: Can the client recover the raw `.ts` files?
   - **Result**: **IMPOSSIBLE**. The Docker multi-stage build physically drops the `src/` directory. `find /app -name "*.ts"` returns nothing.
   
2. **De-compilation via Source Maps**
   - **Risk**: Can the client reconstruct the source using Webpack/TSC `.map` files?
   - **Result**: **IMPOSSIBLE**. Source maps were disabled in `tsconfig.json` and actively deleted via `find -name "*.map" -delete`.

3. **Business Logic Theft (JavaScript Extraction)**
   - **Risk**: Can the client read the compiled JavaScript in `dist/`?
   - **Result**: **HARDENED**. The client *can* copy the `.js` files out of the container. However, because we applied `terser -m`, local variables and structural logic have been mangled. While not impossible to reverse engineer (as it remains executable JavaScript), the effort required to make sense of the mangled, comment-free code is significantly higher than reading standard TSC output.

4. **Rebuilding without Original Repository**
   - **Risk**: Can the client alter the code and rebuild the image?
   - **Result**: **HIGHLY DIFFICULT**. Without the TypeScript source, the `.git` repository, and the build tools, any modification must be done by hand-editing mangled JavaScript files and mounting them over the read-only filesystem via Docker volumes.

## Conclusion
The current architecture provides a robust deterrent against casual theft, IP cloning, and unauthorized redistribution. While dedicated state-sponsored reverse engineering can eventually de-obfuscate JavaScript, the commercial threshold for IP protection has been successfully met.
