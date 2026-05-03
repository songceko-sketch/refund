# Refund Management Website

A full-stack web application to manage refund requests.

## Features
- **User Dashboard**: Users can view their orders and initiate refund requests.
- **Refund Requests**: Requests must be submitted within 7 days of the order.
- **Admin Portal**: Admin can approve or reject the requests.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide icons.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite
- Authentication: JWT

## How to Run Locally

### 1. Start the Backend
Open a terminal in the root folder (where `server.js` is located) and run:
\`\`\`bash
npm start
# OR simply
node server.js
\`\`\`
The backend server will run on `http://localhost:5000`.

### 2. Start the Frontend
Open another terminal, navigate to the `frontend/` directory, and run:
\`\`\`bash
npm run dev
\`\`\`
The Vite dev server will start (usually on `http://localhost:5173`).

## Test Credentials
The database will automatically be seeded with an admin user, and sample orders will automatically be generated whenever you create a new user account.

**Admin Credentials**
- **Email**: admin@refunds.com
- **Password**: admin123

## Usage Instructions
1. Login as the Administrator using the credentials above to view all pending/approved/rejected refund requests.
2. Register a new mock user from the '/register' page. 
3. You will immediately be logged in and populated with sample orders (some recent, some past 7 days to demonstrate business logic).
4. Initiate a refund request.
5. In another browser or incognito window, log into the admin account to Approve or Reject the new request.

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Start for Deployment:**
```bash
# Using Docker
docker build -t refundflow .
docker run -p 5000:5000 -e EMAIL_USER=your_email -e EMAIL_PASS=your_password refundflow

# Or using docker-compose
docker-compose up -d
```

The application includes:
- ✅ Health check endpoint (`/health`)
- ✅ Dockerized builds
- ✅ Optimized nixpacks configuration
- ✅ Environment variable support
