# Server Monitoring Agent

A lightweight Go agent that collects server metrics and sends them to the monitoring dashboard.

## Installation

1. **Build the agent**:
   ```bash
   cd agent
   go build -o agent main.go
   ```

2. **Register a server** through the dashboard to get your credentials:
   - Go to `/agent-registration`
   - Fill in server details
   - Copy the generated `SERVER_ID` and `API_TOKEN`

3. **Run the agent**:
   ```bash
   SERVER_ID=your_server_id API_TOKEN=your_api_token API_URL=http://your-api-url:3001 ./agent
   ```

## Environment Variables

- `SERVER_ID`: Unique server identifier (obtained from registration)
- `API_TOKEN`: Authentication token for the API
- `API_URL`: Backend API URL (default: http://localhost:3001)
- `INTERVAL`: Metrics collection interval in seconds (default: 60)
- `SITE_URL`: Optional website URL to monitor for HTTP status
- `SERVER_NAME`: Display name for the server (default: "Unknown Server")

## Metrics Collected

- **CPU Usage**: Current CPU utilization percentage
- **Memory Usage**: Current memory utilization percentage  
- **Disk Usage**: Root filesystem utilization percentage
- **Network I/O**: Bytes received and sent
- **Site Status**: HTTP status code of monitored website (if configured)
- **OS Version**: Operating system information

## Security Features

- **Token-based authentication**: Each agent uses a unique API token
- **HTTPS support**: Secure communication with the backend
- **Minimal permissions**: Only requires basic system monitoring access

## Development

The agent includes development features:
- Mock data support when database is unavailable
- Graceful error handling for network issues
- Configurable polling intervals

## Production Deployment

For production use:
1. Set up proper SSL certificates
2. Use environment-specific API URLs
3. Monitor agent logs for errors
4. Consider running as a systemd service

Example systemd service file:
```ini
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=monitoring
WorkingDirectory=/opt/server-monitoring-agent
Environment=SERVER_ID=your_id
Environment=API_TOKEN=your_token
Environment=API_URL=https://your-domain.com
ExecStart=/opt/server-monitoring-agent/agent
Restart=always

[Install]
WantedBy=multi-user.target
```