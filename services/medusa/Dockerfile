FROM node:18-alpine

# Force rebuild: 2026-01-29-v2
WORKDIR /app

# Install dependencies required for node-gyp and native modules
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Patch Medusa's compiled PaymentProviderService to avoid Supabase bulk-update issue
RUN node patch-medusa.js

# Build the server
RUN npm run build:server

# Pre-build admin dashboard during Docker build (more memory available)
RUN npx medusa-admin build

# Expose port
EXPOSE 9000

# Health check - increased start period for migrations
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:9000/health || exit 1

# Create startup script that runs migrations, seeds data, then starts server
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Running migrations..."' >> /app/start.sh && \
    echo 'npx medusa migrations run' >> /app/start.sh && \
    echo 'echo "Seeding database..."' >> /app/start.sh && \
    echo 'npx medusa seed -f ./data/seed.json' >> /app/start.sh && \
    echo 'echo "Starting Medusa server..."' >> /app/start.sh && \
    echo 'exec npx medusa start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the server
CMD ["/bin/sh", "/app/start.sh"]
