# Stage: Development
FROM node:25-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Development command with hot reload
CMD ["npx", "tsx", "watch", "src/server.ts"]
