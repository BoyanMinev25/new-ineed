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
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to be properly formatted (replacing \n with actual newlines)
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.warn('Continuing without Firebase Admin SDK. Some features may not work properly.');
}

const app = express();
// Set up WebSocket support
expressWs(app);

// Middleware for all requests
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5002"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'userid', 'userId', 'Accept']
}));
app.use(express.json());

// Debug incoming requests
app.use((req, res, next) => {
  next();
});

// API request logger middleware - MUST BE FIRST
app.use('/api', (req, res, next) => {
  // Log all API requests with headers and query
  console.log(`🔄 API Request: ${req.method} ${req.originalUrl}`);
  console.log(`🔄 Headers:`, req.headers);
  console.log(`🔄 Query:`, req.query);
  
  // Check for user-id in various formats
  const userIdVariants = [
    req.headers['user-id'],
    req.headers['userid'],
    req.headers['userId'],
    req.query.userId,
    req.query.userid,
    req.query.user_id
  ];
  
  const userId = userIdVariants.find(id => id);
  if (userId) {
    console.log(`🔄 Found user ID in request: ${userId}`);
    // Normalize the user-id header
    req.headers['user-id'] = userId;
  } else {
    console.log(`🔄 No user ID found in request`);
  }
  
  // Ensure all API responses have JSON content-type
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return originalJson.call(this, body);
  };
  
  next();
});

// Direct API tests to check routing
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'API endpoint test successful',
    timestamp: new Date().toISOString()
  });
});

// Direct orders API test
app.get('/api/orders-test', (req, res) => {
  res.status(200).json({ 
    message: 'Orders API endpoint test successful',
    timestamp: new Date().toISOString()
  });
});

// API Routes - Define these BEFORE the static file serving and with explicit path
app.use('/api/ai', require('./routes/vercelAIRoutes'));
app.use('/api/messaging', require('./routes/messagingRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));
app.use('/api/orders', require('./server/routes/orderRoutes'));
app.use('/api/offers', require('./server/routes/offerRoutes'));
app.use('/api/services', require('./server/routes/serviceRoutes'));

// Health check endpoint - Testing API connectivity
app.get('/api/health', (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// API root route for easy checking
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to the API server',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      ai: '/api/ai',
      messaging: '/api/messaging',
      moderation: '/api/moderation',
      orders: '/api/orders'
    }
  });
});

// Add a more specific handler for API routes to prevent them falling through to the SPA handler
// This must be placed AFTER all API routes but BEFORE static file serving
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// IMPORTANT: This must come AFTER all API routes
// Serve static files from the React app's build directory - AFTER API routes
app.use(express.static(path.join(__dirname, 'service-marketplace/client/build')));

// Special handling for /orders URLs - act as a proxy to the API
// This is a fallback in case the client code is making direct /orders requests instead of /api/orders
app.get('/orders', (req, res) => {
  // Capture the original user-id header
  const userId = req.headers['user-id'] || req.query.userId;
  
  console.log('📋 Proxying /orders request with headers:', req.headers);
  console.log('📋 User ID from header:', userId);
  
  // Prepare headers for the forwarded request
  const requestHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  // Add the user-id header if it exists
  if (userId) {
    requestHeaders['user-id'] = userId;
    console.log('📋 Forwarding user-id in proxy request:', userId);
  } else {
    console.log('📋 No user-id found to forward');
  }
  
  // Forward to the API
  const proxyReq = require('http').request(
    {
      host: 'localhost',
      port: PORT,
      path: '/api/orders',
      method: 'GET',
      headers: requestHeaders
    },
    (proxyRes) => {
      // Copy all headers from the API response
      const contentType = proxyRes.headers['content-type'];
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });

      // Ensure content type is set to JSON
      if (!contentType || !contentType.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json');
      }

      // Set additional headers
      res.setHeader('X-Proxied-By', 'API-Proxy');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Send the status code
      res.status(proxyRes.statusCode);
      
      // Pipe the response data
      proxyRes.pipe(res);
    }
  );
  
  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Error proxying to API',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  proxyReq.end();
});

// Special handling for specific order - this must be placed before the catch-all
app.get('/orders/:orderId', (req, res) => {
  // Capture the original user-id header
  const userId = req.headers['user-id'] || req.query.userId;
  
  console.log('📋 Proxying /orders/:orderId request with headers:', req.headers);
  console.log('📋 User ID from header:', userId);
  
  // Prepare headers for the forwarded request
  const requestHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  // Add the user-id header if it exists
  if (userId) {
    requestHeaders['user-id'] = userId;
    console.log('📋 Forwarding user-id in proxy request:', userId);
  } else {
    console.log('📋 No user-id found to forward');
  }
  
  // Forward to the API
  const proxyReq = require('http').request(
    {
      host: 'localhost',
      port: PORT,
      path: `/api/orders/${req.params.orderId}`,
      method: 'GET',
      headers: requestHeaders
    },
    (proxyRes) => {
      // Copy all headers from the API response
      const contentType = proxyRes.headers['content-type'];
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });

      // Ensure content type is set to JSON
      if (!contentType || !contentType.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json');
      }

      // Set additional headers
      res.setHeader('X-Proxied-By', 'API-Proxy');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Send the status code
      res.status(proxyRes.statusCode);
      
      // Pipe the response data
      proxyRes.pipe(res);
    }
  );
  
  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Error proxying to API',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  proxyReq.end();
});

// All other GET requests not handled before will return the React app
// IMPORTANT: This must be placed after ALL API and proxy routes
app.get('*', (req, res) => {
  // Check if the request is for an API endpoint
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  res.sendFile(path.join(__dirname, 'service-marketplace/client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5002;

// WebSocket endpoint
app.ws("/ws", (ws, req) => {
  ws.on("message", (msg) => {
    ws.send(JSON.stringify({ status: "received", message: msg }));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 