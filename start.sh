#!/bin/bash

echo "===== Starting Service Marketplace Application ====="
echo ""

# Check if we're in the correct directory
if [ ! -d "service-marketplace" ]; then
    echo "ERROR: Cannot find 'service-marketplace' directory."
    echo "Please make sure you're running this script from the project root directory."
    exit 1
fi

# Function to check if a process is actually running
is_process_running() {
    local pid=$1
    if ps -p $pid > /dev/null; then
        return 0 # Process is running
    else
        return 1 # Process is not running
    fi
}

# Function to handle cleanup
cleanup() {
    echo "Shutting down servers..."
    if [ -n "$SERVER_PID" ] && is_process_running $SERVER_PID; then
        kill -9 $SERVER_PID 2>/dev/null
    fi
    exit 0
}

# Set trap for cleanup early
trap cleanup INT TERM

# More thorough port cleanup function
cleanup_ports() {
    local port=$1
    echo "Cleaning up port $port..."
    
    # First, try to find any process using this port
    local pids=$(lsof -ti :$port)
    if [ -n "$pids" ]; then
        echo "Found processes using port $port: $pids"
        for pid in $pids; do
            if is_process_running $pid; then
                echo "Killing process $pid"
                kill -9 $pid 2>/dev/null
                sleep 2 # Give more time for the process to fully terminate
            fi
        done
    else
        echo "No processes found on port $port"
    fi

    # Double check if port is actually free
    if lsof -i :$port >/dev/null 2>&1; then
        echo "WARNING: Port $port is still in use after cleanup attempt!"
        return 1
    fi
    
    echo "Port $port is now free"
    return 0
}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating default .env file..."
    echo "PORT=5002" > .env
    echo "OPENAI_API_KEY=your_openai_key_here" >> .env
    echo "Created default .env file. Please edit it with your actual configuration values."
fi

# Get the port from .env file with default fallback
PORT=$(grep -o "PORT=[0-9]*" .env | cut -d= -f2)
PORT=${PORT:-5002}  # Default to 5002 if not found

echo "Application will run on port $PORT"

# Kill any existing node processes for this application
echo "Checking for existing Node.js processes..."
pkill -f "node .*service-marketplace/server/index.js" || true
sleep 2 # Wait for processes to terminate

# Clean up required ports
echo "Cleaning up required ports..."
cleanup_ports $PORT || { 
    echo "Failed to clean up port $PORT. Trying alternative port..."
    # If 5002 is in use, try 5003, then 5004
    for alt_port in 5003 5004 5005; do
        echo "Attempting to use port $alt_port instead..."
        if ! lsof -i :$alt_port >/dev/null 2>&1; then
            PORT=$alt_port
            echo "PORT=$PORT" > .env.tmp
            grep -v "^PORT=" .env >> .env.tmp
            mv .env.tmp .env
            echo "Updated PORT to $PORT in .env file"
            break
        fi
    done
}

# Double verify ports are available
echo "Verifying port $PORT is available..."
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "ERROR: Port $PORT is still in use! Cannot proceed."
    exit 1
fi

# Update the client proxy in package.json
echo "Updating client proxy configuration..."
if [ -f "service-marketplace/client/package.json" ]; then
    # Use sed to replace the proxy line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires a different sed syntax
        sed -i '' -E "s|\"proxy\": \"http://localhost:[0-9]+\"|\"proxy\": \"http://localhost:$PORT\"|g" service-marketplace/client/package.json
    else
        sed -i -E "s|\"proxy\": \"http://localhost:[0-9]+\"|\"proxy\": \"http://localhost:$PORT\"|g" service-marketplace/client/package.json
    fi
    echo "Updated client proxy to use port $PORT"
fi

# Make sure server .env has the correct PORT
echo "Updating server .env file..."
if [ ! -f "service-marketplace/server/.env" ]; then
    # Create server .env if it doesn't exist
    cp .env service-marketplace/server/.env
    echo "Created server .env file"
else
    # Update PORT in server .env
    if grep -q "PORT=" service-marketplace/server/.env; then
        # Update existing PORT value
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS requires different sed syntax
            sed -i '' -E "s|PORT=[0-9]+|PORT=$PORT|g" service-marketplace/server/.env
        else
            sed -i -E "s|PORT=[0-9]+|PORT=$PORT|g" service-marketplace/server/.env
        fi
    else
        # Add PORT if it doesn't exist
        echo "PORT=$PORT" >> service-marketplace/server/.env
    fi
    echo "Updated server .env with PORT=$PORT"
fi

# Create properly formatted React environment variables
echo "Creating React-compatible .env.local file..."
cat > service-marketplace/client/.env.local << EOL
# API Keys
REACT_APP_OPENAI_API_KEY=$(grep -o "OPENAI_API_KEY=.*" .env | cut -d= -f2)

# Firebase Config
REACT_APP_FIREBASE_API_KEY=$(grep -o "FIREBASE_API_KEY=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_AUTH_DOMAIN=$(grep -o "FIREBASE_AUTH_DOMAIN=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_PROJECT_ID=$(grep -o "FIREBASE_PROJECT_ID=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_STORAGE_BUCKET=$(grep -o "FIREBASE_STORAGE_BUCKET=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$(grep -o "FIREBASE_MESSAGING_SENDER_ID=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_APP_ID=$(grep -o "FIREBASE_APP_ID=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_CLIENT_EMAIL=$(grep -o "FIREBASE_CLIENT_EMAIL=.*" .env | cut -d= -f2)
REACT_APP_FIREBASE_PRIVATE_KEY=$(grep -o "FIREBASE_PRIVATE_KEY=.*" .env | cut -d= -f2)

# Server Configuration
REACT_APP_API_URL=http://localhost:$PORT
EOL

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Check and install frontend dependencies if needed
if [ ! -d "service-marketplace/client/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd service-marketplace/client
  npm install
  cd ../..
fi

# Always build the client to ensure latest changes are included
echo "Building client app (this may take a moment)..."
cd service-marketplace/client
npm run build
cd ../..

echo "Starting server..."
echo "=========================================================="
echo "Features implemented:"
echo "- Map interface with service ads"
echo "- Ad creation workflow with AI-powered assistance"
echo "- Bidding system for service offers"
echo "- Place Offer functionality with detailed view"
echo "- AI chatbot support"
echo "=========================================================="

# Start the backend API server with improved checking
echo "Starting backend API server on port $PORT..."
cd service-marketplace/server

# Get absolute path to the server directory
SERVER_DIR=$(pwd)
echo "Server directory: $SERVER_DIR"

DISABLE_PORT_CLEANUP=true node "$SERVER_DIR/index.js" &
SERVER_PID=$!
cd ../..

# More thorough backend server startup verification
echo "Verifying backend server startup..."
backend_started=false
for i in {1..10}; do
    sleep 2
    if curl -s http://localhost:$PORT/api/health >/dev/null 2>&1; then
        echo "Backend server successfully started on port $PORT"
        backend_started=true
        break
    else
        echo "Waiting for backend server to start (attempt $i/10)..."
        if [ $i -eq 10 ]; then
            echo "ERROR: Backend server failed to start properly!"
            cleanup
            exit 1
        fi
    fi
done

# Display access information
echo ""
echo "=========================================================="
echo "Application is running!"
echo "Access your application at: http://localhost:$PORT"
echo "API is available at: http://localhost:$PORT/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================================="

# Keep the script running and monitor processes
while true; do
    if ! is_process_running $SERVER_PID; then
        echo "Server has stopped unexpectedly. Shutting down..."
        cleanup
        exit 1
    fi
    sleep 5
done 