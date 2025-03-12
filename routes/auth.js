const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Route to verify Firebase token and confirm a user is authenticated
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Check if Firebase Auth is properly initialized
    if (!admin.auth) {
      console.warn('Firebase Auth not initialized properly');
      // For development, you can bypass authentication
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ 
          authenticated: true, 
          uid: 'development-user',
          message: 'Development mode: Authentication bypassed'
        });
      } else {
        return res.status(503).json({ message: 'Authentication service unavailable' });
      }
    }
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    return res.status(200).json({ 
      authenticated: true,
      uid: uid,
      message: 'Successfully authenticated'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // For development purposes, you can bypass authentication errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Bypassing authentication error');
      return res.status(200).json({
        authenticated: true,
        uid: 'development-user',
        message: 'Development mode: Authentication bypassed due to error',
        error: error.message
      });
    }
    
    res.status(401).json({ 
      authenticated: false,
      message: 'Authentication failed',
      error: error.message 
    });
  }
});

// Development-only route for testing without authentication
if (process.env.NODE_ENV === 'development') {
  router.get('/dev-login', (req, res) => {
    res.status(200).json({
      authenticated: true,
      uid: 'development-user',
      message: 'Development login successful'
    });
  });
}

module.exports = router; 