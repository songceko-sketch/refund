FROM node:20-alpine

WORKDIR /app

# Create data directories with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install && npm install --prefix frontend

# Copy source code
COPY server.js .
COPY frontend/src ./frontend/src
COPY frontend/index.html ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/vite.config.js ./frontend/
COPY frontend/public ./frontend/public

# Build frontend
RUN npm run build --prefix frontend

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
