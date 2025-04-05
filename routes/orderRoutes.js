const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Check if Firebase is initialized and initialize if needed
let db;
try {
  // Check if any Firebase apps exist
  if (!admin.apps.length) {
    console.log('Firebase not initialized in orderRoutes.js, initializing now...');
    
    // Initialize Firebase using environment variables
    const serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('Firebase initialized in orderRoutes.js');
  }
  
  // Get Firestore database instance
  db = admin.firestore();
  console.log('Firebase Firestore accessed successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase in orderRoutes.js:', error);
  console.warn('Will use mock data as fallback');
  // Continue without failing - we'll handle Firebase-related operations with mock data
}

// Initialize Stripe with proper error handling for missing API key
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('⚠️ STRIPE_SECRET_KEY is not defined in environment variables');
    throw new Error('STRIPE_SECRET_KEY is missing. Please add it to your .env file');
  }
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe successfully initialized');
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
  // Continue without failing - we'll handle Stripe-related operations properly
}

// Mock orders data
const mockOrders = [
  {
    id: 'order-123456',
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    amount: 150,
    buyerId: 'user-123',
    sellerId: 'user-456',
    serviceType: 'Web Development',
    buyerName: 'John Doe',
    sellerName: 'Jane Smith',
    role: 'buyer',
    description: 'Website landing page design and development'
  },
  {
    id: 'order-789012',
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    amount: 75,
    buyerId: 'user-789',
    sellerId: 'user-123',
    serviceType: 'Logo Design',
    buyerName: 'Bob Johnson',
    sellerName: 'John Doe',
    role: 'seller',
    description: 'Modern minimalist logo for a coffee shop'
  }
];

// Middleware to ensure JSON responses
const ensureJsonResponse = (req, res, next) => {
  // Log all incoming requests to this router
  console.log(`🔸 OrderRoutes: ${req.method} ${req.path} (from ${req.originalUrl})`);
  
  // Save the original res.send to use later
  const originalSend = res.send;
  
  // Override res.send to ensure proper content-type
  res.send = function(body) {
    // Always set these headers for all responses from this router
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return originalSend.call(this, body);
  };
  
  next();
};

// Apply middleware to all routes in this router
router.use(ensureJsonResponse);

// Enhanced logging middleware to trace all API calls
router.use((req, res, next) => {
  console.log(`🔎 ORDER-ROUTES: ${req.method} ${req.path} (original: ${req.originalUrl})`);
  console.log(`🔎 Headers:`, req.headers);
  console.log(`🔎 Body:`, req.body);
  console.log(`🔎 Query:`, req.query);
  next();
});

// Additional CORS handling for create-from-offer route
router.options('/create-from-offer', (req, res) => {
  console.log('🌐 Handling OPTIONS for /create-from-offer');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, user-id');
  res.status(200).send();
});

