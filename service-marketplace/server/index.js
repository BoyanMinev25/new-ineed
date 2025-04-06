// Load environment variables from various locations
try {
  // Try to load from project root first
  require('dotenv').config();
  
  // Then try to load from routes directory
  require('dotenv').config({ path: '../../routes/.env' });
  
  // Finally try to load from server directory
  require('dotenv').config({ path: './.env' });
  
  // Verify critical environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY is still missing after loading all .env files');
    console.warn('Payment functionality may be limited');
  }
} catch (error) {
  console.error('Error loading environment variables:', error);
}

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // In production, we'd have a real service account file
  // For local development, we'll use environment variables
  serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    // Add other required fields as needed
  };
  
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.warn('Application will run with limited functionality');
  // We don't exit - the app can run with limited functionality
}

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Add OPTIONS handling middleware
app.options('*', cors());

// API request logger middleware
app.use('/api', (req, res, next) => {
  // Ensure all API responses have JSON content-type
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return originalJson.call(this, body);
  };
  
  next();
});

// Explicit orders API route to ensure JSON response
app.get('/api/orders', (req, res) => {
  // Set headers to ensure JSON
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // If we have orderRoutes, use the real handler
  if (orderRoutes && orderRoutes.getAllOrders) {
    return orderRoutes.getAllOrders(req, res);
  } else if (orderRoutes && orderRoutes.handle) {
    req.path = '/';
    req.originalUrl = '/api/orders';
    return orderRoutes.handle(req, res);
  }
  
  // No handler available
  return res.status(501).json({
    error: 'Not implemented',
    message: 'Order service is not available',
    timestamp: new Date().toISOString()
  });
});

// Specific order detail API route
app.get('/api/orders/:orderId', (req, res) => {
  // Set headers to ensure JSON
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // If we have orderRoutes, use the real handler
  if (orderRoutes && orderRoutes.getOrderById) {
    return orderRoutes.getOrderById(req, res);
  } else if (orderRoutes && orderRoutes.handle) {
    req.path = `/${req.params.orderId}`;
    req.originalUrl = `/api/orders/${req.params.orderId}`;
    return orderRoutes.handle(req, res);
  }
  
  // No handler available
  return res.status(501).json({
    error: 'Not implemented',
    message: 'Order service is not available',
    timestamp: new Date().toISOString(),
    orderId: req.params.orderId
  });
});

// Routes
// These routes don't exist yet, so commenting them out
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/messaging', require('./routes/messagingRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));
app.use('/api/ai', require('./routes/vercelAIRoutes'));

