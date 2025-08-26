#!/bin/bash

# TopDash Server Startup Script
# Kills processes on ports 3000 and 3001 and starts servers properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service_name=$2
    
    print_status "Checking for processes on port $port ($service_name)..."
    
    # Find PIDs listening on the port
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")
    
    if [ -n "$pids" ]; then
        print_warning "Found processes on port $port: $pids"
        print_status "Killing processes on port $port..."
        kill -9 $pids 2>/dev/null || true
        sleep 2
        
        # Verify they're gone
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ -n "$remaining_pids" ]; then
            print_error "Failed to kill all processes on port $port"
            return 1
        else
            print_success "Successfully cleared port $port"
        fi
    else
        print_success "Port $port is free"
    fi
}

# Function to check if port is free
is_port_free() {
    local port=$1
    if ss -tln | grep -q ":$port " ; then
        return 1 # Port is in use
    else
        return 0 # Port is free
    fi
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server on port 3001..."
    
    if is_port_free 3001; then
        cd /home/paul/server-monitoring-saas/backend
        nohup npm start > server.log 2>&1 &
        local backend_pid=$!
        
        # Wait for backend to start
        sleep 3
        
        if is_port_free 3001; then
            print_error "Backend failed to start on port 3001"
            return 1
        else
            print_success "Backend server started successfully (PID: $backend_pid)"
            echo $backend_pid > /tmp/backend.pid
            return 0
        fi
    else
        print_error "Port 3001 is already in use"
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    print_status "Starting frontend server on port 3000..."
    
    if is_port_free 3000; then
        cd /home/paul/server-monitoring-saas/tactical-command-interface
        nohup npm run dev > frontend.log 2>&1 &
        local frontend_pid=$!
        
        # Wait for frontend to start
        sleep 5
        
        if is_port_free 3000; then
            print_error "Frontend failed to start on port 3000"
            return 1
        else
            print_success "Frontend server started successfully (PID: $frontend_pid)"
            echo $frontend_pid > /tmp/frontend.pid
            return 0
        fi
    else
        print_error "Port 3000 is already in use"
        return 1
    fi
}

# Function to check Nginx configuration
check_nginx() {
    print_status "Checking Nginx configuration..."
    
    if sudo nginx -t 2>/dev/null; then
        print_success "Nginx configuration is valid"
        
        # Check if Nginx is running
        if systemctl is-active --quiet nginx; then
            print_status "Restarting Nginx..."
            sudo systemctl restart nginx
            print_success "Nginx restarted successfully"
        else
            print_status "Starting Nginx..."
            sudo systemctl start nginx
            print_success "Nginx started successfully"
        fi
        return 0
    else
        print_error "Nginx configuration is invalid"
        return 1
    fi
}

# Main execution
main() {
    print_status "Starting TopDash server management..."
    
    # Kill any existing processes on our ports
    kill_port 3000 "Frontend"
    kill_port 3001 "Backend"
    
    # Start backend server
    if start_backend; then
        # Start frontend server
        if start_frontend; then
            # Check and restart Nginx
            if check_nginx; then
                print_success "All servers started successfully!"
                echo ""
                echo "Backend: http://localhost:3001"
                echo "Frontend: http://localhost:3000"  
                echo "Production: https://topdash.live"
                echo ""
                echo "Logs:"
                echo "  Backend: /home/paul/server-monitoring-saas/backend/server.log"
                echo "  Frontend: /home/paul/server-monitoring-saas/tactical-command-interface/frontend.log"
            else
                print_error "Nginx configuration failed"
                return 1
            fi
        else
            print_error "Frontend startup failed"
            return 1
        fi
    else
        print_error "Backend startup failed"
        return 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        print_status "Stopping all TopDash servers..."
        kill_port 3000 "Frontend"
        kill_port 3001 "Backend"
        print_success "All servers stopped"
        ;;
    "restart")
        print_status "Restarting all TopDash servers..."
        kill_port 3000 "Frontend"
        kill_port 3001 "Backend"
        sleep 2
        main
        ;;
    "status")
        print_status "Checking server status..."
        echo "Port 3000 (Frontend): $(is_port_free 3000 && echo 'FREE' || echo 'IN USE')"
        echo "Port 3001 (Backend): $(is_port_free 3001 && echo 'FREE' || echo 'IN USE')"
        echo "Nginx: $(systemctl is-active nginx 2>/dev/null && echo 'ACTIVE' || echo 'INACTIVE')"
        ;;
    "" | "start")
        main
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|status]"
        echo "  start   - Start all servers (default)"
        echo "  stop    - Stop all servers"
        echo "  restart - Restart all servers"
        echo "  status  - Check server status"
        exit 1
        ;;
esac