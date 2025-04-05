const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// GET /api/offers/:offerId - Get offer details
router.get('/:offerId', (req, res) => {
  // Set proper headers
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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
            return res.status(404).json({ 
              error: 'Offer not found',
              offerId: req.params.offerId
            });
          }
        })
        .catch(error => {
          return res.status(500).json({
            error: 'Error retrieving offer data',
            message: error.message
          });
        });
    } catch (error) {
      return res.status(500).json({
        error: 'Error with Firestore service',
        message: error.message
      });
    }
  } else {
    return res.status(500).json({
      error: 'Firebase service unavailable',
      message: 'Database connection is not configured'
    });
  }
});

module.exports = router; 