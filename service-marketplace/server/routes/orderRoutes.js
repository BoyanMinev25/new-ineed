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
    console.log(`Fetching orders for user: ${userId}`);
    // const orders = await orderService.getUserOrders(userId); // Use the service
    // res.json(orders);
    res.json([{ id: 'real-order-1', userId: userId, item: 'Placeholder Item' }]); // Placeholder
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:orderId - Fetch specific order
router.get('/:orderId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { orderId } = req.params;
    console.log(`Fetching order ${orderId} for user: ${userId}`);
    // const order = await orderService.getOrderById(orderId, userId);
    // if (!order) {
    //   return res.status(404).json({ error: 'Order not found' });
    // }
    // res.json(order);
    res.json({ id: orderId, userId: userId, item: 'Placeholder Specific Item' }); // Placeholder
  } catch (error) {
    console.error(`Error fetching order ${req.params.orderId}:`, error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// TODO: Move logic for POST /, PUT /:orderId/status, /create-from-offer, /check-stripe-config here

module.exports = router; 