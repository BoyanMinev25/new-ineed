#!/bin/bash
echo "===== Starting Service Marketplace API Server ====="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create a .env file with your configuration."
  exit 1
fi

# Get the port from .env file with default fallback
PORT=$(grep -o "PORT=[0-9]*" .env | cut -d= -f2)
PORT=${PORT:-5002}

echo "API server will run on port $PORT"

# Kill any existing processes on the port
pid=$(lsof -t -i:$PORT 2>/dev/null)
if [ "$pid" != "" ]; then
  echo "Killing existing process $pid running on port $PORT"
  kill -9 $pid 2>/dev/null
  sleep 1
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Start the backend server
echo "Starting API server on port $PORT..."
node index.js 