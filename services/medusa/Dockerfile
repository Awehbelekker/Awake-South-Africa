FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies required for node-gyp
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 9000

# Start the server
CMD ["npm", "run", "start"]
