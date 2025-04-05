import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import routes from '../integration/navigation/routes';
import { createStripePaymentIntent } from '../lib/stripe-utils';
import { uploadOrderFile } from '../lib/storage-utils';

// Create the context
export const OrdersContext = createContext({
    orders: [],
    buyerOrders: [],
    sellerOrders: [],
    loading: false,
    error: null,
    fetchOrders: async () => {},
    fetchOrderById: async () => ({}),
    createOrderFromAd: async () => ({}),
    createOrderFromOffer: async () => ({}),
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
});

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Provider component
export const OrdersProvider = ({ children }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [sellerOrders, setSellerOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper function to call API with error handling
    const callApi = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error(`API call error: ${err.message}`);
            throw err;
        }
    };

    // Fetch all orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await callApi('/api/orders');
            
            setOrders(data.orders || []);
            setBuyerOrders(data.buyerOrders || []);
            setSellerOrders(data.sellerOrders || []);
        } catch (err) {
            setError(`Failed to fetch orders: ${err.message}`);
            console.error('Error fetching orders:', err);
            
            // Mock data fallback for development
            const mockOrders = generateMockOrders();
            setOrders(mockOrders);
            setBuyerOrders(mockOrders.filter(order => order.buyerId === 'current-user-id'));
            setSellerOrders(mockOrders.filter(order => order.sellerId === 'current-user-id'));
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch a single order by ID
    const fetchOrderById = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);

        try {
            const data = await callApi(`/api/orders/${orderId}`);
            return data;
        } catch (err) {
            setError(`Failed to fetch order: ${err.message}`);
            console.error(`Error fetching order ${orderId}:`, err);
            
            // Return mock data for development
            return generateMockOrderById(orderId);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create an order from a service ad
    const createOrderFromAd = useCallback(async (adId, details) => {
        setLoading(true);
        setError(null);

        try {
            const response = await callApi('/api/orders/create-from-ad', {
                method: 'POST',
                body: JSON.stringify({
                    adId,
                    ...details
                })
            });

            // Update orders list
            const newOrder = response.order;
            setOrders(prev => [...prev, newOrder]);
            
            if (newOrder.buyerId === 'current-user-id') {
                setBuyerOrders(prev => [...prev, newOrder]);
            }
            
            if (newOrder.sellerId === 'current-user-id') {
                setSellerOrders(prev => [...prev, newOrder]);
            }

            return newOrder;
        } catch (err) {
            setError(`Failed to create order: ${err.message}`);
            console.error('Error creating order from ad:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new order from an offer
    const createOrderFromOffer = useCallback((offerId) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            const data = yield callApi('/api/orders/create-from-offer', {
                method: 'POST',
                body: JSON.stringify({ offerId })
            });
            // Add the new order to the orders list
            const newOrder = data.order;
            setOrders(prevOrders => [...prevOrders, newOrder]);
            setBuyerOrders(prevOrders => [...prevOrders, newOrder]);
            return newOrder;
        }
        catch (err) {
            setError(`Failed to create order from offer: ${err.message}`);
            console.error('Error creating order from offer:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), []);

    // Update order status
    const updateOrderStatus = useCallback((orderId, status) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            yield callApi(`/api/orders/${orderId}/status`, {
                method: 'POST',
                body: JSON.stringify({ status })
            });
            // Update the order in the local state
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId ? Object.assign(Object.assign({}, order), { status }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
        }
        catch (err) {
            setError(`Failed to update order status: ${err.message}`);
            console.error('Error updating order status:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), []);

    // Create payment intent for an order
    const createPaymentForOrder = useCallback((orderId) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            const data = yield callApi(`/api/orders/${orderId}/payment-intent`, {
                method: 'POST'
            });
            return {
                clientSecret: data.clientSecret,
                paymentIntentId: data.paymentIntentId || data.clientSecret.split('_secret_')[0]
            };
        }
        catch (err) {
            setError(`Failed to create payment: ${err.message}`);
            console.error('Error creating payment:', err);
            // Fallback to client-side generation for development only
            const order = yield fetchOrderById(orderId);
            const stripeResponse = yield createStripePaymentIntent(order.price.total * 100, order.price.currency, { orderId });
            return stripeResponse;
        }
        finally {
            setLoading(false);
        }
    }), [fetchOrderById]);

    // Confirm payment after successful processing
    const confirmPayment = useCallback((paymentIntentId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            yield callApi(`/api/orders/${orderId}/confirm-payment`, {
                method: 'POST',
                body: JSON.stringify({ paymentIntentId })
            });
            // Update local order state
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { paymentStatus: 'completed', status: 'confirmed' }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
            // Navigate to success page
            navigate(routes.getPaymentStatusRoute('success'), {
                state: { orderId }
            });
        }
        catch (err) {
            setError(`Failed to confirm payment: ${err.message}`);
            console.error('Error confirming payment:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [navigate]);

    // Cancel payment
    const cancelPayment = useCallback((paymentIntentId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            yield callApi(`/api/orders/${orderId}/cancel-payment`, {
                method: 'POST',
                body: JSON.stringify({ paymentIntentId })
            });
            // Update local order state
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { paymentStatus: 'cancelled' }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
            // Navigate to cancel page
            navigate(routes.getPaymentStatusRoute('cancel'), {
                state: { orderId }
            });
        }
        catch (err) {
            setError(`Failed to cancel payment: ${err.message}`);
            console.error('Error cancelling payment:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [navigate]);

    // Submit a delivery for an order (seller)
    const submitDelivery = useCallback((orderId, files, message) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            // First upload files to storage
            const uploadedFiles = [];
            for (const file of files) {
                try {
                    // We'll use the existing uploadOrderFile utility
                    const fileData = yield uploadOrderFile(file, orderId, 'current-user-id', 'delivery');
                    uploadedFiles.push({
                        id: `file_${Math.random().toString(36).substring(2)}`,
                        name: fileData.fileName,
                        size: file.size,
                        type: fileData.fileType,
                        url: fileData.fileUrl,
                        uploadDate: fileData.uploadedAt,
                        status: 'complete'
                    });
                }
                catch (uploadErr) {
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
            yield callApi(`/api/orders/${orderId}/delivery`, {
                method: 'POST',
                body: JSON.stringify({
                    files: uploadedFiles,
                    message,
                    deliveredAt: new Date().toISOString()
                })
            });
            // Update the order status to delivered
            yield updateOrderStatus(orderId, 'delivered');
            // Also add a system message
            yield sendOrderMessage(orderId, `Delivery submitted with ${uploadedFiles.length} file(s)`, []);
            // Update local state with the new delivery files
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { status: 'delivered', deliveryFiles: [...(order.deliveryFiles || []), ...uploadedFiles] }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
        }
        catch (err) {
            setError(`Failed to submit delivery: ${err.message}`);
            console.error('Error submitting delivery:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [updateOrderStatus]);

    // Request a revision for a delivery (buyer)
    const requestRevision = useCallback((orderId, description) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            const data = yield callApi(`/api/orders/${orderId}/revision-request`, {
                method: 'POST',
                body: JSON.stringify({
                    description,
                    timestamp: new Date().toISOString()
                })
            });
            const revisionRequest = data.revisionRequest;
            // Update the order status back to in_progress
            yield updateOrderStatus(orderId, 'in_progress');
            // Add a system message
            yield sendOrderMessage(orderId, `Revision requested: ${description}`, []);
            // Update local state with the new revision request
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { status: 'in_progress', revisionRequests: [...(order.revisionRequests || []), revisionRequest] }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
        }
        catch (err) {
            setError(`Failed to request revision: ${err.message}`);
            console.error('Error requesting revision:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [updateOrderStatus]);

    // Approve a delivery (buyer)
    const approveDelivery = useCallback((orderId) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            yield callApi(`/api/orders/${orderId}/approve`, {
                method: 'POST'
            });
            // Update the order status to completed
            yield updateOrderStatus(orderId, 'completed');
            // Add a system message
            yield sendOrderMessage(orderId, 'Delivery approved. Order completed successfully!', []);
            // Navigate to review page
            navigate(`/orders/${orderId}/review`);
        }
        catch (err) {
            setError(`Failed to approve delivery: ${err.message}`);
            console.error('Error approving delivery:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [updateOrderStatus, navigate]);

    // Reject a delivery (buyer)
    const rejectDelivery = useCallback((orderId, reason) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            yield callApi(`/api/orders/${orderId}/reject`, {
                method: 'POST',
                body: JSON.stringify({
                    reason
                })
            });
            // Request a revision with the rejection reason
            yield requestRevision(orderId, reason);
        }
        catch (err) {
            setError(`Failed to reject delivery: ${err.message}`);
            console.error('Error rejecting delivery:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), [requestRevision]);

    // Send a message in an order
    const sendOrderMessage = useCallback((orderId, content, attachments = []) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            // First upload any attachments
            const uploadedFiles = [];
            for (const file of attachments) {
                try {
                    const fileData = yield uploadOrderFile(file, orderId, 'current-user-id', 'message');
                    uploadedFiles.push({
                        id: `file_${Math.random().toString(36).substring(2)}`,
                        name: fileData.fileName,
                        size: file.size,
                        type: fileData.fileType,
                        url: fileData.fileUrl,
                        uploadDate: fileData.uploadedAt,
                        status: 'complete'
                    });
                }
                catch (uploadErr) {
                    console.error(`Error uploading message attachment ${file.name}:`, uploadErr);
                }
            }
            // Create the message
            const data = yield callApi(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    content,
                    attachmentFiles: uploadedFiles,
                    timestamp: new Date().toISOString()
                })
            });
            const newMessage = data.message;
            // Update local state
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { messages: [...(order.messages || []), newMessage] }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
        }
        catch (err) {
            setError(`Failed to send message: ${err.message}`);
            console.error('Error sending order message:', err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }), []);

    // Mark an order message as read
    const markOrderMessageAsRead = useCallback((orderId, messageId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield callApi(`/api/orders/${orderId}/messages/${messageId}/read`, {
                method: 'POST'
            });
            // Update local state
            const updateOrderInList = (ordersList) => ordersList.map(order => order.id === orderId
                ? Object.assign(Object.assign({}, order), { messages: (order.messages || []).map(msg => msg.id === messageId
                        ? Object.assign(Object.assign({}, msg), { isRead: true }) : msg) }) : order);
            setOrders(updateOrderInList);
            setBuyerOrders(updateOrderInList);
            setSellerOrders(updateOrderInList);
        }
        catch (err) {
            console.error('Error marking message as read:', err);
        }
    }), []);

    // Get messages for an order
    const getOrderMessages = useCallback((orderId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield callApi(`/api/orders/${orderId}/messages`);
            return data.messages || [];
        }
        catch (err) {
            console.error('Error fetching order messages:', err);
            return [];
        }
    }), []);

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

    return (_jsx(OrdersContext.Provider, Object.assign({ value: value }, { children: children })));
};

// Hook to use the orders context
export const useOrders = () => useContext(OrdersContext);

// Helper function to generate mock orders data
function generateMockOrders() {
    return [
        {
            id: 'order-123456',
            status: 'pending',
            paymentStatus: 'awaiting_payment',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            price: {
                subtotal: 150,
                fees: 15,
                taxes: 10,
                total: 175,
                currency: 'USD'
            },
            buyerId: 'current-user-id',
            sellerId: 'user-456',
            title: 'Website landing page design',
            description: 'Modern landing page for tech startup'
        },
        {
            id: 'order-789012',
            status: 'completed',
            paymentStatus: 'paid',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            price: {
                subtotal: 75,
                fees: 7.5,
                taxes: 5,
                total: 87.5,
                currency: 'USD'
            },
            buyerId: 'user-789',
            sellerId: 'current-user-id',
            title: 'Logo Design',
            description: 'Modern minimalist logo for a coffee shop'
        }
    ];
}

// Helper function to generate a mock order by ID
function generateMockOrderById(orderId) {
    return {
        id: orderId,
        status: 'in_progress',
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        price: {
            subtotal: 250,
            fees: 25,
            taxes: 20,
            total: 295,
            currency: 'USD'
        },
        buyerId: 'current-user-id',
        sellerId: 'provider-123',
        title: 'Custom E-commerce Website',
        description: 'Complete online store with payment integration'
    };
}
