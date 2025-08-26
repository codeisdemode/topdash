#!/bin/bash

# TopDash Server Stop Script

set -e

echo "Stopping TopDash servers..."

# Kill processes on ports 3000 and 3001
pkill -f "next dev" || true
pkill -f "node.*src/index.js" || true
pkill -f "node.*3000" || true
pkill -f "node.*3001" || true

# Also kill by port using lsof
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

echo "Servers stopped successfully"
echo "Port 3000 status: $(lsof -ti:3000 >/dev/null && echo "IN USE" || echo "FREE")"
echo "Port 3001 status: $(lsof -ti:3001 >/dev/null && echo "IN USE" || echo "FREE")"