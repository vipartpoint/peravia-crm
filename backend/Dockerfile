# -------------------------------------
# Builder Stage
# -------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# IP Protection: Source Map Removal
RUN find dist -name "*.map" -type f -delete

# Create clean prisma runtime package
RUN mkdir -p /app/prisma-runtime/migrations && \
    cp prisma/schema.prisma /app/prisma-runtime/ && \
    [ -d prisma/migrations ] && cp -r prisma/migrations/* /app/prisma-runtime/migrations/ || true

# -------------------------------------
# Production Dependencies Stage
# -------------------------------------
FROM node:20-alpine AS prod-deps

RUN apk add --no-cache openssl

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

# -------------------------------------
# Production Runtime Stage
# -------------------------------------
FROM node:20-alpine

RUN apk add --no-cache openssl

# OCI Metadata
LABEL org.opencontainers.image.vendor="Peravia"
LABEL org.opencontainers.image.title="CRM Backend"
LABEL org.opencontainers.image.description="Commercial CRM Backend Services"
LABEL org.opencontainers.image.licenses="UNLICENSED"

WORKDIR /app

# Copy required production files with non-root ownership
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/prisma-runtime ./prisma

# Create start script that bypasses npm prestart hooks to avoid npx prisma downloading hangs
RUN echo -e "#!/bin/sh\n\n# Start app directly\nnode dist/src/main.js" > /app/start.sh && \
    chmod +x /app/start.sh && \
    chown node:node /app/start.sh

# Build Fingerprinting
ARG BUILD_VERSION=unknown
ARG BUILD_TIMESTAMP=unknown
RUN echo "{\"version\":\"$BUILD_VERSION\",\"timestamp\":\"$BUILD_TIMESTAMP\"}" > /app/.build-info.json && \
    chown node:node /app/.build-info.json

# Healthcheck targeting the license
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Runtime Security Settings
ENV NODE_ENV=production
EXPOSE 3000

# Enforce Non-Root Execution
USER node

CMD ["/app/start.sh"]
