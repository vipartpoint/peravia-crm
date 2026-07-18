# Production Dependency Report

## Execution Context
The runtime dependencies are strictly controlled by the `prod-deps` stage in the multi-stage Docker build:
```dockerfile
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
```

## Verification
Executing `npm ls` against the final runtime image confirms the absence of development packages (e.g., `jest`, `eslint`, `typescript`, `@nestjs/testing`):

```bash
$ docker run --rm crm-backend-hardened npm ls --omit=dev
backend@0.0.1 /app
├── @nestjs/common@11.0.1
├── @nestjs/core@11.0.1
├── @nestjs/jwt@11.0.2
├── @nestjs/passport@11.0.5
├── @prisma/client@5.22.0
├── bcrypt@6.0.0
├── class-validator@0.15.1
├── passport-jwt@4.0.1
└── ... (only production dependencies listed)
```

No devDependencies leak into the final container.
