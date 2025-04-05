# Order Payments Module Integration Guide

This document provides instructions for integrating the Order Payments Module with the main application.

## Overview

The Order Payments Module is designed to be integrated into the main application as a feature module. It provides components and utilities for managing orders, processing payments via Stripe, and handling the order lifecycle.

## Prerequisites

Before integration, ensure your main application has:

1. React (v16.8+) and React Router (v6+) installed
2. Firebase and Firestore set up
3. Stripe account and API keys configured
4. Authentication system in place

## Installation

### 1. Add the module to your project

The module can be integrated in one of these ways:

```bash
# Option 1: Copy the module directory into your project
cp -r order-payments-module/ your-project/src/modules/

# Option 2: Add as a local dependency in package.json
# "dependencies": {
#   "order-payments-module": "file:../order-payments-module"
# }
```

### 2. Install dependencies

Ensure all required dependencies are installed:

```bash
npm install stripe@^14.17.0 firebase@^10.8.0 react-router-dom@^6.0.0
```

## Configuration

### 1. Firebase Configuration

Ensure your Firebase configuration is properly set up in your main application:

```javascript
// Example firebase config setup in your main app
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2. Stripe API Keys

Configure Stripe API keys by creating a `.env` file in your main application:

```bash
# .env file
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# For production, use live keys (uncomment when ready for production)
# NODE_ENV=production
# STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
# STRIPE_SECRET_KEY=sk_live_your_live_key
# STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 3. Apply Firestore Security Rules

Apply the Firestore security rules from `docs/security-rules.md` to your Firebase project.

## Integration Steps

### 1. Authentication Integration

Connect the module's authentication with your main app:

```javascript
// In your main app's authentication setup
import { initializeAuth } from 'order-payments-module/integration/auth/orderPaymentsAuth';

// After your user is authenticated, initialize the module's auth
const mainAppAuth = {
  currentUser: {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: userRole, // 'client', 'provider', or 'admin'
    stripeAccountId: stripeConnectedAccount // for providers receiving payments
  },
  isAuthenticated: !!user,
  roles: {
    isClient: () => userRole === 'client',
    isProvider: () => userRole === 'provider',
    isAdmin: () => userRole === 'admin',
  },
  getAuthToken: async () => await user.getIdToken(),
  refreshAuthToken: async () => await user.getIdToken(true)
};

// Initialize the module's auth with your app's auth
initializeAuth(mainAppAuth);
```

### 2. Router Integration

Integrate the module's router with your main application's router:

```jsx
// In your main app's router setup
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrdersRouter } from 'order-payments-module/integration';

// Your main app components
import MainAppLayout from './layouts/MainAppLayout';
import Dashboard from './pages/Dashboard';
// ...

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainAppLayout />}>
          <Route index element={<Dashboard />} />
          
          {/* Integrate the Order Payments Module router */}
          <Route path="/*" element={
            <OrdersRouter 
              basePath="/app" 
              fallback={<YourLoadingComponent />} 
            />
          } />
          
          {/* Other main app routes */}
          <Route path="/settings" element={<Settings />} />
          {/* ... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. Component Usage

You can use individual components from the module in your main application:

```jsx
import React, { useState, useEffect } from 'react';
import { 
  OrderDetailCard, 
  PaymentSummary 
} from 'order-payments-module/integration';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

function OrderSummaryPage({ orderId }) {
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    async function fetchOrder() {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() });
      }
    }
    
    fetchOrder();
  }, [orderId]);
  
  if (!order) return <div>Loading...</div>;
  
  return (
    <div className="order-summary-page">
      <h1>Order Summary</h1>
      <OrderDetailCard order={order} />
      <PaymentSummary order={order} />
    </div>
  );
}
```

### 4. Navigation Between Apps

To navigate to Order Payment Module routes from your main application:

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from 'order-payments-module/integration';

function OrdersButton() {
  const navigate = useNavigate();
  
  const viewOrders = () => {
    navigate(routes.ORDERS_LIST);
  };
  
  const viewSpecificOrder = (orderId) => {
    const orderDetailPath = routes.generateOrderRoute(routes.ORDER_DETAIL, orderId);
    navigate(orderDetailPath);
  };
  
  return (
    <div>
      <button onClick={viewOrders}>View All Orders</button>
      <button onClick={() => viewSpecificOrder('order-123')}>View Order #123</button>
    </div>
  );
}
```

### 5. Handling Payments

To process payments using the module:

```jsx
import { createStripePaymentIntent } from 'order-payments-module/integration';

// In your payment processing component
async function handlePayment(order) {
  try {
    // Create a payment intent
    const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
      order.price.total * 100, // Amount in cents
      order.price.currency,
      { orderId: order.id }
    );
    
    // Store payment intent ID with order
    await updateOrderWithPaymentIntent(order.id, paymentIntentId);
    
    // Redirect to payment processing page
    navigate(routes.generateOrderRoute(routes.PAYMENT_PROCESSING, order.id));
  } catch (error) {
    console.error('Payment error:', error);
  }
}
```

## Responsive Design Considerations

The Order Payments Module is designed to be responsive, but your main application should:

1. Ensure any container components use responsive design principles
2. Use the same breakpoints as the module (or customize the module's components)
3. Test the integrated application on various devices and screen sizes

## Performance Optimization

For optimal performance with large order histories:

1. Implement pagination for order lists (the module supports paginated queries)
2. Use the `React.lazy` pattern for code splitting (already implemented in the module's router)
3. Consider server-side rendering for initial page loads
4. Enable Firestore cache settings for better offline performance

## Troubleshooting

### Common Issues

1. **Authentication errors**: Ensure `initializeAuth` is called after the user is authenticated
2. **Routing issues**: Check that the module's routes are properly integrated with your main router
3. **Stripe integration problems**: Verify API keys are correctly set in the environment variables
4. **Firestore permission errors**: Ensure security rules are properly set up

## Support

For issues or assistance with integration, contact the module maintainers:

- Email: support@example.com
- GitHub: [Order Payments Module Issues](https://github.com/example/order-payments-module/issues) 