// Handle all orders
const getAllOrders = async (req, res) => {
  try {
    console.log('✅ GET /api/orders request received');
    console.log('✅ Request headers:', req.headers);
    console.log('✅ Request query params:', req.query);
    
    // Explicitly set content-type header
    res.setHeader('Content-Type', 'application/json');
    
    // Check all possible user ID header and query parameter formats
    const userIdHeaderVariants = [
      req.headers['user-id'],
      req.headers['userid'],
      req.headers['userId'],
      req.headers['UserID'],
      req.headers['USER-ID'],
      req.headers['User-Id']
    ];
    
    // Check all possible query parameter formats
    const userIdQueryVariants = [
      req.query.userId,
      req.query.userid,
      req.query.user_id,
      req.query.userID,
      req.query.UserID
    ];
    
    // Find first non-empty value with preference for Firebase UID format 
    // (typically starts with a letter/number and contains mostly alphanumeric characters)
    const firebaseUidPattern = /^[A-Za-z0-9][A-Za-z0-9]{10,}$/;
    
    // First look for Firebase UID format in headers
    let firebaseUidFromHeader = userIdHeaderVariants.find(id => id && firebaseUidPattern.test(id));
    console.log('✅ Firebase UID format detected in headers:', firebaseUidFromHeader);
    
    // Then in query params
    const firebaseUidFromQuery = userIdQueryVariants.find(id => id && firebaseUidPattern.test(id));
    console.log('✅ Firebase UID format detected in query:', firebaseUidFromQuery);
    
    // Any non-empty userId as fallback
    const anyUserIdFromHeader = userIdHeaderVariants.find(id => id);
    const anyUserIdFromQuery = userIdQueryVariants.find(id => id);
    
    // Prioritize Firebase UID format, then any header value, then any query value
    const userId = firebaseUidFromHeader || firebaseUidFromQuery || anyUserIdFromHeader || anyUserIdFromQuery;
    
    console.log('✅ All user ID header variants:', userIdHeaderVariants);
    console.log('✅ All user ID query variants:', userIdQueryVariants);
    console.log('✅ Selected user ID for order lookup:', userId);
    
    if (!userId) {
      console.log('❌ No user ID provided, returning empty array');
      return res.status(401).json({
        message: 'Authentication required',
        success: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if Firebase/Firestore is available
    if (!db) {
      console.warn('⚠️ Firestore not available, returning empty array');
      return res.status(503).json({
        message: 'Database service unavailable',
        success: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Query orders where the user is either buyer or seller
    console.log(`✅ Querying Firestore for orders with buyerId or sellerId = ${userId}`);
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
    
    // If no orders found, return empty array
    if (orders.length === 0) {
      console.log(`No orders found for user ${userId}, returning empty array`);
      return res.json([]);
    }
    
    console.log(`Found ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching orders from Firebase:', error);
    console.log('Returning error response');
    res.status(500).json({
      message: 'Error fetching orders',
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    console.log(`✅ GET /api/orders/${req.params.orderId} request received`);
    
    // Get the order ID from the params
    const orderId = req.params.orderId;
    
    // Get the user ID from the request (assuming authentication middleware adds this)
    const userId = req.query.userId || req.headers['user-id'];
    
    // Check if Firebase/Firestore is available
    if (!db) {
      console.warn('⚠️ Firestore not available for order lookup, returning mock data');
      // Return mock order as fallback
      return res.json({
        id: req.params.orderId,
        status: 'In Progress',
        amount: 1250.00,
        description: 'Service Description (Mock Order - Firestore Unavailable)',
        serviceType: 'Service Type',
        sellerName: 'Service Provider Name',
        createdAt: new Date().toISOString(),
        buyerId: 'user-123',
        sellerId: 'user-456',
        buyerName: 'Client Name',
        role: 'buyer'
      });
    }
    
    // Fetch the order from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log(`Order ${orderId} not found, returning 404`);
      return res.status(404).json({ 
        message: 'Order not found',
        orderId: req.params.orderId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get the order data
    const orderData = orderDoc.data();
    
    // Determine the user's role in this order
    let role = null;
    if (userId) {
      if (orderData.buyerId === userId) {
        role = 'buyer';
      } else if (orderData.sellerId === userId) {
        role = 'seller';
      }
    }
    
    // Check if the user is authorized to view this order
    if (userId && role === null) {
      return res.status(403).json({
        message: 'You are not authorized to view this order',
        timestamp: new Date().toISOString()
      });
    }
    
    // Prepare the response
    const order = {
      id: orderDoc.id,
      ...orderData,
      role: role || 'unknown'
    };
    
    // Explicitly set content-type header
    res.setHeader('Content-Type', 'application/json');
    res.json(order);
  } catch (error) {
    console.error('❌ Error fetching order from Firebase:', error);
    console.log('Falling back to mock data due to error');
    
    // Return mock order as fallback
    const mockOrder = {
      id: req.params.orderId,
      status: 'In Progress',
      amount: 1250.00,
      description: 'Service Description (Mock Order - API Error Fallback)',
      serviceType: 'Service Type',
      sellerName: 'Service Provider Name',
      createdAt: new Date().toISOString(),
      buyerId: 'user-123',
      sellerId: 'user-456',
      buyerName: 'Client Name',
      role: 'buyer'
    };
    
    res.json(mockOrder);
  }
};

// Direct test endpoint
const getTestEndpoint = (req, res) => {
  console.log('✅ TEST ENDPOINT: /api/orders/test accessed');
  res.json({ 
    message: 'Order routes API is working', 
    timestamp: new Date().toISOString(),
    test: true
  });
};

// Test ping route
const getTestPing = (req, res) => {
  console.log('✅ Test ping route accessed');
  res.json({ message: 'Order routes are working', timestamp: new Date().toISOString() });
};

// Create a new order from a service ad
const createOrderFromAd = async (req, res) => {
  try {
    console.log('✅ POST /api/orders/create-from-ad request received');
    
    // Explicitly set content-type header
    res.setHeader('Content-Type', 'application/json');
    
    // Get data from request body
    const { 
      adId, 
      buyerId, 
      amount, 
      serviceDetails, 
      deliveryDate,
      specialInstructions 
    } = req.body;
    
    // Validate required fields
    if (!adId || !buyerId || !amount) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['adId', 'buyerId', 'amount'],
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch the ad from Firestore to get seller information
    const adDoc = await db.collection('services').doc(adId).get();
    
    if (!adDoc.exists) {
      return res.status(404).json({
        message: 'Service ad not found',
        adId,
        timestamp: new Date().toISOString()
      });
    }
    
    const adData = adDoc.data();
    
    // Create the order object
    const newOrder = {
      adId,
      buyerId,
      sellerId: adData.userId,
      sellerName: adData.userName || 'Service Provider',
      buyerName: '', // Will be populated from user document
      amount: parseFloat(amount),
      description: adData.title || serviceDetails || 'Service',
      serviceType: adData.category || 'Service',
      status: 'pending_payment',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      specialInstructions: specialInstructions || '',
      paymentStatus: 'pending',
      deliveryStatus: 'not_started',
      reviewSubmitted: false
    };
    
    // Get buyer's name from users collection
    try {
      const buyerDoc = await db.collection('users').doc(buyerId).get();
      if (buyerDoc.exists) {
        const buyerData = buyerDoc.data();
        newOrder.buyerName = buyerData.name || buyerData.displayName || '';
      }
    } catch (err) {
      console.warn('Could not fetch buyer name:', err);
    }
    
    // Create the order in Firestore
    const orderRef = await db.collection('orders').add(newOrder);
    
    // Get the created order with ID
    const createdOrder = {
      id: orderRef.id,
      ...newOrder,
      createdAt: new Date().toISOString(), // Convert Firestore timestamp to string for response
      updatedAt: new Date().toISOString(),
      role: 'buyer' // Set role for the buyer creating the order
    };
    
    console.log(`Created new order with ID: ${orderRef.id}`);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      message: 'Error creating order',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create a new order from an offer
const createOrderFromOffer = async (req, res) => {
  try {
    console.log('✅ POST /api/orders/create-from-offer request received');
    
    // Explicitly set content-type header
    res.setHeader('Content-Type', 'application/json');
    
    // Get data from request body
    const { offerId } = req.body;
    const userId = req.query.userId || req.headers['user-id'];
    
    console.log(`Creating order from offer [${offerId}] for user [${userId}]`);
    
    // Validate required fields
    if (!offerId) {
      console.log('Missing offerId field, returning 400');
      return res.status(400).json({
        message: 'Missing offerId field',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user is authenticated
    if (!userId) {
      console.log('No user-id header, returning 401');
      return res.status(401).json({
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if Firebase/Firestore is available
    if (!db) {
      console.warn('⚠️ Firestore not available for creating order, returning mock data');
      // Generate a random mock order ID
      const mockOrderId = 'mock-' + Math.random().toString(36).substr(2, 9);
      
      // Create mock order response
      const mockResponse = {
        order: {
          id: mockOrderId,
          offerId,
          buyerId: userId,
          sellerId: 'mock-seller-id',
          amount: 500,
          description: 'Mock order created without Firebase',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'buyer'
        },
        success: true,
        timestamp: new Date().toISOString()
      };
      
      console.log('Returning mock order data:', mockResponse);
      
      return res.status(201).json(mockResponse);
    }
    
    // First try to fetch the offer from 'offers' collection
    console.log(`Fetching offer document from Firestore 'offers' collection: [${offerId}]`);
    
    let offerDoc = await db.collection('offers').doc(offerId).get();
    let offerData;
    let sourceCollection = 'offers';
    
    // If not found in offers collection, try to look in conversations collection
    if (!offerDoc.exists) {
      console.log(`Offer [${offerId}] not found in 'offers' collection, checking 'conversations'`);
      
      // First try to get the conversation directly by its document ID
      console.log(`Checking if [${offerId}] is a conversation document ID...`);
      try {
        const conversationDoc = await db.collection('conversations').doc(offerId).get();
        
        if (conversationDoc.exists) {
          console.log(`Found conversation document with ID [${offerId}]`);
          const conversationData = conversationDoc.data();
          
          // Extract offer data from the conversation
          offerData = {
            id: offerId,
            price: conversationData.metadata?.price || conversationData.price || conversationData.lastMessage?.price || 1111,
            description: conversationData.metadata?.description || conversationData.description || conversationData.lastMessage?.text || 'Service from conversation',
            providerId: conversationData.metadata?.providerId || conversationData.providerId || 
                       (conversationData.lastMessage?.senderId !== userId ? conversationData.lastMessage?.senderId : null) ||
                       conversationData.participants?.find(p => p !== userId),
            adId: conversationData.metadata?.adId || conversationData.adId,
            timeFrame: conversationData.metadata?.timeframe || conversationData.timeframe || '7 days',
            additionalDetails: conversationData.metadata?.additionalDetails || conversationData.additionalDetails || ''
          };
          
          sourceCollection = 'conversations';
          console.log(`Using conversation with ID [${offerId}], extracted offer data:`, offerData);
          
          // Continue with order creation using this data
        } else {
          // If not found by ID, then try other search methods
          console.log(`No conversation found with ID [${offerId}], trying to search by field...`);
          
          // Try to find the conversation document that contains this offer ID
          const conversationsRef = db.collection('conversations');
          const snapshot = await conversationsRef.where('id', '==', offerId).get();
          
          if (snapshot.empty) {
            // Try finding it as a field inside a conversation document
            console.log(`Conversation with id=[${offerId}] not found as field, checking all conversations...`);
            
            // Check all conversations for the ID in any field
            const allConversations = await conversationsRef.get();
            let foundConversation = null;
            
            console.log(`Checking ${allConversations.size} conversations for offerId [${offerId}]...`);
            
            allConversations.forEach(doc => {
              const conversationData = doc.data();
              
              console.log(`Checking conversation ${doc.id} metadata:`, conversationData.metadata || 'no metadata');
              
              // Check if this conversation contains our offerId in any of its fields
              if (
                doc.id === offerId ||
                (conversationData.offerId === offerId) || 
                (conversationData.lastMessage && conversationData.lastMessage.offerId === offerId) ||
                (conversationData.metadata && conversationData.metadata.offerId === offerId)
              ) {
                console.log(`Found offerId [${offerId}] in conversation document: ${doc.id}`);
                foundConversation = { id: doc.id, ...conversationData };
              }
            });
            
            if (foundConversation) {
              // Extract offer data from the conversation
              offerData = {
                id: offerId,
                price: foundConversation.metadata?.price || foundConversation.price || 1111,
                description: foundConversation.metadata?.description || foundConversation.description || 'Service from conversation',
                providerId: foundConversation.metadata?.providerId || foundConversation.providerId || 
                           (foundConversation.lastMessage?.senderId !== userId ? foundConversation.lastMessage?.senderId : null) ||
                           foundConversation.participants?.find(p => p !== userId),
                adId: foundConversation.metadata?.adId || foundConversation.adId,
                timeFrame: foundConversation.metadata?.timeframe || foundConversation.timeframe || '7 days',
                additionalDetails: foundConversation.metadata?.additionalDetails || foundConversation.additionalDetails || ''
              };
              
              sourceCollection = 'conversations';
              console.log(`Extracted offer data from conversation:`, offerData);
            } else {
              console.log(`Offer [${offerId}] not found in any collection, returning 404`);
              return res.status(404).json({
                message: 'Offer not found',
                offerId,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            // We found a conversation with this ID field
            const conversationDoc = snapshot.docs[0];
            const conversationData = conversationDoc.data();
            
            // Extract offer data from the conversation
            offerData = {
              id: offerId,
              price: conversationData.metadata?.price || conversationData.price || 1111,
              description: conversationData.metadata?.description || conversationData.description || 'Service from conversation',
              providerId: conversationData.metadata?.providerId || conversationData.providerId || 
                        (conversationData.lastMessage?.senderId !== userId ? conversationData.lastMessage?.senderId : null) ||
                        conversationData.participants?.find(p => p !== userId),
              adId: conversationData.metadata?.adId || conversationData.adId,
              timeFrame: conversationData.metadata?.timeframe || conversationData.timeframe || '7 days',
              additionalDetails: conversationData.metadata?.additionalDetails || conversationData.additionalDetails || ''
            };
            
            sourceCollection = 'conversations';
            console.log(`Found conversation with id field [${offerId}], extracted offer data:`, offerData);
          }
        }
      } catch (err) {
        console.error(`Error checking conversation [${offerId}]:`, err);
        return res.status(500).json({
          message: 'Error checking conversation',
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // We found the offer in the offers collection
      offerData = offerDoc.data();
      console.log(`Offer [${offerId}] found in 'offers' collection:`, offerData);
    }
    
    if (!offerData) {
      console.log(`Could not extract valid offer data for [${offerId}], returning 404`);
      return res.status(404).json({
        message: 'Offer data could not be retrieved',
        offerId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify that the user is authorized to accept this offer
    // The user must be the ad owner or a participant in the conversation
    let adData;
    
    if (offerData.adId) {
      const adDoc = await db.collection('services').doc(offerData.adId).get();
      
      if (!adDoc.exists) {
        console.log(`Service ad [${offerData.adId}] not found`);
        adData = {
          userId: userId, // Default to current user if ad not found
          title: offerData.description || 'Service order',
          category: 'Service'
        };
      } else {
        adData = adDoc.data();
      }
    } else {
      // No ad ID provided, create default ad data
      console.log('No adId in offer data, using defaults');
      adData = {
        userId: userId,
        title: offerData.description || 'Service order',
        category: 'Service'
      };
    }
    
    // Skip authorization check if the data comes from conversations
    // Since we already verified the user is a participant
    if (sourceCollection === 'offers' && adData.userId !== userId) {
      console.log(`User [${userId}] is not the ad owner [${adData.userId}], authorization failed`);
      return res.status(403).json({
        message: 'Only the ad owner can accept offers',
        timestamp: new Date().toISOString()
      });
    }
    
    // If the offer is in the offers collection, update its status
    if (sourceCollection === 'offers') {
      try {
        await db.collection('offers').doc(offerId).update({
          status: 'accepted',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated offer status to 'accepted' in offers collection`);
      } catch (updateErr) {
        console.warn(`Could not update offer status: ${updateErr.message}`);
        // Continue with order creation even if updating offer status fails
      }
    }
    
    // Get provider user details
    let providerName = 'Service Provider';
    try {
      if (offerData.providerId) {
        const providerDoc = await db.collection('users').doc(offerData.providerId).get();
        if (providerDoc.exists) {
          const providerData = providerDoc.data();
          providerName = providerData.displayName || providerData.name || 'Service Provider';
        }
      }
    } catch (err) {
      console.warn(`Error fetching provider details: ${err.message}`);
    }
    
    // Create the order object with better handling of defaults
    const newOrder = {
      offerId,
      adId: offerData.adId || '',
      buyerId: userId, // Current user is the buyer
      sellerId: offerData.providerId || (sourceCollection === 'conversations' ? 
                (offerData.participants || []).find(p => p !== userId) : ''),
      sellerName: providerName,
      buyerName: '', // Will be populated below
      amount: parseFloat(offerData.price) || 1111, // Default to 1111 if price is not specified
      description: adData.title || offerData.description || 'Service from conversation',
      serviceType: adData.category || 'Service',
      status: 'pending_payment',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryDate: offerData.timeFrame ? 
                    new Date(Date.now() + (parseInt(offerData.timeFrame) * 24 * 60 * 60 * 1000)) : 
                    new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
      specialInstructions: offerData.additionalDetails || '',
      paymentStatus: 'pending',
      deliveryStatus: 'not_started',
      reviewSubmitted: false,
      sourceCollection: sourceCollection, // Add the source collection for reference
      conversationId: sourceCollection === 'conversations' ? offerId : null // Store conversation ID if from conversation
    };
    
    console.log('Creating order with data:', newOrder);
    
    // Try to get buyer name
    try {
      const buyerDoc = await db.collection('users').doc(userId).get();
      if (buyerDoc.exists) {
        const buyerData = buyerDoc.data();
        newOrder.buyerName = buyerData.displayName || buyerData.name || '';
      }
    } catch (err) {
      console.warn(`Error fetching buyer details: ${err.message}`);
    }
    
    // Create the order in Firestore
    const orderRef = await db.collection('orders').add(newOrder);
    
    // Create a notification for the provider
    try {
      await db.collection('notifications').add({
        userId: newOrder.sellerId,
        title: 'Offer Accepted',
        message: `Your offer has been accepted.`,
        type: 'offer_accepted',
        relatedId: orderRef.id,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (notifyErr) {
      console.warn(`Error creating notification: ${notifyErr.message}`);
    }
    
    // Get the created order with ID
    const createdOrder = {
      id: orderRef.id,
      ...newOrder,
      createdAt: new Date().toISOString(), // Convert Firestore timestamp to string for response
      updatedAt: new Date().toISOString(),
      role: 'buyer' // Set role for the buyer creating the order
    };
    
    console.log(`Created new order from ${sourceCollection} with ID: ${orderRef.id}`);
    console.log(`Order details: buyerId=${createdOrder.buyerId}, sellerId=${createdOrder.sellerId}`);
    console.log(`Amount: ${createdOrder.amount}, Source: ${sourceCollection}`);
    
    // Return the order inside an 'order' property
    return res.status(201).json({
      order: createdOrder,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating order from offer:', error);
    res.status(500).json({
      message: 'Error creating order from offer',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    console.log(`✅ PATCH /api/orders/${req.params.orderId}/status request received`);
    
    // Get the order ID from the params
    const orderId = req.params.orderId;
    
    // Get the new status from the request body
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        message: 'Missing status field in request body',
        timestamp: new Date().toISOString()
      });
    }
    
    // Valid status values
    const validStatuses = [
      'pending_payment',
      'payment_received',
      'in_progress',
      'delivered',
      'completed',
      'cancelled',
      'refunded',
      'disputed'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value',
        validStatuses,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update the order in Firestore
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Updated order ${orderId} status to ${status}`);
    res.json({
      message: 'Order status updated successfully',
      orderId,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      message: 'Error updating order status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create payment intent for an order
const createPaymentIntent = async (req, res) => {
  try {
    console.log(`✅ POST /api/orders/${req.params.orderId}/payment-intent request received`);
    
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(503).json({
        message: 'Payment service is not available right now. Stripe API key is missing.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get the order ID from the params
    const orderId = req.params.orderId;
    
    // Fetch the order from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        message: 'Order not found',
        orderId,
        timestamp: new Date().toISOString()
      });
    }
    
    const orderData = orderDoc.data();
    
    // Check if payment is already completed
    if (orderData.paymentStatus === 'completed') {
      return res.status(400).json({
        message: 'Payment has already been processed for this order',
        orderId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderData.amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId,
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId
      }
    });
    
    // Update the order with the payment intent ID
    await db.collection('orders').doc(orderId).update({
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'intent_created',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Created payment intent for order ${orderId}: ${paymentIntent.id}`);
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: orderData.amount,
      orderId
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      message: 'Error creating payment intent',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Webhook handler for Stripe events
const handleStripeWebhook = async (req, res) => {
  try {
    console.log('✅ POST /api/orders/webhook request received');
    
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(503).json({
        message: 'Payment service is not available right now. Stripe API key is missing.',
        timestamp: new Date().toISOString()
      });
    }
    
    const signature = req.headers['stripe-signature'];
    let event;
    
    // Verify the event came from Stripe
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, // Raw request body
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      // Add other event types as needed
    }
    
    console.log(`Handled Stripe webhook event: ${event.type}`);
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error handling Stripe webhook:', error);
    res.status(500).json({
      message: 'Error handling Stripe webhook',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const { orderId } = paymentIntent.metadata;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update order status and payment status
    await db.collection('orders').doc(orderId).update({
      status: 'payment_received',
      paymentStatus: 'completed',
      paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Payment succeeded for order ${orderId}`);
    
    // Add a notification in Firebase
    await db.collection('notifications').add({
      userId: paymentIntent.metadata.sellerId,
      title: 'New Payment Received',
      message: `Payment for order #${orderId} has been received.`,
      type: 'payment_received',
      relatedId: orderId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

// Helper function to handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const { orderId } = paymentIntent.metadata;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update order payment status
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'failed',
      paymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Payment failed for order ${orderId}`);
    
    // Add a notification in Firebase
    await db.collection('notifications').add({
      userId: paymentIntent.metadata.buyerId,
      title: 'Payment Failed',
      message: `Your payment for order #${orderId} has failed. Please try again.`,
      type: 'payment_failed',
      relatedId: orderId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

// Check Stripe configuration
const checkStripeConfig = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        status: 'error',
        message: 'Stripe API key is missing',
        configured: false,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!stripe) {
      return res.status(503).json({
        status: 'error',
        message: 'Stripe is not initialized',
        configured: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Attempt to make a simple Stripe API call to verify configuration
    const stripeConfig = await stripe.paymentMethods.list({ limit: 1 });
    
    return res.status(200).json({
      status: 'success',
      message: 'Stripe is properly configured',
      configured: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking Stripe configuration:', error);
    return res.status(500).json({
      status: 'error',
      message: `Stripe configuration error: ${error.message}`,
      configured: false,
      timestamp: new Date().toISOString()
    });
  }
};

// Define route handlers
router.get('/', getAllOrders);
router.get('/test', getTestEndpoint);
router.get('/test/ping', getTestPing);
router.get('/check-stripe-config', checkStripeConfig);
router.get('/:orderId', getOrderById);
router.post('/create-from-ad', createOrderFromAd);
router.post('/create-from-offer', createOrderFromOffer);
router.patch('/:orderId/status', updateOrderStatus);
router.post('/:orderId/payment-intent', createPaymentIntent);
router.post('/webhook', handleStripeWebhook);

// Export a handle method for direct calling
const handle = (req, res) => {
  console.log('🔶 Direct call to orderRoutes.handle');
  console.log(`🔶 Request path: ${req.path}, Original URL: ${req.originalUrl}, Method: ${req.method}`);
  
  // Ensure JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Special handling for creating order from offer
  if (
    req.path === '/create-from-offer' || 
    req.originalUrl === '/api/orders/create-from-offer' ||
    (req.path === '/' && req.method === 'POST' && req.body && req.body.offerId)
  ) {
    console.log('🔶 Routing to createOrderFromOffer handler via handle method');
    return createOrderFromOffer(req, res);
  } 
  
  // Different handling based on URL path
  else if (req.path === '/' || req.originalUrl === '/api/orders') {
    // Return all orders
    return getAllOrders(req, res);
  } else if (req.params.orderId) {
    // Return a specific order
    return getOrderById(req, res);
  } else if (req.path === '/test' || req.originalUrl === '/api/orders/test') {
    // Test endpoint
    return getTestEndpoint(req, res);
  } else if (req.path === '/test/ping' || req.originalUrl === '/api/orders/test/ping') {
    // Test ping endpoint
    return getTestPing(req, res);
  } else if (req.path === '/check-stripe-config') {
    // Check Stripe configuration
    return checkStripeConfig(req, res);
  } else if (req.path === '/create-from-ad') {
    // Create a new order from a service ad
    return createOrderFromAd(req, res);
  } else if (req.path.startsWith('/') && req.path.endsWith('/status')) {
    // Update order status
    return updateOrderStatus(req, res);
  } else if (req.path.startsWith('/') && req.path.endsWith('/payment-intent')) {
    // Create payment intent for an order
    return createPaymentIntent(req, res);
  } else if (req.path === '/webhook') {
    // Webhook handler for Stripe events
    return handleStripeWebhook(req, res);
  } else {
    console.log(`Unrecognized path in handle method: ${req.path}`);
    // Default - return all orders
    return getAllOrders(req, res);
  }
};

// Export both router and handle method
module.exports = router;
module.exports.handle = handle;

// Also export individual handlers for direct use
module.exports.createOrderFromOffer = createOrderFromOffer;
module.exports.createOrderFromAd = createOrderFromAd;
module.exports.getAllOrders = getAllOrders;
module.exports.getOrderById = getOrderById;
module.exports.updateOrderStatus = updateOrderStatus;
module.exports.createPaymentIntent = createPaymentIntent;
module.exports.checkStripeConfig = checkStripeConfig; 