import React from 'react';

// Define routes directly to avoid circular dependencies
export const routes = {
  ORDERS_LIST: '/orders',
  ORDER_DETAIL: '/orders/:orderId',
  CHECKOUT: '/orders/checkout/:adId',
  PAYMENT_STATUS: '/orders/payment/status/:status',
  
  // Helper methods
  getOrderDetailRoute: (orderId) => `/orders/${orderId}`,
  getOrdersListRoute: () => '/orders',
  getCheckoutRoute: (adId) => `/orders/checkout/${adId}`,
  getPaymentStatusRoute: (status) => `/orders/payment/status/${status}`
};

// Router for orders
export { default as OrdersRouter } from './integration/navigation/OrdersRouter.js';

// Export Firebase collection names and helpers
export const firebaseCollections = {
  orders: 'orders',
  orderEvents: 'orderEvents',
  orderDeliveries: 'orderDeliveries',
  payments: 'payments'
};

// Additional helper for routes
export const routeHelpers = {
  getOrderDetailRoute: (orderId) => `/orders/${orderId}`,
  getOrdersListRoute: () => '/orders'
};

// Authentication helper
export const orderPaymentsAuth = {
  initializeWithUser: (user) => {
    return true;
  }
};

// Mock components using React.createElement instead of JSX
export const OrderDetailCard = ({ order, onActionClick }) => {
  // Make sure we're handling the order object safely
  if (!order || typeof order !== 'object') {
    return React.createElement('div', { className: 'error-card' }, 'Error: Invalid order data');
  }

  // Safely extract properties with defaults
  const id = order.id || 'unknown';
  const status = order.status || 'N/A';
  const amount = order.amount || 0;
  const description = typeof order.description === 'string' ? order.description : 
                     (order.description ? JSON.stringify(order.description) : '');
  const serviceType = typeof order.serviceType === 'string' ? order.serviceType : `Order #${id}`;
  
  // Safely format date
  let formattedDate = 'N/A';
  if (order.createdAt) {
    try {
      formattedDate = new Date(order.createdAt).toLocaleString();
    } catch (e) {
      formattedDate = String(order.createdAt);
    }
  }
  
  return React.createElement(
    'div', 
    { 
      style: { 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '16px',
        cursor: onActionClick ? 'pointer' : 'default'
      },
      onClick: () => {
        if (onActionClick && typeof onActionClick === 'function') {
          try {
            onActionClick(order);
          } catch (e) {
            // Error handling without console.error
          }
        }
      }
    },
    React.createElement('h3', { style: { margin: '0 0 8px 0' } }, serviceType),
    React.createElement('p', null, 'Status: ' + status),
    React.createElement('p', null, 'Amount: $' + amount),
    React.createElement('p', null, 'Date: ' + formattedDate),
    React.createElement('p', null, 'Description: ' + description)
  );
};

export const OrderTimeline = ({ order }) => {
  // Validate order object
  if (!order || typeof order !== 'object') {
    return React.createElement('div', { className: 'error-card' }, 'Error: Invalid order data');
  }

  // Safely format date
  let formattedDate = 'N/A';
  if (order.createdAt) {
    try {
      formattedDate = new Date(order.createdAt).toLocaleString();
    } catch (e) {
      formattedDate = String(order.createdAt);
    }
  }

  // Safely get status
  const status = order.status || 'N/A';
  
  return React.createElement('div', 
    { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
    React.createElement('h3', { style: { margin: '0 0 8px 0' } }, 'Order Timeline'),
    React.createElement('p', null, 'Created: ' + formattedDate),
    React.createElement('p', null, 'Current Status: ' + status)
  );
};

export const PaymentSummary = ({ details, currency = 'USD' }) => {
  return React.createElement('div', 
    { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
    React.createElement('h3', { style: { margin: '0 0 8px 0' } }, 'Payment Summary'),
    React.createElement('ul', { style: { listStyleType: 'none', padding: 0 } },
      details.map((item, index) => 
        React.createElement('li', 
          { 
            key: index, 
            style: { 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: item.isTotal ? 'bold' : 'normal' 
            } 
          },
          React.createElement('span', null, item.label),
          React.createElement('span', null, currency + ' ' + item.amount)
        )
      )
    )
  );
};

export const DeliveryFileUploader = ({ files = [], onUpload }) => {
  return React.createElement('div', 
    { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
    React.createElement('h3', { style: { margin: '0 0 8px 0' } }, 'Delivery Files'),
    React.createElement('button', 
      { 
        style: { 
          padding: '8px 16px', 
          backgroundColor: '#1976d2', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }
      },
      'Upload Files'
    ),
    files.length > 0 && React.createElement('ul', null,
      files.map((file, index) => 
        React.createElement('li', { key: index }, file.name + ' (' + file.size + ' bytes)')
      )
    )
  );
};

export const ReviewForm = ({ orderId, sellerName, onSubmitReview, isSubmitting }) => {
  return React.createElement('div', 
    { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
    React.createElement('h3', { style: { margin: '0 0 8px 0' } }, 'Leave a Review for ' + sellerName),
    React.createElement('div', { style: { marginBottom: '16px' } },
      React.createElement('label', { style: { display: 'block', marginBottom: '8px' } }, 'Rating'),
      React.createElement('div', null,
        [1, 2, 3, 4, 5].map(rating => 
          React.createElement('span', 
            { key: rating, style: { fontSize: '24px', cursor: 'pointer', color: '#bbb' } },
            '★'
          )
        )
      )
    ),
    React.createElement('div', { style: { marginBottom: '16px' } },
      React.createElement('label', { style: { display: 'block', marginBottom: '8px' } }, 'Comment'),
      React.createElement('textarea', {
        style: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
        rows: 4,
        placeholder: 'Share your experience with this service'
      })
    ),
    React.createElement('button', {
      style: { 
        padding: '8px 16px', 
        backgroundColor: '#1976d2', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      },
      disabled: isSubmitting
    }, 'Submit Review')
  );
};

// Module configuration
export const OrderPaymentsModule = {
  routes: [
    {
      path: '/orders',
      component: 'OrdersListPage'
    },
    {
      path: '/orders/:orderId',
      component: 'OrderDetailPage'
    }
  ]
};
