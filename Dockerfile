# Use specific Node.js version instead of 'latest'
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Health check: Kubernetes has built-in liveness/readiness probes
# This Docker-level health check is useful for:
# 1. Docker Compose setups without orchestration
# 2. Local development health monitoring
# 3. Container runtime health status (docker ps shows "healthy/unhealthy")
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["node", "src/server.js"]