// Try to load order routes if available
let orderRoutes;
try {
  // Check if STRIPE_SECRET_KEY is available
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY environment variable is not set. Order payments will be disabled.');
    console.warn('Please add STRIPE_SECRET_KEY to your .env file for payment processing.');
  }
  
  // Import routes - this will try to initialize Stripe
  orderRoutes = require('../../routes/orderRoutes');
  
  // Create a direct route for handling create-from-offer
  app.post('/api/orders/create-from-offer', (req, res) => {
    // Check if Firebase admin is initialized
    if (!admin || !admin.apps || admin.apps.length === 0) {
      console.error('❌ Firebase Admin SDK not initialized, cannot access Firestore');
      return res.status(500).json({
        error: 'Database service unavailable',
        message: 'Firebase connection is not configured properly',
        timestamp: new Date().toISOString()
      });
    }
    
    // To ensure we're using the correct handler, bypass orderRoutes.handle and directly call createOrderFromOffer
    try {
      if (orderRoutes && orderRoutes.createOrderFromOffer) {
        return orderRoutes.createOrderFromOffer(req, res);
      } else if (orderRoutes && orderRoutes.handle) {
        // Set the correct path
        req.path = '/create-from-offer';
        req.originalUrl = '/api/orders/create-from-offer';
        
        // Intercept the response
        const originalJson = res.json;
        res.json = function(data) {
          // Ensure data has an order property 
          if (data && !data.order && !data.error) {
            if (Array.isArray(data)) {
              return originalJson.call(this, { 
                error: 'Invalid response format',
                message: 'Order creation resulted in an array instead of an order object'
              });
            }
            
            return originalJson.call(this, { 
              order: data,
              success: true,
              timestamp: new Date().toISOString() 
            });
          }
          
          // Call the original json method
          return originalJson.call(this, data);
        };
        
        return orderRoutes.handle(req, res);
      } else {
        console.error('Order routes handler not available for /create-from-offer');
        return res.status(500).json({
          error: 'Order creation service unavailable',
          message: 'The order creation service is temporarily unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error calling order creation handler:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Create a direct route for checking Stripe configuration
  app.get('/api/orders/check-stripe-config', (req, res) => {
    // Call the orderRoutes handler with specific path
    if (orderRoutes && orderRoutes.checkStripeConfig) {
      return orderRoutes.checkStripeConfig(req, res);
    } else {
      console.error('Stripe config check not available');
      return res.status(503).json({
        status: 'error',
        message: 'Stripe configuration service is unavailable',
        configured: false,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Mount order routes
  app.use('/api/orders', orderRoutes);
} catch (error) {
  console.error('❌ Could not load order routes:', error.message);
  
  // Create a direct route for handling create-from-offer even when orderRoutes failed to load
  app.post('/api/orders/create-from-offer', (req, res) => {
    // Always set content type for consistency
    res.setHeader('Content-Type', 'application/json');
    
    // Try to import only the createOrderFromOffer function to handle this endpoint
    try {
      const { createOrderFromOffer } = require('../../routes/orderRoutes');
      
      // Ensure we're calling the actual function rather than the router
      if (typeof createOrderFromOffer === 'function') {
        return createOrderFromOffer(req, res);
      } else {
        throw new Error('createOrderFromOffer is not a function');
      }
    } catch (err) {
      return res.status(500).json({
        error: 'Order creation service unavailable',
        message: 'The order creation service is currently unavailable. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Create a fallback route for checking Stripe configuration
  app.get('/api/orders/check-stripe-config', (req, res) => {
    // Try to import only the checkStripeConfig function to handle this endpoint
    try {
      const { checkStripeConfig } = require('../../routes/orderRoutes');
      return checkStripeConfig(req, res);
    } catch (err) {
      return res.status(503).json({
        status: 'error',
        message: 'Stripe configuration check unavailable. Please ensure STRIPE_SECRET_KEY is configured.',
        configured: false,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Standalone Stripe configuration check
app.get('/api/stripe/config-check', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({
      status: 'error',
      message: 'Stripe API key is missing',
      configured: false,
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Try to initialize Stripe just for this request
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Make a simple API call to verify it works
    stripe.paymentMethods.list({ limit: 1 })
      .then(() => {
        return res.status(200).json({
          status: 'success',
          message: 'Stripe is properly configured',
          configured: true,
          timestamp: new Date().toISOString()
        });
      })
      .catch(err => {
        console.error('Stripe API call failed:', err);
        return res.status(503).json({
          status: 'error',
          message: `Stripe API error: ${err.message}`,
          configured: false,
          timestamp: new Date().toISOString()
        });
      });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return res.status(503).json({
      status: 'error',
      message: `Stripe initialization error: ${error.message}`,
      configured: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Add offers endpoint to get offer details from offers collection
app.get('/api/offers/:offerId', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Only fetch from Firestore - no fallbacks for production
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      const db = admin.firestore();
      db.collection('offers').doc(req.params.offerId).get()
        .then(doc => {
          if (doc.exists) {
            return res.status(200).json({
              id: doc.id,
              ...doc.data()
            });
          } else {
            console.error(`Offer document not found in Firestore: ${req.params.offerId}`);
            return res.status(404).json({ 
              error: 'Offer not found',
              offerId: req.params.offerId
            });
          }
        })
        .catch(error => {
          console.error('Error fetching offer data from Firestore:', error);
          return res.status(500).json({
            error: 'Error retrieving offer data',
            message: error.message
          });
        });
    } catch (error) {
      console.error('Error with Firestore:', error);
      return res.status(500).json({
        error: 'Error with Firestore service',
        message: error.message
      });
    }
  } else {
    console.error('Firebase Admin not available');
    return res.status(500).json({
      error: 'Firebase service unavailable',
      message: 'Database connection is not configured'
    });
  }
});

// Add direct offers endpoint for offers without /api prefix
app.get('/offers/:offerId', (req, res) => {
  res.redirect(`/api/offers/${req.params.offerId}`);
});

// Add services endpoint to get service details
app.get('/api/services/:serviceId', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Only fetch from Firestore - no fallbacks for production
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      const db = admin.firestore();
      db.collection('ads').doc(req.params.serviceId).get()
        .then(doc => {
          if (doc.exists) {
            return res.status(200).json({
              id: doc.id,
              ...doc.data()
            });
          } else {
            console.error(`Service document not found in Firestore: ${req.params.serviceId}`);
            return res.status(404).json({ 
              error: 'Service not found',
              serviceId: req.params.serviceId
            });
          }
        })
        .catch(error => {
          console.error('Error fetching service data from Firestore:', error);
          return res.status(500).json({
            error: 'Error retrieving service data',
            message: error.message
          });
        });
    } catch (error) {
      console.error('Error with Firestore:', error);
      return res.status(500).json({
        error: 'Error with Firestore service',
        message: error.message
      });
    }
  } else {
    console.error('Firebase Admin not available');
    return res.status(500).json({
      error: 'Firebase service unavailable',
      message: 'Database connection is not configured'
    });
  }
});

// Handle direct /services/:serviceId requests - reroute to API endpoint
app.get('/services/:serviceId', (req, res) => {
  res.redirect(`/api/services/${req.params.serviceId}`);
});

// Catch-all for missing API routes - MUST come before static file serving
app.use('/api/*', (req, res) => {
  console.error(`API 404: ${req.method} ${req.url} - endpoint not found`);
  
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ 
    error: 'API endpoint not found', 
    path: req.path, 
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React build directory - AFTER API routes
app.use(express.static(path.join(__dirname, '../../service-marketplace/client/build')));

// Special handling for /orders URLs - act as a proxy to the API
app.get('/orders', (req, res) => {
  res.redirect('/api/orders');
});

// Special handling for specific order
app.get('/orders/:orderId', (req, res) => {
  res.redirect(`/api/orders/${req.params.orderId}`);
});

// For any other GET request, serve the React app
app.get('*', (req, res) => {
  // This needs to come after all other routes to not interfere with API routes
  res.sendFile(path.join(__dirname, '../../service-marketplace/client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  res.setHeader('Content-Type', 'application/json');
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 