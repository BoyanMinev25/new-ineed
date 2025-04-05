import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import order-related pages
import OrdersListPage from '../../pages/OrdersListPage';
import OrderDetailPage from '../../pages/OrderDetailPage';
import CheckoutPage from '../../pages/CheckoutPage';
import PaymentStatusPage from '../../pages/PaymentStatusPage';

// Import routes configuration
import routes from './routes';

// Import OrdersProvider
import { OrdersProvider } from '../../context/OrdersContext';

// Import auth integration
import orderPaymentsAuth from '../auth/orderPaymentsAuth';

// Import Firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Get current user ID from authentication system
const getCurrentUserId = (): string | null => {
  // Try to get the current user ID from the auth integration
  const userId = orderPaymentsAuth.getCurrentUserRoleId();

  if (userId) {
    console.log('OrdersRouter: Using authenticated user ID:', userId);
    return userId;
  }
  
  // If we can't get a user ID from auth, return null
  console.log('OrdersRouter: No authenticated user ID found');
  return null;
};

/**
 * OrdersRouter Component
 * 
 * Handles routing for all order and payment related pages.
 * This component is designed to be embedded within the main application's router.
 */
const OrdersRouter: React.FC = () => {
  // Log when the router is mounted
  useEffect(() => {
    console.log('OrdersRouter: Mounted with OrdersProvider');
    
    // Initialize auth by explicitly creating a wrapper around Firebase auth
    // This ensures orderPaymentsAuth has direct access to Firebase auth
    const initializeOrderPaymentsAuth = () => {
      // Check if Firebase is initialized and a user is signed in
      if (firebase.apps.length && firebase.auth().currentUser) {
        console.log('OrdersRouter: Firebase user found, initializing orderPaymentsAuth');
        const firebaseUser = firebase.auth().currentUser;
        
        // Create auth context that directly uses Firebase
        orderPaymentsAuth.initializeAuth({
          get currentUser() {
            const user = firebase.auth().currentUser;
            if (!user) return null;
            return {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || undefined,
              role: 'client' as const, // Use const assertion to match the union type
              stripeAccountId: undefined
            };
          },
          get isAuthenticated() {
            return firebase.auth().currentUser !== null;
          },
          roles: {
            isClient: () => true, // Adjust these based on your role logic
            isProvider: () => false,
            isAdmin: () => false,
          },
          getAuthToken: async () => {
            const user = firebase.auth().currentUser;
            if (!user) return '';
            return user.getIdToken();
          },
          refreshAuthToken: async () => {
            const user = firebase.auth().currentUser;
            if (user) await user.getIdToken(true);
          },
        });
        
        // Only log if firebaseUser is not null
        if (firebaseUser) {
          console.log('OrdersRouter: Successfully initialized auth with Firebase user:', firebaseUser.uid);
        }
      } else {
        console.log('OrdersRouter: Firebase auth not ready or user not signed in');
      }
    };
    
    // Initialize auth immediately
    initializeOrderPaymentsAuth();
    
    // Also set up a listener for auth state changes
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      console.log('OrdersRouter: Firebase auth state changed:', user ? 'signed in' : 'signed out');
      if (user) {
        // Re-initialize auth when user signs in
        initializeOrderPaymentsAuth();
      }
    });
    
    const userId = getCurrentUserId();
    console.log('OrdersRouter: Rendering with user ID:', userId || 'not authenticated');
    
    // Check if the orderPaymentsAuth is properly initialized
    console.log('OrdersRouter: Current auth status:', {
      isAuthenticated: orderPaymentsAuth.isAuthenticated,
      hasCurrentUser: !!orderPaymentsAuth.currentUser,
      currentUserData: orderPaymentsAuth.currentUser 
        ? { uid: orderPaymentsAuth.currentUser.uid, role: orderPaymentsAuth.currentUser.role } 
        : null
    });
    
    // Check if we're running in the browser environment
    if (typeof window !== 'undefined') {
      // Add a request interceptor to ensure user-id header is set for all API calls
      const originalFetch = window.fetch;
      
      window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
        // Prepare the modified init object
        const modifiedInit = { ...init } as RequestInit;
        
        // Check if this is an API request to our backend
        if (typeof input === 'string' && (
          input.includes('/api/orders') || 
          input.includes('/orders') || 
          input.includes('/api/')
        )) {
          console.log('OrdersRouter: Intercepting fetch call to:', input);
          
          // Initialize headers if they don't exist
          if (!modifiedInit.headers) {
            modifiedInit.headers = {};
          }
          
          // Convert headers to a mutable object if it's a Headers instance
          if (modifiedInit.headers instanceof Headers) {
            const headersObj: Record<string, string> = {};
            modifiedInit.headers.forEach((value, key) => {
              headersObj[key] = value;
            });
            modifiedInit.headers = headersObj;
          }
          
          // Ensure headers is a plain object
          const headers = modifiedInit.headers as Record<string, string>;
          
          // Get the current user ID
          const userId = getCurrentUserId();
          
          // Add user-id header if we have a userId and it's not already set
          if (userId && !headers['user-id']) {
            console.log('OrdersRouter: Adding user-id header to fetch request:', userId);
            headers['user-id'] = userId;
            // Also add it in alternate formats that the server might check
            headers['userId'] = userId;
            headers['userid'] = userId;
            headers['uid'] = userId;  // Add uid format that matches Firebase field name
          } else if (!userId) {
            console.log('OrdersRouter: No authenticated user ID available for request');
            console.log('OrdersRouter: Auth debug -', 
              'isAuthenticated:', orderPaymentsAuth.isAuthenticated,
              'currentUser:', orderPaymentsAuth.currentUser ? 'exists' : 'null'
            );
          }
          
          console.log('OrdersRouter: Modified fetch headers:', headers);
        }
        
        // Call the original fetch with modified init
        return originalFetch.call(window, input, modifiedInit);
      };
      
      console.log('OrdersRouter: Installed fetch interceptor');
    }
    
    // Clean up auth listener when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <OrdersProvider>
      <Routes>
        {/* List all orders */}
        <Route path="/" element={<OrdersListPage />} />
        
        {/* View a specific order */}
        <Route path="/:orderId" element={<OrderDetailPage />} />
        
        {/* Checkout flow */}
        <Route path="/checkout/:adId" element={<CheckoutPage />} />
        
        {/* Payment status (success/cancel/processing) */}
        <Route path="/payment/status/:status" element={<PaymentStatusPage />} />
        
        {/* Redirect any unmatched routes to main orders page */}
        <Route path="*" element={<Navigate to={routes.ORDERS_LIST} replace />} />
      </Routes>
    </OrdersProvider>
  );
};

export default OrdersRouter; 