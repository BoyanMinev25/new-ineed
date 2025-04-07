import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { OrderDetailCard, OrderTimeline } from '../../index.js';

// Import Firebase helper
import { 
  firebase, 
  getAuthToken, 
  getCurrentUserId, 
  onAuthStateChanged,
  logAuthState
} from '../auth/firebaseHelper.js';

/**
 * Helper function to call the API with proper error handling
 * This ensures the API URL is correctly formed and headers are consistent
 */
const callApi = async (endpoint, options = {}) => {
  console.log(`📞 CallApi: Starting API call to endpoint: ${endpoint}`);
  
  const baseUrl = '/api';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Add cache busting parameter
  const timestamp = new Date().getTime();
  const fullUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`;
  
  try {
    // Get authentication token for request - FORCE refresh every time
    console.log('📞 CallApi: Getting fresh auth token before API call');
    const authToken = await getAuthToken(true); 
    const userId = getCurrentUserId();
    
    console.log('📞 CallApi: Auth token obtained:', authToken ? `YES (length: ${authToken.length})` : 'NO');
    console.log('📞 CallApi: User ID obtained:', userId || 'NONE');
    
    if (!authToken) {
      // Log auth state for debugging
      const authState = logAuthState();
      console.warn('📞 CallApi: No auth token available. Auth state:', authState);
    }
    
    // Prepare headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers
    };
    
    // Add auth token if available - this is the critical part
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('📞 CallApi: Added Authorization header with Bearer token');
    } else {
      console.warn('⚠️ WARNING: No auth token available for API request');
      
      // If we're trying to access a protected endpoint, show an alert
      if (endpoint.includes('orders')) {
        alert("Authentication error: You need to be logged in to access this page. Redirecting to login.");
        
        // Try to force redirecting to login if no token
        if (window && window.location) {
          console.log('📞 CallApi: No auth token, redirecting to login');
          window.location.href = '/login';
          throw new Error('No authentication token available');
        }
      }
    }
    
    // Add user ID if available (as fallback)
    if (userId) {
      headers['user-id'] = userId;
      headers['userId'] = userId;
      headers['userid'] = userId;
      headers['uid'] = userId;
      console.log(`📞 CallApi: Added user ID to request headers: ${userId}`);
    }
    
    // Log headers for debugging (but redact any sensitive information)
    const debugHeaders = { ...headers };
    if (debugHeaders['Authorization']) {
      const tokenParts = debugHeaders['Authorization'].split('.');
      if (tokenParts.length === 3) {
        debugHeaders['Authorization'] = `Bearer ${tokenParts[0]}.${tokenParts[1].substring(0, 5)}...`;
      } else {
        debugHeaders['Authorization'] = 'Bearer [REDACTED]';
      }
    }
    console.log('📞 CallApi: Request headers:', debugHeaders);
    
    // Make fetch request
    console.log(`📞 CallApi: Sending ${options.method || 'GET'} request to ${fullUrl}`);
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    console.log(`📞 CallApi: Response received from ${fullUrl}, status: ${response.status}`);
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📞 CallApi: API Error (${response.status}):`, errorText);
      
      // Special handling for 401 Unauthorized
      if (response.status === 401) {
        console.error('📞 CallApi: 401 Unauthorized - Authentication token invalid or expired');
        
        // Try to refresh the token
        try {
          const newToken = await getAuthToken(true);
          if (newToken) {
            console.log('📞 CallApi: Successfully refreshed token after 401. Retrying request.');
            
            // Retry the request with the new token
            const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
            const retryResponse = await fetch(fullUrl, {
              method: options.method || 'GET',
              headers: retryHeaders,
              credentials: 'include',
              body: options.body ? JSON.stringify(options.body) : undefined
            });
            
            if (retryResponse.ok) {
              console.log('📞 CallApi: Retry successful!');
              return await retryResponse.json();
            } else {
              console.error('📞 CallApi: Retry failed with status:', retryResponse.status);
            }
          }
        } catch (retryError) {
          console.error('📞 CallApi: Error during token refresh and retry:', retryError);
        }
        
        // If retry failed or token refresh failed, suggest login
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(JSON.stringify(errorData));
    }
    
    // Parse JSON response
    const responseData = await response.json();
    console.log(`📞 CallApi: API response successfully parsed from ${fullUrl}`);
    return responseData;
  } catch (error) {
    console.error(`📞 CallApi: Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * OrdersRouter Component
 * 
 * Handles routing for all order and payment related pages.
 * This component is designed to be embedded within the main application's router.
 */
const OrdersRouter = () => {
  // Hard-coded route path to avoid dependency issues
  const ORDERS_LIST = '/orders';
  const LOGIN_PATH = '/login'; // Assuming login path is /login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const navigate = useNavigate();

  // Check for global Firebase instances
  useEffect(() => {
    // Log what Firebase instances are available
    console.log('🔍 Checking Firebase availability:');
    console.log('- Window firebase:', typeof window !== 'undefined' && !!window.firebase);
    console.log('- Window _firebase:', typeof window !== 'undefined' && !!window._firebase);
    console.log('- Imported firebase:', !!firebase);
    console.log('- Firebase apps count:', firebase.apps?.length || 0);
    
    // Log what auth methods are available
    if (firebase) {
      console.log('- Firebase auth available:', !!firebase.auth);
      console.log('- Current user from firebase:', !!firebase.auth().currentUser);
    }
    
    if (typeof window !== 'undefined' && window.firebase) {
      console.log('- Window firebase auth available:', !!window.firebase.auth);
      console.log('- Current user from window.firebase:', !!window.firebase.auth().currentUser);
    }
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔒 Checking authentication status...');
        // Log current auth state for debugging
        const authState = logAuthState();
        console.log('🔒 Auth state:', authState);
        
        // Check if there's a firebase user
        const user = firebase.auth().currentUser;
        
        if (user) {
          console.log('🔒 User is already authenticated:', user.uid);
          // Get auth token for validation
          const token = await getAuthToken();
          setAuthToken(token);
          setFirebaseUser(user);
          setIsAuthenticated(true);
          setAuthChecked(true);
        } else {
          console.log('🔒 No authenticated user found, checking global firebase...');
          
          // Check if there's a user in window.firebase (global instance)
          let globalUser = null;
          if (typeof window !== 'undefined' && window.firebase) {
            globalUser = window.firebase.auth().currentUser;
            if (globalUser) {
              console.log('🔒 Found user in global firebase:', globalUser.uid);
              setFirebaseUser(globalUser);
              
              // Try to get token from global user
              try {
                const globalToken = await globalUser.getIdToken(true);
                setAuthToken(globalToken);
                setIsAuthenticated(true);
                setAuthChecked(true);
                return; // Found user, no need to set up listener
              } catch (tokenError) {
                console.error('🔒 Error getting token from global user:', tokenError);
              }
            }
          }
          
          // If still no user, set up auth state listener
          console.log('🔒 No authenticated user found, setting up auth state listener');
          const unsubscribe = onAuthStateChanged(async (user) => {
            if (user) {
              console.log('🔒 User authenticated via listener:', user.uid);
              // Get auth token
              const token = await getAuthToken();
              setAuthToken(token);
              setFirebaseUser(user);
              setIsAuthenticated(true);
            } else {
              console.log('🔒 User not authenticated, will redirect to login');
              setAuthToken(null);
              setFirebaseUser(null);
              setIsAuthenticated(false);
              
              // Only redirect if we're on an orders page
              if (window.location.pathname.includes('/orders')) {
                navigate(LOGIN_PATH, { state: { from: window.location.pathname } });
              }
            }
            setAuthChecked(true);
          });
          
          // Clean up listener
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('🔒 Error checking authentication:', error);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Add a debug panel to show authentication state (will be visible in dev mode)
  const AuthDebugPanel = () => {
    // ALWAYS show in development mode for debugging
    const showDebug = true; // Was: process.env.NODE_ENV !== 'production' || !isAuthenticated;
    
    if (!showDebug) return null;
    
    return React.createElement(
      'div',
      {
        style: {
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: '#f0f0f0',
          border: '2px solid #ff5722',
          padding: '15px',
          borderRadius: '5px',
          zIndex: 9999,
          maxWidth: '350px',
          fontSize: '12px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }
      },
      React.createElement('h4', { style: { margin: '0 0 8px 0', color: '#ff5722' } }, '🔐 Auth Debug Panel'),
      React.createElement('div', null, '✓ Authenticated: ', 
        React.createElement('span', { style: { color: isAuthenticated ? 'green' : 'red', fontWeight: 'bold' } }, 
          String(isAuthenticated)
        )
      ),
      React.createElement('div', null, '✓ Auth Checked: ', String(authChecked)),
      React.createElement('div', null, '👤 User ID: ', 
        React.createElement('span', { style: { fontWeight: 'bold' } }, 
          firebaseUser?.uid || 'None'
        )
      ),
      React.createElement('div', null, '🔑 Auth Token: ', 
        React.createElement('span', { style: { fontWeight: 'bold', color: authToken ? 'green' : 'red' } }, 
          authToken ? 'Present' : 'None'
        ),
        authToken ? React.createElement('span', null, ` (${authToken.substring(0, 10)}...)`) : null
      ),
      React.createElement('hr', { style: { margin: '10px 0', borderTop: '1px solid #ccc' } }),
      React.createElement(
        'button',
        {
          onClick: async () => {
            try {
              logAuthState();
              const token = await getAuthToken(true);
              setAuthToken(token);
              alert(`Token refreshed: ${token ? 'Success' : 'Failed'}\n${token ? 'Token: ' + token.substring(0, 15) + '...' : 'No token'}`);
            } catch (e) {
              alert(`Error refreshing token: ${e.message}`);
            }
          },
          style: { marginTop: '5px', padding: '5px', width: '100%', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }
        },
        '🔄 Refresh Token'
      ),
      React.createElement(
        'button',
        {
          onClick: async () => {
            try {
              const authState = logAuthState();
              alert(`Auth state: ${JSON.stringify(authState, null, 2)}`);
            } catch (e) {
              alert(`Error: ${e.message}`);
            }
          },
          style: { marginTop: '5px', padding: '5px', width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px' }
        },
        '🔍 Check Auth State'
      ),
      React.createElement(
        'button',
        {
          onClick: () => {
            // Make a test API call to /api/health with auth token
            const makeTestCall = async () => {
              try {
                const token = await getAuthToken(true);
                if (!token) {
                  alert('No auth token available!');
                  return;
                }
                
                // Make direct fetch call with token
                const response = await fetch('/api/health', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                const data = await response.json();
                alert(`API Test Call Result: ${JSON.stringify(data, null, 2)}`);
              } catch (e) {
                alert(`Test Call Error: ${e.message}`);
              }
            };
            
            makeTestCall();
          },
          style: { marginTop: '5px', padding: '5px', width: '100%', backgroundColor: '#FFC107', color: 'black', border: 'none', borderRadius: '3px' }
        },
        '🧪 Test API Call'
      ),
      React.createElement(
        'button',
        {
          onClick: () => navigate('/login'),
          style: { marginTop: '5px', padding: '5px', width: '100%', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '3px' }
        },
        '🚪 Go to Login'
      ),
      React.createElement(
        'div',
        { style: { fontSize: '10px', marginTop: '10px', textAlign: 'center', color: '#666' } },
        '⚠️ Auth debug panel. Remove before production.'
      )
    );
  };

  // Order list page component using OrderDetailCard
  const OrdersListPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('unknown');

    // Check server status
    useEffect(() => {
      const checkServerStatus = async () => {
        try {
          const response = await fetch('/api/health');
          if (response.ok) {
            setServerStatus('running');
          } else {
            setServerStatus('error');
          }
        } catch (err) {
          setServerStatus('not-running');
        }
      };
      
      checkServerStatus();
    }, []);
    
    // Fetch orders when component mounts
    useEffect(() => {
      const fetchOrders = async () => {
        try {
          const data = await callApi('/api/orders');
          setOrders(data);
          setLoading(false);
        } catch (err) {
          setError('Failed to load orders. Please try again.');
          setLoading(false);
        }
      };
      
      fetchOrders();
    }, []);

    // Navigate to order detail page
    const handleOrderClick = (order) => {
      navigate(`/orders/${order.id}`);
    };

    return React.createElement(
      'div',
      { 
        style: { 
          padding: '40px', 
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }
      },
      React.createElement(
        'h1',
        { 
          style: { 
            fontSize: '24px', 
            fontWeight: 'bold',
            marginBottom: '20px'
          }
        },
        'Your Orders'
      ),
      
      // Server status warning if not running properly
      serverStatus === 'not-running' && React.createElement(
        'div',
        {
          style: {
            color: '#ffffff',
            backgroundColor: '#d32f2f',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }
        },
        'Server connection error: The API server is not running. Please start the backend server with "npm run dev" in the server directory.',
        React.createElement(
          'div',
          { style: { marginTop: '8px', fontSize: '14px' } },
          'Showing mock data for preview purposes.'
        )
      ),
      
      // Server status warning if running but with errors
      serverStatus === 'error' && React.createElement(
        'div',
        {
          style: {
            color: '#ffffff',
            backgroundColor: '#f57c00',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }
        },
        'API Error: The server is running but returning incorrect responses.',
        React.createElement(
          'div',
          { style: { marginTop: '8px', fontSize: '14px' } },
          'Check that routes are configured correctly in the server.'
        )
      ),
      
      // Error message if applicable
      error && serverStatus !== 'not-running' && React.createElement(
        'div',
        {
          style: {
            color: '#f44336',
            backgroundColor: '#ffebee',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }
        },
        `There was an error loading your orders: ${error}`,
        React.createElement(
          'div',
          { style: { marginTop: '8px' } },
          'Showing sample data instead.'
        )
      ),
      
      // Loading state
      loading ? React.createElement(
        'div',
        { style: { marginBottom: '20px' } },
        'Loading orders...'
      ) : React.createElement(
        'p',
        { style: { marginBottom: '20px' } },
        orders.length > 0 
          ? 'View and manage your orders below. Click on any order for more details.' 
          : 'You have no orders yet.'
      ),
      
      // Render orders in a containing div rather than spreading the array
      !loading && React.createElement(
        'div',
        { className: 'orders-list' },
        orders.length > 0 ? orders.map(order => {
          try {
            // Render each OrderDetailCard inside the function
            return React.createElement(OrderDetailCard, { 
              key: order.id, 
              order: order, 
              onActionClick: handleOrderClick 
            });
          } catch (error) {
            // Fallback UI for individual card errors
            return React.createElement(
              'div',
              {
                key: order.id || Math.random().toString(),
                style: {
                  border: '1px solid #f44336',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'left'
                }
              },
              React.createElement('p', null, 'Error rendering order card')
            );
          }
        }) : React.createElement(
          'div',
          {
            style: {
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginTop: '20px'
            }
          },
          React.createElement('p', null, 'No orders found. Your future orders will appear here.')
        )
      )
    );
  };

  // Order detail page component using OrderDetailCard and OrderTimeline
  const OrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('unknown');

    // Check server status
    useEffect(() => {
      const checkServerStatus = async () => {
        try {
          const response = await fetch('/api/health');
          if (response.ok) {
            setServerStatus('running');
          } else {
            setServerStatus('error');
          }
        } catch (err) {
          console.error('Server health check failed:', err);
          setServerStatus('not-running');
        }
      };
      
      checkServerStatus();
    }, []);

    // Fetch order details
    useEffect(() => {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          // Use the callApi helper with correct API path
          const data = await callApi(`/api/orders/${orderId}`);
          setOrder(data);
          setError(null);
        } catch (err) {
          setError(`Error fetching order: ${err.message}`);
          setOrder(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrder();
    }, [orderId]);

    const handleBackClick = () => {
      navigate('/orders');
    };

    return React.createElement(
      'div',
      { 
        style: { 
          padding: '40px', 
          maxWidth: '800px',
          margin: '0 auto'
        }
      },
      // Back button
      React.createElement(
        'button',
        {
          onClick: handleBackClick,
          style: {
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '24px',
            padding: '0'
          }
        },
        React.createElement(
          'span',
          { style: { marginRight: '8px' } },
          '←'
        ),
        'Back to Orders'
      ),
      
      // Server status warning
      serverStatus === 'not-running' && React.createElement(
        'div',
        {
          style: {
            color: '#ffffff',
            backgroundColor: '#d32f2f',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }
        },
        'Server connection error: The API server is not running. Please start the backend server with "npm run dev" in the server directory.',
        React.createElement(
          'div',
          { style: { marginTop: '8px', fontSize: '14px' } },
          'Showing mock data for preview purposes.'
        )
      ),
      
      // Error message
      error && serverStatus !== 'not-running' && React.createElement(
        'div',
        {
          style: {
            color: '#f44336',
            backgroundColor: '#ffebee',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }
        },
        `There was an error loading this order: ${error}`,
        React.createElement(
          'div',
          { style: { marginTop: '8px' } },
          'Showing sample data for preview.'
        )
      ),
      
      // Loading state
      loading ? React.createElement(
        'div',
        null,
        'Loading order details...'
      ) : (
        order && React.createElement(
          React.Fragment,
          null,
          // Title
          React.createElement(
            'h1',
            { 
              style: { 
                fontSize: '24px', 
                fontWeight: 'bold',
                marginBottom: '24px'
              }
            },
            'Order Details'
          ),

          // Order detail card
          React.createElement(OrderDetailCard, { 
            order: order, 
            expanded: true,
            onActionClick: () => {} // No action on detail page
          }),

          // Order timeline
          React.createElement(OrderTimeline, { 
            order: order,
            style: { marginTop: '40px' }
          })
        )
      )
    );
  };

  return (
    React.createElement(
      React.Fragment,
      null,
      !authChecked ? (
        // Show loading state while checking authentication
        React.createElement(
          'div',
          { style: { padding: '40px', textAlign: 'center' } },
          'Loading...'
        )
      ) : isAuthenticated ? (
        // Render routes when authenticated
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { 
            path: "/", 
            element: React.createElement(OrdersListPage) 
          }),
          React.createElement(Route, { 
            path: "/:orderId", 
            element: React.createElement(OrderDetailPage) 
          }),
          React.createElement(Route, { 
            path: "*", 
            element: React.createElement(Navigate, { to: ORDERS_LIST, replace: true }) 
          })
        )
      ) : (
        // Redirect to login when not authenticated
        React.createElement(Navigate, { to: LOGIN_PATH, replace: true })
      ),
      
      // Always render the debug panel
      React.createElement(AuthDebugPanel)
    )
  );
};

export default OrdersRouter;
