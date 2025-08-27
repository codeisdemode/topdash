#!/bin/bash

# TopDash Server Monitoring Agent Installation Script
# Usage: curl -sSL https://topdash.live/api/v1/servers/agent-install | bash -s -- --api-key=YOUR_API_KEY [--server-name="Server Name"]

set -e

# Default values
# Auto-detect API URL - if script is downloaded from topdash.live, use production URL
API_URL="https://topdash.live/api/v1"
INSTALL_DIR="/opt/topdash-agent"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
API_KEY=""
SERVER_NAME=""
SITE_URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-key=*)
            API_KEY="${1#*=}"
            shift
            ;;
        --server-name=*)
            SERVER_NAME="${1#*=}"
            shift
            ;;
        --site-url=*)
            SITE_URL="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 --api-key=API_KEY [--server-name=\"Server Name\"] [--site-url=https://your-site.com]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate API key
if [[ -z "$API_KEY" ]]; then
    echo -e "${RED}Error: API key is required${NC}"
    echo "Usage: $0 --api-key=API_KEY [--server-name=\"Server Name\"]"
    exit 1
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}Warning: This script should be run as root for proper installation${NC}"
   read -p "Continue as non-root user? (y/N) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Detect OS and architecture
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS="$ID"
        OS_VERSION="$VERSION_ID"
    elif [[ -f /etc/redhat-release ]]; then
        OS="centos"
        OS_VERSION=$(grep -oE '[0-9]+\.' /etc/redhat-release | cut -d. -f1)
    else
        OS=$(uname -s | tr '[:upper:]' '[:lower:]')
        OS_VERSION=$(uname -r)
    fi
    
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) ARCH="amd64" ;;
        aarch64) ARCH="arm64" ;;
        armv7l) ARCH="armv7" ;;
        *) ARCH="unknown" ;;
    esac
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    
    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y curl wget git build-essential
            ;;
        centos|rhel|fedora)
            yum install -y curl wget git gcc make
            ;;
        alpine)
            apk add --no-cache curl wget git gcc make musl-dev
            ;;
        *)
            echo -e "${YELLOW}Warning: Unsupported OS for automatic dependency installation${NC}"
            echo "Please ensure curl, wget, git, and build tools are installed"
            ;;
    esac
}

# Function to download and install pre-built agent
build_agent() {
    echo -e "${BLUE}Downloading TopDash monitoring agent...${NC}"
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Download the pre-built agent binary from your server
    if ! curl -sSL "${API_URL}/public/agent-binary" -o agent; then
        echo -e "${RED}Error: Failed to download agent binary${NC}"
        echo "Please check your internet connection and API_URL"
        exit 1
    fi
    
    # Make binary executable
    chmod +x "$INSTALL_DIR/agent"
    
    echo -e "${GREEN}Agent downloaded successfully${NC}"
}

