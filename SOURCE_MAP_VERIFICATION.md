# Source Map Verification

## Execution Context
Source maps (`*.map`) map compiled JavaScript directly back to the original TypeScript source code. They are highly detrimental to commercial IP protection if leaked.

## Hardening Steps
1. **Compilation Level**: Modified `backend/tsconfig.json` to statically prevent generation:
   ```json
   "sourceMap": false,
   "declaration": false
   ```
2. **Purge Level**: Added a physical purge step in the `builder` stage of the Dockerfile as a failsafe:
   ```dockerfile
   RUN find dist -name "*.map" -type f -delete
   ```

## Verification
```bash
$ docker run --rm crm-backend-hardened find /app -name "*.map"
# (No output. Source maps are definitively absent.)
```
