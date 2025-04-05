const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// GET /api/services/:serviceId - Get service details
router.get('/:serviceId', (req, res) => {
  console.log(`API Service details requested for ID: ${req.params.serviceId}`);
  // Set proper headers
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Only fetch from Firestore - no fallbacks for production
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      console.log('Fetching service data from Firestore');
      const db = admin.firestore();
      db.collection('services').doc(req.params.serviceId).get()
        .then(doc => {
          if (doc.exists) {
            console.log('Service document found in Firestore');
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

module.exports = router; 