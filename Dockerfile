# Dockerfile for the Taskly web application
FROM node:18-alpine

# Install curl so the container has a working health-check tool
RUN apk add --no-cache curl

WORKDIR /app

# Copy package manifest first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD curl -fs http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
