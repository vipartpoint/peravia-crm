# Backend Source Protection Report

## Goal
Protect the CRM's proprietary backend source code from being exposed or accessed on the client's VPS.

## Implementation Details
1. **Multi-stage Docker Build (`backend/Dockerfile`)**:
   - **Stage 1 (Builder)**: Installs all dependencies (including devDependencies), generates the Prisma client, and compiles the TypeScript code into the `dist/` directory.
   - **Stage 2 (Prod-Deps)**: Installs *only* production dependencies (`npm ci --omit=dev`) to avoid shipping testing or development tools.
   - **Stage 3 (Runner)**: Copies only the compiled `dist/` code, the production `node_modules`, `package.json`, and the `prisma/` directory (for migrations) into a fresh Alpine-based Node image.
2. **Strict Exclusions (`backend/.dockerignore`)**:
   - Explicitly ignores `src/`, `test/`, `.git/`, `.env`, and `*.md` files.
   - Prevents any accidental inclusion of source code or local secrets into the Docker context.

## Result
The final backend Docker image contains only minified, compiled JavaScript, Prisma schema files, and essential production libraries. The original TypeScript source code remains securely isolated on the development machine.
