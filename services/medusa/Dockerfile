FROM node:18-alpine

WORKDIR /app

# Install dependencies required for node-gyp and native modules
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the server (not full build to avoid admin rebuild)
RUN npm run build:server

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start the server
CMD ["npx", "medusa", "start"]
