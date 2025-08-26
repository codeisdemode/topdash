#!/bin/bash

# TopDash Agent Auto-Registration Script
# This script automatically registers a server and installs the monitoring agent

set -e  # Exit on any error

# Default values
API_URL="https://topdash.live/api/v1"
AGENT_DOWNLOAD_URL="https://github.com/your-org/server-monitoring-agent/releases/latest/download/agent"

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

# Function to detect OS and architecture
detect_platform() {
    OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    ARCH="$(uname -m)"
    
    case "$ARCH" in
        x86_64) ARCH="amd64" ;;
        aarch64) ARCH="arm64" ;;
        armv7l) ARCH="armv7" ;;
        *) ARCH="unknown" ;;
    esac
    
    echo "${OS}_${ARCH}"
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
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
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help message
show_help() {
    cat << EOF
TopDash Agent Installation Script

Usage: curl -sSL https://topdash.live/agent-registration | bash -s -- --api-key=YOUR_API_KEY [options]

Options:
  --api-key=KEY       Your TopDash API key (required)
  --server-name=NAME  Custom server name (default: hostname)
  --site-url=URL      Website URL to monitor for HTTP status
  --help              Show this help message

Example:
  curl -sSL https://topdash.live/agent-registration | bash -s -- --api-key=abc123 --server-name="My Production Server"

Get your API key from the TopDash dashboard under Settings -> API Keys.
EOF
}

# Function to validate API key format
validate_api_key() {
    if [[ -z "$API_KEY" ]]; then
        print_error "API key is required. Use --api-key=YOUR_API_KEY"
        show_help
        exit 1
    fi
    
    # Basic validation - should be alphanumeric and at least 20 characters
    if ! [[ "$API_KEY" =~ ^[a-zA-Z0-9]{20,}$ ]]; then
        print_error "Invalid API key format"
        exit 1
    fi
}

# Function to register server and get credentials
register_server() {
    local hostname="$(hostname)"
    local ip_address="$(curl -s https://api.ipify.org || echo "127.0.0.1")"
    
    local registration_data=$(cat <<EOF
{
    "name": "${SERVER_NAME:-$hostname}",
    "ip": "$ip_address",
    "site": "${SITE_URL:-}",
    "ubuntu_version": "$(lsb_release -ds 2>/dev/null || echo "Unknown")"
}
EOF
    )
    
    print_status "Registering server with TopDash..."
    
    local response=$(curl -s -X POST "$API_URL/servers/register" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$registration_data" \
        --retry 3 \
        --connect-timeout 30)
    
    if echo "$response" | grep -q '"error"'; then
        local error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        print_error "Registration failed: ${error_msg:-$response}"
        exit 1
    fi
    
    SERVER_ID=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)
    AGENT_TOKEN=$(echo "$response" | grep -o '"agent_token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -z "$SERVER_ID" || -z "$AGENT_TOKEN" ]]; then
        print_error "Failed to parse registration response"
        exit 1
    fi
    
    print_success "Server registered successfully (ID: $SERVER_ID)"
}

# Function to download and install agent
install_agent() {
    local platform=$(detect_platform)
    local download_url="$AGENT_DOWNLOAD_URL"
    
    print_status "Detected platform: $platform"
    print_status "Downloading monitoring agent..."
    
    # Create installation directory
    local install_dir="/opt/topdash-agent"
    sudo mkdir -p "$install_dir"
    
    # Download agent binary
    if ! sudo curl -sSL -o "$install_dir/agent" "$download_url"; then
        print_error "Failed to download agent"
        exit 1
    fi
    
    sudo chmod +x "$install_dir/agent"
    
    # Create environment file
    sudo tee "$install_dir/.env" > /dev/null <<EOF
SERVER_ID=$SERVER_ID
API_TOKEN=$AGENT_TOKEN
API_URL=$API_URL
INTERVAL=60
SERVER_NAME=${SERVER_NAME:-$(hostname)}
SITE_URL=${SITE_URL:-}
EOF
    
    print_success "Agent downloaded and configured"
}

# Function to create systemd service
create_systemd_service() {
    local service_file="/etc/systemd/system/topdash-agent.service"
    
    print_status "Creating systemd service..."
    
    sudo tee "$service_file" > /dev/null <<EOF
[Unit]
Description=TopDash Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=topdash
Group=topdash
WorkingDirectory=/opt/topdash-agent
EnvironmentFile=/opt/topdash-agent/.env
ExecStart=/opt/topdash-agent/agent
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    # Create dedicated user
    if ! id "topdash" &>/dev/null; then
        sudo useradd -r -s /bin/false topdash
    fi
    
    sudo chown -R topdash:topdash /opt/topdash-agent
    sudo chmod 600 /opt/topdash-agent/.env
    
    sudo systemctl daemon-reload
    sudo systemctl enable topdash-agent
    sudo systemctl start topdash-agent
    
    print_success "Systemd service created and started"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    sleep 3  # Give service time to start
    
    if sudo systemctl is-active --quiet topdash-agent; then
        print_success "TopDash agent is running successfully!"
        echo ""
        echo "Server ID: $SERVER_ID"
        echo "Agent Token: $AGENT_TOKEN"
        echo "Service Status: $(sudo systemctl is-active topdash-agent)"
        echo ""
        echo "View your server dashboard at: https://topdash.live/dashboard"
    else
        print_warning "Agent service is not running. Check logs with: journalctl -u topdash-agent"
    fi
}

# Main execution
main() {
    print_status "Starting TopDash agent installation..."
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed. Please install curl first."
        exit 1
    fi
    
    # Parse arguments
    parse_args "$@"
    
    # Validate API key
    validate_api_key
    
    # Register server
    register_server
    
    # Install agent
    install_agent
    
    # Create systemd service
    create_systemd_service
    
    # Verify installation
    verify_installation
    
    print_success "Installation completed successfully!"
}

# Run main function with all arguments
main "$@"