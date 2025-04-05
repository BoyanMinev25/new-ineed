const admin = require('firebase-admin');

/**
 * Get all orders for a specific user
 * @param {string} userId - The Firebase UID of the user
 * @returns {Promise<Array>} - A promise that resolves to an array of orders
 */
const getUserOrders = async (userId) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
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
    return [...buyerOrders, ...sellerOrders];
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    throw error;
  }
};

/**
 * Get a specific order by ID
 * @param {string} orderId - The ID of the order to fetch
 * @param {string} userId - The Firebase UID of the user requesting the order
 * @returns {Promise<Object>} - A promise that resolves to the order object
 */
const getOrderById = async (orderId, userId) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }
    
    const db = admin.firestore();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return null;
    }
    
    const order = {
      id: orderDoc.id,
      ...orderDoc.data()
    };
    
    // Check if user has permission to view this order
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new Error('Permission denied');
    }
    
    // Add role to the order data
    order.role = order.buyerId === userId ? 'buyer' : 'seller';
    
    return order;
  } catch (error) {
    console.error(`Error in getOrderById for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Create a new order from an offer
 * @param {string} offerId - The ID of the offer to create an order from
 * @param {string} userId - The Firebase UID of the user creating the order
 * @returns {Promise<Object>} - A promise that resolves to the created order
 */
const createOrderFromOffer = async (offerId, userId) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }
    
    const db = admin.firestore();
    
    // Get the offer details
    const offerDoc = await db.collection('offers').doc(offerId).get();
    
    if (!offerDoc.exists) {
      throw new Error('Offer not found');
    }
    
    const offer = {
      id: offerDoc.id,
      ...offerDoc.data()
    };
    
    // Check if user is the buyer
    if (offer.buyerId !== userId) {
      throw new Error('Permission denied: You are not the buyer of this offer');
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
    const createdOrder = {
      id: orderRef.id,
      ...orderData,
      createdAt: new Date().toISOString() // For immediate response
    };
    
    return createdOrder;
  } catch (error) {
    console.error('Error in createOrderFromOffer:', error);
    throw error;
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  createOrderFromOffer
}; 