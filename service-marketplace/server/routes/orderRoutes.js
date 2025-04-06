const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
// const orderService = require('../services/orderService'); // To be created

// Apply auth middleware to all order routes
router.use(authMiddleware);

// GET /api/orders - Fetch user's orders
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid; // Use authenticated user ID
    
    // Service not implemented yet
    return res.status(501).json({ 
      error: 'Not implemented',
      message: 'Order service is not available yet'
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// GET /api/orders/:orderId - Fetch specific order
router.get('/:orderId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { orderId } = req.params;
    
    // Service not implemented yet
    return res.status(501).json({ 
      error: 'Not implemented',
      message: 'Order service is not available yet'
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch order details',
      message: error.message
    });
  }
});

// TODO: Move logic for POST /, PUT /:orderId/status, /create-from-offer, /check-stripe-config here

module.exports = router; 