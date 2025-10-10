# syntax=docker/dockerfile:1.7

# Base image
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init

# Install production dependencies separately for caching
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi

# Build stage with dev dependencies
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Runtime image
FROM base AS runner
WORKDIR /app
# Copy prod deps and built dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json
# Use the existing non-root 'node' user
USER node
EXPOSE 8000
CMD ["dumb-init","node","dist/src/main.js"]
