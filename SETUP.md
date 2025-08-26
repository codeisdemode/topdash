# Server Monitoring SaaS - Setup Guide

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+ with TimescaleDB extension
- Go 1.21+ (for agent compilation)
- npm or yarn

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd server-monitoring-saas

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Install agent dependencies
cd ../agent && go mod download
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE server_monitoring;
```

2. Install TimescaleDB extension:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

3. Run migrations:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
```

### 3. Environment Configuration

Backend (.env):
```env
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=server_monitoring
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Agent Authentication
AGENT_SECRET=your-agent-secret-key
```

Frontend (.env):
```env
REACT_APP_API_URL=http://localhost:3001
```

Agent (.env):
```env
SERVER_ID=your-server-uuid-from-dashboard
API_TOKEN=your-agent-token-from-dashboard
API_URL=http://localhost:3001
INTERVAL=60
SITE_URL=https://your-website.com
SERVER_NAME=Production Server 1
```

### 4. Start the Application

```bash
# From root directory - starts both backend and frontend
npm run dev

# Or start separately:
# Backend: cd backend && npm run dev
# Frontend: cd frontend && npm start
```

### 5. Build and Deploy Agent

1. Get server ID and agent token from the dashboard after registering a server
2. Configure agent environment variables
3. Build the agent:

```bash
cd agent

# Build for current platform
go build -o server-monitoring-agent .

# Or build with Docker
docker build -t server-monitoring-agent .
docker run -d --name agent \
  -e SERVER_ID=your-server-id \
  -e API_TOKEN=your-agent-token \
  -e API_URL=http://your-api-domain:3001 \
  server-monitoring-agent
```

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Use process manager (PM2):
```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name "server-monitoring-api"
```

### Frontend Deployment

1. Build for production:
```bash
cd frontend
npm run build
```

2. Serve with nginx or deploy to Netlify/Vercel

### Database Production Setup

1. Enable TimescaleDB compression:
```sql
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'time DESC'
);
```

2. Set up retention policies:
```sql
-- Keep data for 1 year
SELECT add_retention_policy('metrics', INTERVAL '1 year');
```

## Security Considerations

1. Change all default secrets in production
2. Enable HTTPS in production
3. Set up proper firewall rules
4. Use environment variables for all sensitive data
5. Regularly update dependencies

## Monitoring and Maintenance

- Check application logs regularly
- Monitor database disk usage
- Set up backup procedures for PostgreSQL
- Monitor agent connectivity
- Review alert patterns regularly

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check .env configuration and PostgreSQL status
2. **Agent not sending data**: Verify API_URL and agent token
3. **JWT errors**: Ensure JWT_SECRET is set and consistent
4. **TimescaleDB errors**: Verify extension is installed

### Logs

- Backend logs: Check console output or PM2 logs
- Agent logs: Check container logs or systemd journal
- Database logs: Check PostgreSQL log files

## Support

For issues and questions, check:
- Application logs
- PostgreSQL logs  
- Network connectivity
- Environment configuration