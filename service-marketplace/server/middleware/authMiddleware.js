const admin = require('firebase-admin');

/**
 * Authentication middleware
 * Verifies Firebase Authentication token and attaches user info to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying authentication token:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware; 