const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/authMiddleware');
const orderService = require('../services/orderService');

// Apply auth middleware to all order routes
router.use(authMiddleware);

// GET /api/orders - Fetch user's orders
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid; // Use authenticated user ID
    console.log(`Fetching orders for user: ${userId}`);
    
    try {
      const orders = await orderService.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Error using orderService:', error);
      
      // Fallback to direct implementation
      if (!admin.apps.length) {
        return res.status(503).json({
          message: 'Database service unavailable',
          success: false
        });
      }
      
      const db = admin.firestore();
      
      // Query orders where the user is either buyer or seller
      const buyerOrdersQuery = db.collection('orders').where('buyerId', '==', userId);
      const sellerOrdersQuery = db.collection('orders').where('sellerId', '==', userId);
      
      // Execute both queries
      const [buyerOrdersSnapshot, sellerOrdersSnapshot] = await Promise.all([
        buyerOrdersQuery.get(),
        sellerOrdersQuery.get()
      ]);
      
      // Process results from both queries
      const buyerOrders = buyerOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'buyer'
      }));
      
      const sellerOrders = sellerOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'seller'
      }));
      
      // Combine all orders
      const orders = [...buyerOrders, ...sellerOrders];
      
      // Return the orders
      res.json(orders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      message: 'Error fetching orders',
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/:orderId - Fetch specific order
router.get('/:orderId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { orderId } = req.params;
    console.log(`Fetching order ${orderId} for user: ${userId}`);
    
    try {
      const order = await orderService.getOrderById(orderId, userId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      if (error.message === 'Permission denied') {
        return res.status(403).json({ error: 'You do not have permission to view this order' });
      }
      
      // Fallback to direct implementation
      if (!admin.apps.length) {
        return res.status(503).json({
          message: 'Database service unavailable',
          success: false
        });
      }
      
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const order = {
        id: orderDoc.id,
        ...orderDoc.data()
      };
      
      // Check if user has permission to view this order
      if (order.buyerId !== userId && order.sellerId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this order' });
      }
      
      // Add role to the order data
      order.role = order.buyerId === userId ? 'buyer' : 'seller';
      
      res.json(order);
    }
  } catch (error) {
    console.error(`Error fetching order ${req.params.orderId}:`, error);
    res.status(500).json({
      message: 'Error fetching order details',
      success: false,
      error: error.message
    });
  }
});

// POST /api/orders/create-from-offer - Create a new order from an offer
router.post('/create-from-offer', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { offerId } = req.body;
    
    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }
    
    try {
      const newOrder = await orderService.createOrderFromOffer(offerId, userId);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error.message.includes('Permission denied')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error.message === 'Offer not found') {
        return res.status(404).json({ error: 'Offer not found' });
      }
      
      // Fallback to direct implementation
      if (!admin.apps.length) {
        return res.status(503).json({
          message: 'Database service unavailable',
          success: false
        });
      }
      
      const db = admin.firestore();
      
      // Get the offer details
      const offerDoc = await db.collection('offers').doc(offerId).get();
      
      if (!offerDoc.exists) {
        return res.status(404).json({ error: 'Offer not found' });
      }
      
      const offer = {
        id: offerDoc.id,
        ...offerDoc.data()
      };
      
      // Check if user is the buyer
      if (offer.buyerId !== userId) {
        return res.status(403).json({ 
          error: 'You are not authorized to create an order from this offer' 
        });
      }
      
      // Create a new order
      const orderData = {
        offerId: offer.id,
        buyerId: offer.buyerId,
        sellerId: offer.sellerId,
        serviceId: offer.serviceId,
        status: 'pending',
        amount: offer.price,
        description: offer.description,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const orderRef = await db.collection('orders').add(orderData);
      
      res.status(201).json({
        id: orderRef.id,
        ...orderData,
        createdAt: new Date().toISOString() // For immediate response
      });
    }
  } catch (error) {
    console.error('Error creating order from offer:', error);
    res.status(500).json({
      message: 'Error creating order',
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/check-stripe-config - Check Stripe configuration
router.get('/check-stripe-config', async (req, res) => {
  try {
    // Check if Stripe is configured
    const stripeConfigured = process.env.STRIPE_SECRET_KEY && 
                             process.env.STRIPE_PUBLISHABLE_KEY;
    
    res.json({
      configured: !!stripeConfigured,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    });
  } catch (error) {
    console.error('Error checking Stripe configuration:', error);
    res.status(500).json({
      message: 'Error checking Stripe configuration',
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 