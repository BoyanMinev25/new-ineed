/**
 * Order Module Routes
 * 
 * Centralized route configuration for the Order Payment Module.
 * This allows for easier route management and reference throughout the application.
 */

const routes = {
  // Main routes
  ORDERS_LIST: '/orders',
  ORDER_DETAIL: '/orders/:orderId',
  CHECKOUT: '/orders/checkout/:adId',
  
  // Payment routes
  PAYMENT_SUCCESS: '/orders/payment/status/success',
  PAYMENT_CANCEL: '/orders/payment/status/cancel',
  PAYMENT_PROCESSING: '/orders/payment/status/processing',
  
  // Helper function to get the orders list route
  getOrdersListRoute: () => '/orders',
  
  // Helper function to build order detail route with specific ID
  getOrderDetailRoute: (orderId: string) => `/orders/${orderId}`,
  
  // Helper function to build checkout route with specific ad ID
  getCheckoutRoute: (adId: string) => `/orders/checkout/${adId}`,
  
  // Helper function to build payment status route
  getPaymentStatusRoute: (status: 'success' | 'cancel' | 'processing') => `/orders/payment/status/${status}`
};

export default routes; 