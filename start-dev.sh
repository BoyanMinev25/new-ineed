#!/bin/bash
echo "===== Starting Service Marketplace Development Servers ====="
echo "This script will start both the backend API and React development servers."
echo "Backend changes will automatically reload without restarting."
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
    if [ -n "$BACKEND_PID" ] && is_process_running $BACKEND_PID; then
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ] && is_process_running $FRONTEND_PID; then
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set trap for cleanup early
trap cleanup INT TERM

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating default .env file..."
    echo "PORT=5002" > .env
    echo "OPENAI_API_KEY=your_openai_key_here" >> .env
    echo "Created default .env file. Please edit it with your actual configuration values."
fi

# Get the port from .env file with default fallback
PORT=$(grep -o "PORT=[0-9]*" .env 2>/dev/null | cut -d= -f2)
PORT=${PORT:-5002}  # Default to 5002 if not found

echo "Backend API will run on port $PORT"

# Clean up ports
echo "Cleaning up ports..."
# Kill any existing process on port $PORT (API server)
pid=$(lsof -t -i:$PORT 2>/dev/null)
if [ "$pid" != "" ]; then
    echo "Killing existing process on port $PORT"
    kill -9 $pid 2>/dev/null
    sleep 1
fi

# Kill any existing process on port 3000 (React dev server)
pid=$(lsof -t -i:3000 2>/dev/null)
if [ "$pid" != "" ]; then
    echo "Killing existing React dev server process on port 3000"
    kill -9 $pid 2>/dev/null
    sleep 1
fi

# Check if nodemon is installed globally
if ! command -v nodemon &> /dev/null; then
    echo "Nodemon is not installed. Installing nodemon globally for live reloading..."
    npm install -g nodemon
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

# Create React environment files
echo "Creating React environment files..."
cat > service-marketplace/client/.env << EOL
REACT_APP_API_URL=http://localhost:$PORT
PORT=3000
EOL

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
if [ ! -d "service-marketplace/server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd service-marketplace/server
    npm install
    cd ../..
fi

# Check and install frontend dependencies if needed
if [ ! -d "service-marketplace/client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd service-marketplace/client
    npm install
    cd ../..
fi

# Start the backend server with nodemon for live reloading
echo "Starting backend API server with nodemon for live reloading on port $PORT..."
cd service-marketplace/server
DISABLE_PORT_CLEANUP=true nodemon index.js &
BACKEND_PID=$!
cd ../..

# Verify backend server is starting
echo "Verifying backend server startup..."
backend_started=false
for i in {1..10}; do
    sleep 2
    if curl -s http://localhost:$PORT/api/health >/dev/null 2>&1; then
        echo "✅ Backend server successfully started on port $PORT"
        backend_started=true
        break
    else
        echo "Waiting for backend server to start (attempt $i/10)..."
        if [ $i -eq 10 ]; then
            echo "⚠️  Backend server did not respond to health check, but continuing..."
        fi
    fi
done

# Start the React development server
echo "Starting React development server..."
cd service-marketplace/client
npm start &
FRONTEND_PID=$!
cd ../..

echo ""
echo "=========================================================="
echo "Development servers started!"
echo "Backend API running on: http://localhost:$PORT"
echo "Frontend running on: http://localhost:3000"
echo ""
echo "✨ Backend changes will automatically reload (powered by nodemon)"
echo "✨ Frontend changes will automatically reload (powered by React)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=========================================================="

# Keep the script running and monitor processes
while true; do
    if ! is_process_running $BACKEND_PID; then
        echo "⚠️  Backend server has stopped. Attempting to restart..."
        cd service-marketplace/server
        DISABLE_PORT_CLEANUP=true nodemon index.js &
        BACKEND_PID=$!
        cd ../..
    fi
    
    if ! is_process_running $FRONTEND_PID; then
        echo "⚠️  Frontend server has stopped. Attempting to restart..."
        cd service-marketplace/client
        npm start &
        FRONTEND_PID=$!
        cd ../..
    fi
    
    sleep 5
done 