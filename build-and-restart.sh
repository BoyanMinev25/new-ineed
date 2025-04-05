#!/bin/bash

# Stop any running node processes
echo "Stopping any running node processes..."
pkill -f "node index.js" || true

# Change to module directory
cd order-payments-module

# Install dependencies if needed
echo "Installing module dependencies..."
npm install --legacy-peer-deps

# Build module
echo "Building order-payments-module..."
npm run build

# Return to root directory and run fix-routes script
cd ..
echo "Fixing import paths in compiled files..."
node fix-routes.js

# Change to client directory 
cd service-marketplace/client

# Install client dependencies if needed
echo "Installing client dependencies..."
npm install

# Build client
echo "Building client application..."
npm run build

# Return to root directory
cd ../..

# Start server
echo "Starting server..."
node index.js 