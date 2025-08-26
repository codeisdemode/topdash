# Tactical Interface Migration Plan

## Current API Endpoints

### Servers
- `GET /api/v1/servers` - Get all servers
- `GET /api/v1/servers/:id` - Get server by ID
- `POST /api/v1/servers/register` - Register new server
- `DELETE /api/v1/servers/:id` - Delete server

### Alerts
- `GET /api/v1/alerts` - Get alerts (with params: resolved)
- `GET /api/v1/alerts/stats` - Get alert statistics
- `PATCH /api/v1/alerts/:id/resolve` - Resolve alert
- `DELETE /api/v1/alerts/:id` - Delete alert

### Metrics
- `GET /api/v1/metrics/:serverId` - Get metrics for server

## Migration Steps

### 1. Authentication Setup
- Install @clerk/nextjs with React 19 compatibility
- Create middleware.ts for route protection
- Set up environment variables
- Update layout.tsx with ClerkProvider

### 2. API Utilities
```typescript
// lib/api.ts
import { headers } from 'next/headers'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001'

export async function fetchServers() {
  const response = await fetch(`${API_BASE_URL}/api/v1/servers`, {
    headers: {
      'Authorization': `Bearer ${await getToken()}`
    }
  })
  return response.json()
}

// Similar functions for alerts, metrics, etc.
```

### 3. Component Migration
- CommandCenterPage: Replace placeholder with real dashboard
- AgentNetworkPage: Display actual servers list
- IntelligencePage: Show real alerts data
- OperationsPage: Add server management features
- SystemsPage: Add system configuration

### 4. Styling Updates
- Maintain tactical dark theme
- Use shadcn/ui components consistently
- Ensure responsive design

### 5. Environment Setup
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
API_URL=http://localhost:3001
```

## Permission Fix Required

Before starting migration, fix directory permissions:
```bash
sudo chown -R paul:paul /home/paul/server-monitoring-saas/tactical-command-interface/
```

Then install dependencies:
```bash
cd tactical-command-interface
npm install @clerk/nextjs --legacy-peer-deps
npm install
```