# Multi-stage Dockerfile for building and running the NestJS + Prisma app (suitable for Railway)
# Builder stage: install dev deps, generate prisma client, build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci --silent

# Copy source files
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build (this will run `prisma generate` as defined in package.json build script)
RUN npm run build --silent

# Runtime stage: copy only what is needed to run the app
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package files for metadata (not strictly required but helpful)
COPY package*.json ./

# Copy production-ready artifacts from builder
# Include node_modules to preserve generated Prisma client and installed production deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port (the app reads PORT env var; Railway sets PORT automatically)
EXPOSE 3000

# Use entrypoint to run migrations then start the compiled Nest application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
