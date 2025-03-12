require('dotenv').config();
const express = require('express');
const expressWs = require("express-ws");
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const { exec } = require('child_process');

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port} | findstr LISTENING`
      : `lsof -i :${port}`;
    
    exec(cmd, (error, stdout) => {
      resolve(!!stdout);
    });
  });
};

// Function to kill processes on other ports
const killOtherProcesses = async () => {
  // Skip if DISABLE_PORT_CLEANUP is set
  if (process.env.DISABLE_PORT_CLEANUP === 'true') {
    return;
  }

  const PORT = process.env.PORT || 5002;
  
  // Check if port is in use
  const portInUse = await isPortInUse(PORT);
  if (portInUse) {
    console.log(`Something is already running on port ${PORT}. Probably:`);
    console.log(`  node index.js (pid ${process.pid})`);
    console.log(`  in ${process.cwd()}\n`);
  }
};

// Kill processes on other ports before starting
killOtherProcesses();

// Initialize Firebase Admin SDK
try {
  // Use available Firebase credentials from .env
  admin.initializeApp({
    // Using Google Application Default Credentials method
    // This allows it to work with less configuration
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.warn('Continuing without Firebase Admin SDK. Some features may not work properly.');
}

const app = express();
// Set up WebSocket support
expressWs(app);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5002"],
  credentials: true
}));
app.use(express.json());

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, 'service-marketplace/client/build')));

// Routes
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/vercelAIRoutes'));
app.use('/api/messaging', require('./routes/messagingRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API root route for easy checking
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to the API server',
    endpoints: {
      health: '/api/health',
      ai: '/api/ai',
      messaging: '/api/messaging',
      moderation: '/api/moderation'
    }
  });
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'service-marketplace/client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5002;

// WebSocket endpoint
app.ws("/ws", (ws, req) => {
  console.log("WebSocket connection established");
  
  ws.on("message", (msg) => {
    console.log("Received message:", msg);
    ws.send(JSON.stringify({ status: "received", message: msg }));
  });
  
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 