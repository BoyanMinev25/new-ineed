require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

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
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

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

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../../service-marketplace/client/build')));

// Routes
// These routes don't exist yet, so commenting them out
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/messaging', require('./routes/messagingRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));
app.use('/api/ai', require('./routes/vercelAIRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// For any other GET request, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../service-marketplace/client/build/index.html'));
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 