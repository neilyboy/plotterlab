# Multi-stage build for Plotter Lab
# 1) Builder: install deps and build Vite assets
# 2) Runner: production image with only prod deps + dist served by Express

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ---
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund

# Copy server and built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/presets ./presets

EXPOSE 8080
RUN apk add --no-cache curl \
  && mkdir -p /app/plugins

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'curl -fsS http://localhost:${PORT:-8080}/api/health || exit 1'
CMD ["node", "server.js"]
