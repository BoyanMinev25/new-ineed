import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import routes from '../integration/navigation/routes';
import { createStripePaymentIntent } from '../lib/stripe-utils';
import { uploadOrderFile } from '../lib/storage-utils';
import orderPaymentsAuth from '../integration/auth/orderPaymentsAuth';

// Types for upload result from storage-utils
interface UploadResult {
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  path: string;
}

// Types for orders
interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  price: {
    subtotal: number;
    fees: number;
    taxes: number;
    total: number;
    currency: string;
  };
  buyerId: string;
  sellerId: string;
  adId?: string;
  offerId?: string;
  title: string;
  description?: string;
  items?: OrderItem[];
  paymentIntentId?: string;
  deliveryInstructions?: string;
  deliveryFiles?: FileData[];
  messages?: OrderMessage[];
  revisionRequests?: RevisionRequest[];
  sourceCollection?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadDate?: string | Date;
  status?: 'uploading' | 'complete' | 'error';
}

interface OrderMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  content: string;
  timestamp: Date | string;
  attachmentFiles?: FileData[];
  isRead: boolean;
}

interface RevisionRequest {
  id: string;
  requesterId: string;
  requesterRole: 'buyer' | 'seller';
  description: string;
  timestamp: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  responseMessage?: string;
}

// Context interface
interface OrdersContextInterface {
  orders: Order[];
  buyerOrders: Order[];
  sellerOrders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<Order>;
  createOrderFromAd: (adId: string, details: OrderDetails) => Promise<Order>;
  createOrderFromOffer: (offerId: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  createPaymentForOrder: (orderId: string) => Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }>;
  confirmPayment: (paymentIntentId: string, orderId: string) => Promise<void>;
  cancelPayment: (paymentIntentId: string, orderId: string) => Promise<void>;
  submitDelivery: (orderId: string, files: File[], message: string) => Promise<void>;
  requestRevision: (orderId: string, description: string) => Promise<void>;
  approveDelivery: (orderId: string) => Promise<void>;
  rejectDelivery: (orderId: string, reason: string) => Promise<void>;
  sendOrderMessage: (orderId: string, message: string, attachments?: File[]) => Promise<void>;
  markOrderMessageAsRead: (orderId: string, messageId: string) => Promise<void>;
  getOrderMessages: (orderId: string) => Promise<OrderMessage[]>;
}

// Order details interface
interface OrderDetails {
  deliveryInstructions?: string;
  specialRequirements?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentIntentId?: string;
}

// Default context implementation
const defaultContext: OrdersContextInterface = {
  orders: [],
  buyerOrders: [],
  sellerOrders: [],
  loading: false,
  error: null,
  fetchOrders: async () => {},
  fetchOrderById: async () => ({ 
    id: '',
    status: '',
    paymentStatus: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      subtotal: 0,
      fees: 0,
      taxes: 0,
      total: 0,
      currency: 'USD'
    },
    buyerId: '',
    sellerId: '',
    title: ''
  }),
  createOrderFromAd: async () => ({ 
    id: '',
    status: '',
    paymentStatus: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      subtotal: 0,
      fees: 0,
      taxes: 0,
      total: 0,
      currency: 'USD'
    },
    buyerId: '',
    sellerId: '',
    title: ''
  }),
  createOrderFromOffer: async () => ({ 
    id: '',
    status: '',
    paymentStatus: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      subtotal: 0,
      fees: 0,
      taxes: 0,
      total: 0,
      currency: 'USD'
    },
    buyerId: '',
    sellerId: '',
    title: ''
  }),
  updateOrderStatus: async () => {},
  createPaymentForOrder: async () => ({ clientSecret: '', paymentIntentId: '' }),
  confirmPayment: async () => {},
  cancelPayment: async () => {},
  submitDelivery: async () => {},
  requestRevision: async () => {},
  approveDelivery: async () => {},
  rejectDelivery: async () => {},
  sendOrderMessage: async () => {},
  markOrderMessageAsRead: async () => {},
  getOrderMessages: async () => []
};

