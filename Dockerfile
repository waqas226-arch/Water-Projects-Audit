# Production Dockerfile for Google Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy package definitions and npm configuration
COPY package*.json .npmrc* ./

# Install dependencies with legacy peer deps protection
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy application source
COPY . .

# Build production bundle
RUN node node_modules/vite/bin/vite.js build && node bundle-standalone.cjs

# Cloud Run injects PORT environment variable (default 8080)
ENV PORT=8080
ENV NO_OPEN=true

EXPOSE 8080

CMD ["node", "node_modules/tsx/dist/cli.mjs", "server.ts"]
