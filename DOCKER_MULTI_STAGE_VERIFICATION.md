# Docker Multi-Stage Verification

## Stage Breakdown

1. **Builder Stage**:
   - Copies `package.json` and `prisma/`.
   - Executes `npm ci` (including dev dependencies) and `npx prisma generate`.
   - Copies full source code and executes `npm run build`.
   - Purges source maps using `find dist -name "*.map" -type f -delete`.
   - Prepares clean `/app/prisma-runtime` containing only `schema.prisma` and `migrations`.

2. **Prod-Deps Stage**:
   - Copies `package.json` and `prisma/`.
   - Executes `npm ci --omit=dev` to ensure strict production-only node modules.
   - Executes `npx prisma generate` for runtime dependencies.

3. **Production Runtime Stage**:
   - Base image: `node:20-alpine`.
   - Integrates OCI Metadata labels.
   - Copies `node_modules` from `prod-deps` stage.
   - Copies `dist`, `package.json`, and `prisma-runtime` from `builder` stage.
   - Executes securely as `USER node`.

## Security Conclusion
The multi-stage architecture properly segregates the build environment from the runtime environment, definitively blocking source code leakage into the final commercial image.

**Status**: VERIFIED