// Create the context
export const OrdersContext = createContext<OrdersContextInterface>(defaultContext);

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Get the current user ID from the auth integration
const getCurrentUserId = (): string | null => {
  // Get the current user ID from the auth integration
  const userId = orderPaymentsAuth.getCurrentUserRoleId();

  if (userId) {
    return userId;
  }
  
  // If we can't get a user ID from auth, return null
  return null;
};

// Provider component
export const OrdersProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(getCurrentUserId());
  
  // Update the user ID if authentication changes
  useEffect(() => {
    // Re-check the current user ID whenever the component mounts
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Helper function to call API with error handling
  const callApi = async (endpoint: string, options: any = {}) => {
    try {
      // Get the latest user ID - it might have changed since component mounted
      const userId = getCurrentUserId();
      
      // If no user ID, throw an error - we shouldn't proceed with API calls
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      // Add user ID to headers for authentication
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId, // Add user ID to all API calls (now we know it's not null)
        'userId': userId,   // Add alternate formats that the server might check
        'userid': userId,    // Add alternate formats that the server might check
        'uid': userId       // Add uid format that matches Firebase field name
      };
      
      // Combine options with headers
      const mergedOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...headers
        }
      };
      
      // Make the API call
      const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
      
      // If response is not ok (status outside 200-299), throw error
      if (!response.ok) {
        // Try to get error message from response
        const errorBody = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      // Parse response body as JSON
      const data = await response.json();
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Fetch all orders
  const fetchOrders = useCallback(async (retryCount = 0) => {
    // Get the latest user ID for this operation
    const userId = getCurrentUserId();
    
    // Don't proceed if no user ID, but retry a few times if auth might still be initializing
    if (!userId) {
      // Retry up to 3 times with a delay to allow Firebase auth to initialize
      if (retryCount < 3) {
        // Wait longer with each retry attempt
        const delayMs = 1000 * (retryCount + 1); // 1s, 2s, 3s
        
        setTimeout(() => fetchOrders(retryCount + 1), delayMs);
        return;
      }
      
      // If all retries fail, show error and clear orders
      setError('You must be logged in to view orders');
      setOrders([]);
      setBuyerOrders([]);
      setSellerOrders([]);
      return;
    }
    
    setCurrentUserId(userId); // Update the state in case it changed
    
    setLoading(true);
    setError(null);

    try {
      // Create a direct API request with XMLHttpRequest to ensure headers are sent
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${API_URL}/api/orders`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('user-id', userId); // Primary header format
      xhr.setRequestHeader('userId', userId);  // Alternate format
      xhr.setRequestHeader('userid', userId);  // Another alternate format
      xhr.setRequestHeader('uid', userId);     // Firebase field name format
      xhr.withCredentials = true;
      
      // Use a Promise to handle the XMLHttpRequest
      const response = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`API error: ${xhr.status} - ${xhr.responseText || 'No response data'}`));
          }
        };
        xhr.onerror = () => {
          reject(new Error('Network error when trying to fetch orders'));
        };
        xhr.send();
      });
      
      // Parse the response
      const data = JSON.parse(response);
      
      // Process the data
      if (Array.isArray(data)) {
        setOrders(data);
        setBuyerOrders(data.filter((order: Order) => order.buyerId === userId));
        setSellerOrders(data.filter((order: Order) => order.sellerId === userId));
      } else if (data && typeof data === 'object') {
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          if (data.buyerOrders && Array.isArray(data.buyerOrders)) {
            setBuyerOrders(data.buyerOrders);
          } else {
            setBuyerOrders(data.orders.filter((order: Order) => order.buyerId === userId));
          }
          if (data.sellerOrders && Array.isArray(data.sellerOrders)) {
            setSellerOrders(data.sellerOrders);
          } else {
            setSellerOrders(data.orders.filter((order: Order) => order.sellerId === userId));
          }
        } else {
          // Single order or empty object
          const orderArray = 'id' in data ? [data] : [];
          setOrders(orderArray);
          setBuyerOrders(orderArray.filter((order: Order) => order.buyerId === userId));
          setSellerOrders(orderArray.filter((order: Order) => order.sellerId === userId));
        }
      } else {
        // Handle unexpected data
        console.error('Unexpected response format:', data);
        setOrders([]);
        setBuyerOrders([]);
        setSellerOrders([]);
      }
    } catch (err: any) {
      // If authentication error and we still have retries left, try again
      if (err.message.includes('401') && retryCount < 3) {
        // Exponential backoff for retries
        const delayMs = 1000 * Math.pow(2, retryCount);
        
        setTimeout(() => fetchOrders(retryCount + 1), delayMs);
        return;
      }
      
      setError(`Failed to fetch orders: ${err.message}`);
      console.error('Error fetching orders:', err);
      
      // For production, we don't use mock data - we just show empty state
      setOrders([]);
      setBuyerOrders([]);
      setSellerOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single order by ID
  const fetchOrderById = useCallback(async (orderId: string): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi(`/api/orders/${orderId}`);
      return data.order;
    } catch (err: any) {
      setError(`Failed to fetch order: ${err.message}`);
      console.error(`Error fetching order ${orderId}:`, err);
      
      // Return an empty order object
      return {
        id: orderId,
        status: 'error',
        paymentStatus: 'error',
        createdAt: new Date(),
        updatedAt: new Date(),
        price: {
          subtotal: 0,
          fees: 0,
          taxes: 0,
          total: 0,
          currency: 'USD'
        },
        buyerId: '',
        sellerId: '',
        title: 'Error loading order'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new order from an ad
  const createOrderFromAd = useCallback(async (adId: string, details: OrderDetails): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi('/api/orders/create-from-ad', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          ...details
        })
      });

      // Add the new order to the orders list
      const newOrder = data.order;
      setOrders(prevOrders => [...prevOrders, newOrder]);
      setBuyerOrders(prevOrders => [...prevOrders, newOrder]);
      
      return newOrder;
    } catch (err: any) {
      setError(`Failed to create order: ${err.message}`);
      console.error('Error creating order from ad:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new order from an offer
  const createOrderFromOffer = useCallback(async (id: string): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`OrdersContext: Creating order from conversation/offer ${id}`);
      
      // Use absolute URL to ensure proper resolution
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/orders/create-from-offer`;
      console.log('OrdersContext: Using absolute URL:', url);
      
      // Get the current user ID
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User is not authenticated - cannot create order from offer');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'user-id': userId,
          'userId': userId,
          'userid': userId,
          'uid': userId
        },
        body: JSON.stringify({ offerId: id })
      });

      console.log('OrdersContext: API response status:', response.status);

      // Handle non-OK responses
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`OrdersContext: Conversation/Offer with ID ${id} not found`);
          throw new Error(`Conversation/Offer not found with ID: ${id}`);
        }
        
        const errorText = await response.text();
        console.error('OrdersContext: API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      // Check for empty or null response
      if (!data) {
        throw new Error('Server returned empty response');
      }
      
      // Check for error in the response
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      // Handle when data is an array (incorrect response for order creation)
      if (Array.isArray(data)) {
        throw new Error('Invalid server response format - received array instead of order');
      }

      // The response can be either directly the order or inside an order property
      const newOrder = data.order || data;
      
      // Validate the order object
      if (!newOrder) {
        throw new Error('Server returned null order');
      }
      
      if (!newOrder.id) {
        throw new Error('Invalid response format - missing order ID');
      }
      
      // Create a properly structured order object with required fields
      const validatedOrder: Order = {
        id: newOrder.id,
        status: newOrder.status || 'pending',
        paymentStatus: newOrder.paymentStatus || 'pending',
        createdAt: newOrder.createdAt || new Date().toISOString(),
        updatedAt: newOrder.updatedAt || new Date().toISOString(),
        price: newOrder.price || {
          subtotal: newOrder.amount || 0,
          fees: 0,
          taxes: 0,
          total: newOrder.amount || 0,
          currency: 'USD'
        },
        buyerId: newOrder.buyerId || '',
        sellerId: newOrder.sellerId || '',
        title: newOrder.description || 'New Order',
        description: newOrder.description || '',
        adId: newOrder.adId || '',
        offerId: newOrder.offerId || id,
        sourceCollection: newOrder.sourceCollection
      };
      
      // Add the new order to the orders list
      setOrders(prevOrders => [...prevOrders, validatedOrder]);
      setBuyerOrders(prevOrders => [...prevOrders, validatedOrder]);
      
      return validatedOrder;
    } catch (err: any) {
      setError(`Failed to create order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await callApi(`/api/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });

      // Update the order in the local state
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId ? { ...order, status } : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
    } catch (err: any) {
      setError(`Failed to update order status: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create payment intent for an order
  const createPaymentForOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi(`/api/orders/${orderId}/payment-intent`, {
        method: 'POST'
      });
      
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId || data.clientSecret.split('_secret_')[0]
      };
    } catch (err: any) {
      setError(`Failed to create payment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOrderById]);

  // Confirm payment after successful processing
  const confirmPayment = useCallback(async (paymentIntentId: string, orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      await callApi(`/api/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
      
      // Update local order state
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { ...order, paymentStatus: 'completed', status: 'confirmed' } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
      // Navigate to success page
      navigate(routes.getPaymentStatusRoute('success'), { 
        state: { orderId } 
      });
    } catch (err: any) {
      setError(`Failed to confirm payment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Cancel payment
  const cancelPayment = useCallback(async (paymentIntentId: string, orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      await callApi(`/api/orders/${orderId}/cancel-payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
      
      // Update local order state
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { ...order, paymentStatus: 'cancelled' } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
      // Navigate to cancel page
      navigate(routes.getPaymentStatusRoute('cancel'), { 
        state: { orderId } 
      });
    } catch (err: any) {
      setError(`Failed to cancel payment: ${err.message}`);
      console.error('Error cancelling payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Submit a delivery for an order (seller)
  const submitDelivery = useCallback(async (orderId: string, files: File[], message: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Get the current user ID - we need it for the upload
      const userId = getCurrentUserId();
      
      // If no user ID, we cannot proceed
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      // First upload files to storage
      const uploadedFiles: FileData[] = [];
      
      for (const file of files) {
        try {
          // We'll use the existing uploadOrderFile utility
          const fileData = await uploadOrderFile(file, orderId, userId, 'delivery');
          uploadedFiles.push({
            id: `file_${Math.random().toString(36).substring(2)}`,
            name: fileData.fileName,
            size: file.size,
            type: fileData.fileType,
            url: fileData.fileUrl,
            uploadDate: fileData.uploadedAt,
            status: 'complete'
          });
        } catch (uploadErr) {
          console.error(`Error uploading file ${file.name}:`, uploadErr);
          uploadedFiles.push({
            id: `file_${Math.random().toString(36).substring(2)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            status: 'error'
          });
        }
      }
      
      // Now create a delivery document
      await callApi(`/api/orders/${orderId}/delivery`, {
        method: 'POST',
        body: JSON.stringify({
          files: uploadedFiles,
          message,
          deliveredAt: new Date().toISOString()
        })
      });

      // Update the order status to delivered
      await updateOrderStatus(orderId, 'delivered');
      
      // Also add a system message
      await sendOrderMessage(
        orderId, 
        `Delivery submitted with ${uploadedFiles.length} file(s)`, 
        []
      );
      
      // Update local state with the new delivery files
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: 'delivered',
                deliveryFiles: [...(order.deliveryFiles || []), ...uploadedFiles]
              } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
    } catch (err: any) {
      setError(`Failed to submit delivery: ${err.message}`);
      console.error('Error submitting delivery:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateOrderStatus]);

  // Request a revision for a delivery (buyer)
  const requestRevision = useCallback(async (orderId: string, description: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi(`/api/orders/${orderId}/revision-request`, {
        method: 'POST',
        body: JSON.stringify({
          description,
          timestamp: new Date().toISOString()
        })
      });
      
      const revisionRequest = data.revisionRequest;
      
      // Update the order status back to in_progress
      await updateOrderStatus(orderId, 'in_progress');
      
      // Add a system message
      await sendOrderMessage(
        orderId, 
        `Revision requested: ${description}`, 
        []
      );
      
      // Update local state with the new revision request
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: 'in_progress',
                revisionRequests: [...(order.revisionRequests || []), revisionRequest]
              } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
    } catch (err: any) {
      setError(`Failed to request revision: ${err.message}`);
      console.error('Error requesting revision:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateOrderStatus]);

  // Approve a delivery (buyer)
  const approveDelivery = useCallback(async (orderId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await callApi(`/api/orders/${orderId}/approve`, {
        method: 'POST'
      });
      
      // Update the order status to completed
      await updateOrderStatus(orderId, 'completed');
      
      // Add a system message
      await sendOrderMessage(
        orderId, 
        'Delivery approved. Order completed successfully!', 
        []
      );
      
      // Navigate to review page
      navigate(`/orders/${orderId}/review`);
      
    } catch (err: any) {
      setError(`Failed to approve delivery: ${err.message}`);
      console.error('Error approving delivery:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateOrderStatus, navigate]);

  // Reject a delivery (buyer)
  const rejectDelivery = useCallback(async (orderId: string, reason: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await callApi(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason
        })
      });
      
      // Request a revision with the rejection reason
      await requestRevision(orderId, reason);
      
    } catch (err: any) {
      setError(`Failed to reject delivery: ${err.message}`);
      console.error('Error rejecting delivery:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestRevision]);

  // Send a message in an order
  const sendOrderMessage = useCallback(async (orderId: string, content: string, attachments: File[] = []): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // First upload any attachments
      const uploadedFiles: FileData[] = [];
      
      // Get the current user ID for file uploads
      const userId = getCurrentUserId();
      
      // If no user ID, we cannot proceed
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      for (const file of attachments) {
        try {
          const fileData = await uploadOrderFile(file, orderId, userId, 'message');
          uploadedFiles.push({
            id: `file_${Math.random().toString(36).substring(2)}`,
            name: fileData.fileName,
            size: file.size,
            type: fileData.fileType,
            url: fileData.fileUrl,
            uploadDate: fileData.uploadedAt,
            status: 'complete'
          });
        } catch (uploadErr) {
          console.error(`Error uploading message attachment ${file.name}:`, uploadErr);
        }
      }
      
      // Create the message
      const data = await callApi(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          attachmentFiles: uploadedFiles,
          timestamp: new Date().toISOString()
        })
      });
      
      const newMessage = data.message;
      
      // Update local state
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                messages: [...(order.messages || []), newMessage]
              } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
      console.error('Error sending order message:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark an order message as read
  const markOrderMessageAsRead = useCallback(async (orderId: string, messageId: string): Promise<void> => {
    try {
      await callApi(`/api/orders/${orderId}/messages/${messageId}/read`, {
        method: 'POST'
      });
      
      // Update local state
      const updateOrderInList = (ordersList: Order[]) => 
        ordersList.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                messages: (order.messages || []).map(msg => 
                  msg.id === messageId 
                    ? { ...msg, isRead: true } 
                    : msg
                )
              } 
            : order
        );

      setOrders(updateOrderInList);
      setBuyerOrders(updateOrderInList);
      setSellerOrders(updateOrderInList);
      
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Get messages for an order
  const getOrderMessages = useCallback(async (orderId: string): Promise<OrderMessage[]> => {
    try {
      const data = await callApi(`/api/orders/${orderId}/messages`);
      return data.messages || [];
    } catch (err: any) {
      console.error('Error fetching order messages:', err);
      return [];
    }
  }, []);

  // Load orders on initial mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Context value
  const value = {
    orders,
    buyerOrders,
    sellerOrders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrderFromAd,
    createOrderFromOffer,
    updateOrderStatus,
    createPaymentForOrder,
    confirmPayment,
    cancelPayment,
    submitDelivery,
    requestRevision,
    approveDelivery,
    rejectDelivery,
    sendOrderMessage,
    markOrderMessageAsRead,
    getOrderMessages
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

// Custom hook for using the orders context
export const useOrders = () => useContext(OrdersContext); 