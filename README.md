# Server Monitoring SaaS

A comprehensive multi-tenant server monitoring platform built with Node.js, React, and Go. Monitor your servers' health, receive alerts, and manage your infrastructure from a beautiful dashboard.

## 🚀 Features

- **Real-time Monitoring**: CPU, memory, disk, and network metrics
- **Multi-tenant Architecture**: Isolated environments for different teams/companies
- **Alert System**: Get notified of critical issues (high CPU, memory, disk usage, site downtime)
- **Beautiful Dashboard**: React-based UI with TailwindCSS and Recharts
- **Lightweight Agent**: Go-based agent with minimal resource usage
- **RESTful API**: Fully documented API for integration
- **PostgreSQL + TimescaleDB**: Optimized for time-series data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React         │    │   Node.js       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend API   │◄──►│   + TimescaleDB │
│   (Dashboard)   │    │   (Express)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                         ▲
        │                         │
        │                         │
┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Go Agent      │
│   (User)        │    │   (On Servers)  │
└─────────────────┘    └─────────────────┘
```

## 📦 Tech Stack

### Backend
- **Node.js** + Express.js
- **JWT** authentication
- **PostgreSQL** with TimescaleDB extension
- **bcryptjs** for password hashing

### Frontend  
- **React** 18 with hooks
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Recharts** for data visualization

### Agent
- **Go** (golang) for performance
- **gopsutil** for system metrics
- **Lightweight** (~10MB memory usage)

## 🚦 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+ with TimescaleDB
- Go 1.21+ (for agent)

### 1. Installation
```bash
# Clone and install
git clone <repository>
cd server-monitoring-saas

# Install all dependencies
npm run install:all
```

### 2. Database Setup
```bash
# Create database and run migrations
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
```

### 3. Start Development
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Backend: cd backend && npm run dev
# Frontend: cd frontend && npm start
```

### 4. Register and Deploy Agent

1. Open http://localhost:3000
2. Create an account and register a server
3. Copy the agent token
4. Configure and deploy the agent on your servers

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Servers
- `GET /api/v1/servers` - List all servers
- `POST /api/v1/servers/register` - Register new server
- `DELETE /api/v1/servers/:id` - Delete server

### Metrics
- `POST /api/v1/metrics` - Receive metrics from agent
- `GET /api/v1/metrics/:serverId` - Get metrics for server

### Alerts
- `GET /api/v1/alerts` - List alerts
- `PATCH /api/v1/alerts/:id/resolve` - Resolve alert
- `GET /api/v1/alerts/stats` - Alert statistics

## 🔧 Agent Configuration

The Go agent runs on your servers and sends metrics to the backend:

```bash
# Build the agent
cd agent
go build -o server-monitoring-agent .

# Run with environment variables
SERVER_ID=your-server-id \
API_TOKEN=your-agent-token \
API_URL=http://your-api:3001 \
INTERVAL=60 \
./server-monitoring-agent
```

Or use Docker:
```bash
docker run -d \
  -e SERVER_ID=your-server-id \
  -e API_TOKEN=your-agent-token \
  -e API_URL=http://your-api:3001 \
  -e INTERVAL=60 \
  yourname/server-monitoring-agent
```

## 🐳 Docker Deployment

Full stack deployment with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with TimescaleDB
- Backend API
- Frontend (nginx)
- Example agent

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Environment variable configuration
- Multi-tenant data isolation

## 📈 Monitoring & Alerts

The system automatically monitors:

- **CPU Usage**: Alert > 80%
- **Memory Usage**: Alert > 85%  
- **Disk Usage**: Alert > 90%
- **Site Status**: Alert on HTTP errors (4xx/5xx)

Alerts are shown in the dashboard and can be resolved manually.

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use PM2 for process management
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Database
1. Enable TimescaleDB compression
2. Set up retention policies
3. Configure backups
4. Monitor disk usage

### Frontend
1. Build with `npm run build`
2. Serve with nginx/CDN
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the [SETUP.md](SETUP.md) guide
2. Review application logs
3. Check database connectivity
4. Verify environment variables

## 🎯 Roadmap

- [ ] Email/Slack notifications
- [ ] Advanced alert rules
- [ ] Historical data analysis
- [ ] Server provisioning
- [ ] Mobile app
- [ ] API documentation
- [ ] Performance optimizations