/**
 * Routes configuration for the Order Payments Module
 */
const routes = {
  ORDERS_LIST: '/orders',
  ORDER_DETAIL: '/orders/:orderId',
  CHECKOUT: '/orders/checkout/:adId',
  PAYMENT_STATUS: '/orders/payment/status/:status',
  PAYMENT_SUCCESS: '/orders/payment/status/success',
  PAYMENT_CANCEL: '/orders/payment/status/cancel',
  PAYMENT_PROCESSING: '/orders/payment/status/processing',
  
  // Helper methods
  getOrderDetailRoute: (orderId: string) => `/orders/${orderId}`,
  getOrdersListRoute: () => '/orders',
  getCheckoutRoute: (adId: string) => `/orders/checkout/${adId}`,
  getPaymentStatusRoute: (status: 'success' | 'cancel' | 'processing') => `/orders/payment/status/${status}`
};

export default routes; 