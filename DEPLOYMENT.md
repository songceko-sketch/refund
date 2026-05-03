# Deployment Guide for RefundFlow

## Issues Fixed

### 1. **Frontend Build Output** ✅
- Updated `vite.config.js` to explicitly output to `dist` directory
- Added `emptyOutDir: true` to ensure clean builds

### 2. **Build Process** ✅
- Updated `nixpacks.toml` to:
  - Install root dependencies first (`npm install`)
  - Then install frontend dependencies (`npm install --prefix frontend`)
  - Finally build the frontend (`npm run build --prefix frontend`)

### 3. **Server Startup** ✅
- Improved SPA fallback routing with proper error handling
- Added check for missing `frontend/dist` folder with warning message
- Enhanced logging with better startup information
- Proper error handling on startup failure

### 4. **Health Check** ✅
- Added `/health` endpoint that returns `{status: 'ok', timestamp: ...}`
- Configured health check in `nixpacks.toml` with proper syntax
- Added health check to `Dockerfile` for Docker deployments

## Environment Variables

Set these in your deployment platform:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://your-domain.com
DATA_DIR=/app
```

## Deployment Methods

### Option 1: Using Docker (Recommended)

```bash
# Build image
docker build -t refundflow .

# Run container
docker run -p 5000:5000 \
  -e EMAIL_USER=your_email@gmail.com \
  -e EMAIL_PASS=your_password \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/database.sqlite:/app/database.sqlite \
  refundflow
```

### Option 2: Using docker-compose

```bash
# Create .env file with your variables
cp .env.example .env

# Start services
docker-compose up -d
```

### Option 3: Using nixpacks (for platforms like Railway, Render, etc.)

```bash
# Platform will automatically detect nixpacks.toml
# Just push your code and set environment variables in the platform UI
```

## Verification

### 1. Check Health Endpoint
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"2026-05-03T..."}
```

### 2. Check Frontend is Served
```bash
curl http://localhost:5000/
# Should return HTML, not Apache default page
```

### 3. Check API Endpoints
```bash
curl http://localhost:5000/api/auth/login
# Should return proper API response or 400 error
```

### 4. View Logs
```bash
docker logs -f <container_id>
# Should show: ✅ Server running on http://0.0.0.0:5000
```

## Troubleshooting

### Issue: Still seeing Apache/nginx default page

**Cause:** Reverse proxy is not routing to your Node container

**Solutions:**
1. Ensure the Node server port is exposed correctly
2. Check that the reverse proxy (Traefik/Caddy) is configured to route traffic to the container
3. Verify the container is actually running: `docker ps`
4. Check logs for startup errors: `docker logs <container_id>`

### Issue: "frontend/dist not found" warning

**Cause:** Frontend build didn't complete successfully

**Solutions:**
1. Check build logs for npm errors
2. Ensure Node and npm are installed in build environment
3. Verify all dependencies are compatible
4. Run locally: `npm run build` from the frontend directory

### Issue: /health endpoint returns 404

**Cause:** Server didn't start or route isn't registered

**Solutions:**
1. Check server startup logs
2. Verify the health check route is present in server.js
3. Ensure PORT environment variable is set correctly

## File Changes Summary

- ✅ `frontend/vite.config.js` - Added explicit build output config
- ✅ `nixpacks.toml` - Fixed build commands and health check syntax
- ✅ `server.js` - Improved SPA routing, error handling, and logging
- ✅ `Dockerfile` - Added for Docker deployments
- ✅ `docker-compose.yml` - Added for local Docker testing
