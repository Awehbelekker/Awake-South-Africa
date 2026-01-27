FROM node:18-alpine

WORKDIR /app

# Install dependencies required for node-gyp and native modules
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the server
RUN npm run build:server

# Expose port
EXPOSE 9000

# Start the server
CMD ["npx", "medusa", "start"]
