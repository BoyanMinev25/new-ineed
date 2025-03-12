const admin = require('firebase-admin');

/**
 * Admin middleware
 * Verifies the user has admin privileges
 * Should be used after authMiddleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    
    const userId = req.user.uid;
    
    // Check if user has admin role in Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Forbidden: User not found' });
    }
    
    const userData = userDoc.data();
    
    if (!userData.roles || !userData.roles.admin) {
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = adminMiddleware; 