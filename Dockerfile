# ===============================
# 🚧 Builder stage
# ===============================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package metadata trước để tối ưu cache
COPY package*.json ./
RUN npm ci --silent

# Copy Prisma và source code
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Build (chỉ build TypeScript; tránh chạy prisma generate tại build-time vì có thể thiếu DATABASE_URL)
RUN npx nest build --silent

# ===============================
# 🚀 Runner stage
# ===============================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy metadata
COPY package*.json ./

# Copy artifacts từ builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port (Railway sẽ tự inject PORT env var)
EXPOSE 3000

# Run migrations rồi khởi động app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