# Function to register server with API
register_server() {
    echo -e "${BLUE}Registering server with TopDash...${NC}"
    
    # Get server IP
    SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')
    
    # Prepare registration data
    REGISTRATION_DATA={\"name\":\"${SERVER_NAME:-$(hostname)}\",\"ip\":\"${SERVER_IP}\"}
    if [[ -n "$SITE_URL" ]]; then
        REGISTRATION_DATA=$(echo "$REGISTRATION_DATA" | jq -c ". + {site: \"$SITE_URL\"}" 2>/dev/null || echo "$REGISTRATION_DATA")
    fi
    
    # Register server
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$REGISTRATION_DATA" \
        "$API_URL/servers/register" || echo "error")
    
    if [[ "$RESPONSE" == "error" ]]; then
        echo -e "${RED}Error: Failed to register server${NC}"
        echo "Please check your API key and ensure the API is accessible"
        exit 1
    fi
    
    # Extract server ID and agent token from response
    SERVER_ID=$(echo "$RESPONSE" | grep -o '"id":[^,]*' | cut -d: -f2 | tr -d '" ')
    AGENT_TOKEN=$(echo "$RESPONSE" | grep -o '"agent_token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -z "$SERVER_ID" || -z "$AGENT_TOKEN" ]]; then
        echo -e "${RED}Error: Failed to parse registration response${NC}"
        echo "Response: $RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}Server registered successfully!${NC}"
    echo "Server ID: $SERVER_ID"
    echo "Agent Token: $AGENT_TOKEN"
}

# Function to create systemd service
create_service() {
    echo -e "${BLUE}Creating systemd service...${NC}"
    
    SERVICE_FILE="/etc/systemd/system/topdash-agent.service"
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=TopDash Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/agent
Environment=SERVER_ID=$SERVER_ID
Environment=API_TOKEN=$AGENT_TOKEN
Environment=API_URL=$API_URL
Environment=INTERVAL=60
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable topdash-agent
    
    echo -e "${GREEN}Systemd service created${NC}"
}

# Function to start agent
start_agent() {
    echo -e "${BLUE}Starting TopDash agent...${NC}"
    
    if systemctl start topdash-agent; then
        echo -e "${GREEN}Agent started successfully!${NC}"
        echo "Service status: systemctl status topdash-agent"
        echo "Logs: journalctl -u topdash-agent -f"
    else
        echo -e "${YELLOW}Warning: Failed to start via systemd${NC}"
        echo "Starting agent manually..."
        cd "$INSTALL_DIR"
        nohup ./agent > agent.log 2>&1 &
        echo -e "${GREEN}Agent started manually${NC}"
        echo "Logs: tail -f $INSTALL_DIR/agent.log"
    fi
}

# Function to create environment file
create_env_file() {
    echo -e "${BLUE}Creating environment configuration...${NC}"
    
    cat > "$INSTALL_DIR/.env" << EOF
# TopDash Agent Configuration
SERVER_ID=$SERVER_ID
API_TOKEN=$AGENT_TOKEN
API_URL=$API_URL
INTERVAL=60
SERVER_NAME=${SERVER_NAME:-$(hostname)}
SITE_URL=$SITE_URL
EOF
    
    chmod 600 "$INSTALL_DIR/.env"
    echo -e "${GREEN}Environment file created${NC}"
}

# Main installation process
main() {
    echo -e "${GREEN}=== TopDash Server Monitoring Agent Installation ===${NC}"
    echo "API Key: ${API_KEY:0:8}..."
    
    # Detect OS
    detect_os
    echo "Detected OS: $OS $OS_VERSION ($ARCH)"
    
    # Install dependencies
    install_dependencies
    
    # Build agent
    build_agent
    
    # Register server
    register_server
    
    # Create environment file
    create_env_file
    
    # Create systemd service (if supported)
    if command -v systemctl >/dev/null 2>&1; then
        create_service
        start_agent
        
        # Verify agent is running
        echo -e "${BLUE}Verifying agent status...${NC}"
        sleep 2
        if systemctl is-active --quiet topdash-agent; then
            echo -e "${GREEN}✓ Agent is running successfully${NC}"
            echo "Service status: systemctl status topdash-agent"
        else
            echo -e "${YELLOW}⚠ Agent service exists but may not be active${NC}"
            echo "Check status manually: systemctl status topdash-agent"
        fi
    else
        echo -e "${YELLOW}Systemd not available, starting agent manually${NC}"
        cd "$INSTALL_DIR"
        nohup ./agent > agent.log 2>&1 &
        echo -e "${GREEN}Agent started manually${NC}"
        echo "Logs: tail -f $INSTALL_DIR/agent.log"
    fi
    
    echo -e "${GREEN}=== Installation Complete! ===${NC}"
    echo "Agent installed to: $INSTALL_DIR"
    echo "Configuration: $INSTALL_DIR/.env"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Check your TopDash dashboard for server metrics"
    echo "2. Monitor agent logs for any issues"
    echo "3. Configure alert thresholds in your dashboard settings"
}

# Run main function
main "$@"