#!/bin/bash

echo "===== Firebase and WebSocket Fix Script ====="
echo "This script will fix Firebase initialization and WebSocket connection issues."
echo ""

# Check if service-marketplace/client/src/firebase/config.js exists
if [ -f "service-marketplace/client/src/firebase/config.js" ]; then
  echo "Backing up original Firebase config..."
  cp service-marketplace/client/src/firebase/config.js service-marketplace/client/src/firebase/config.js.bak
  
  echo "Updating Firebase config to prevent duplicate initialization..."
  cat > service-marketplace/client/src/firebase/config.js << 'EOF'
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase app is already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log("Firebase app already exists, using existing instance");
    app = initializeApp(firebaseConfig, 'secondary');
  } else {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
EOF
  
  echo "Firebase config updated to prevent duplicate initialization."
else
  echo "Error: Firebase config file not found at service-marketplace/client/src/firebase/config.js"
  echo "Please check the file path and try again."
fi

# Update index.js to support WebSocket connections
if [ -f "index.js" ]; then
  echo "Backing up original index.js..."
  cp index.js index.js.bak
  
  echo "Updating index.js to support WebSocket connections..."
  
  # Check if express-ws is installed
  if ! grep -q "express-ws" package.json; then
    echo "Installing express-ws package..."
    npm install express-ws --save
  fi
  
  # Add WebSocket support to index.js
  if ! grep -q "express-ws" index.js; then
    sed -i.bak '
      /const express = require(.express.);/a \
const expressWs = require("express-ws");
      /const app = express();/a \
// Set up WebSocket support\
expressWs(app);
      /app.use(cors({/,/}));/c \
app.use(cors({\
  origin: ["http://localhost:3000", "http://localhost:5002"],\
  credentials: true\
}));
      /app.listen(PORT, () => {/i \
// WebSocket endpoint\
app.ws("/ws", (ws, req) => {\
  console.log("WebSocket connection established");\
  \
  ws.on("message", (msg) => {\
    console.log("Received message:", msg);\
    ws.send(JSON.stringify({ status: "received", message: msg }));\
  });\
  \
  ws.on("close", () => {\
    console.log("WebSocket connection closed");\
  });\
});\
\
' index.js
  fi
  
  echo "index.js updated to support WebSocket connections."
else
  echo "Error: index.js file not found."
  echo "Please check the file path and try again."
fi

echo ""
echo "===== Fix Complete ====="
echo "Please restart your application using ./start-fixed.sh"
echo "" 