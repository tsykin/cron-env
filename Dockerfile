# Multi-stage build for smaller final image
# Stage 1: Install dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Stage 2: Final image with only runtime
FROM oven/bun:1-alpine

WORKDIR /app

# Copy only production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY package.json ./
COPY index.ts ./
COPY src ./src
COPY tsconfig.json ./

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bunuser -u 1001 && \
    chown -R bunuser:nodejs /app

USER bunuser

# Bun runs TypeScript directly, no build step needed
CMD ["bun", "run", "index.ts"]