import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { OrderDetailCard, OrderTimeline } from '../../index.js';

/**
 * Helper function to call the API with proper error handling
 * This ensures the API URL is correctly formed and headers are consistent
 */
const callApi = async (endpoint, options = {}) => {
  const baseUrl = '/api';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Add cache busting parameter
  const timestamp = new Date().getTime();
  const fullUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`;
  
  console.log(`🔍 Making API request to: ${fullUrl}`);
  console.log(`🔍 Window location:`, {
    origin: window.location.origin,
    host: window.location.host,
    hostname: window.location.hostname,
    port: window.location.port,
    pathname: window.location.pathname,
    protocol: window.location.protocol
  });
  
  // Create a promise wrapper around XMLHttpRequest
  return new Promise((resolve, reject) => {
    // Initialize a new XMLHttpRequest
    const xhr = new XMLHttpRequest();
    
    // Configure the request
    xhr.open(options.method || 'GET', fullUrl, true);
    
    // Set request headers
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '0');
    
    // Add any additional headers from options
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        xhr.setRequestHeader(key, options.headers[key]);
      });
    }
    
    // Set credentials
    xhr.withCredentials = true;
    
    // Handle successful response
    xhr.onload = function() {
      console.log(`API Response received, status: ${xhr.status}`);
      console.log(`Response type: ${xhr.getResponseHeader('content-type')}`);
      
      // Check if response is JSON
      const contentType = xhr.getResponseHeader('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      } else {
        // Check if we got HTML instead of JSON
        if (xhr.responseText.includes('<!DOCTYPE html>') || xhr.responseText.includes('<html>')) {
          console.error('⚠️ Received HTML instead of JSON:', xhr.responseText.substring(0, 500) + '...');
          
          // Try to fallback to direct API call
          console.log('Attempting direct API call as fallback...');
          
          // Create a direct API URL bypassing the SPA
          const directApiUrl = `http://localhost:5002${fullUrl}`;
          const directXhr = new XMLHttpRequest();
          
          directXhr.open(options.method || 'GET', directApiUrl, true);
          directXhr.setRequestHeader('Accept', 'application/json');
          directXhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          directXhr.setRequestHeader('X-Direct-API-Call', 'true'); // Custom header to identify direct calls
          directXhr.withCredentials = true;
          
          directXhr.onload = function() {
            if (directXhr.getResponseHeader('content-type') && 
                directXhr.getResponseHeader('content-type').includes('application/json')) {
              try {
                const data = JSON.parse(directXhr.responseText);
                resolve(data);
              } catch (error) {
                reject(new Error('Failed to parse JSON from direct API call'));
              }
            } else {
              // If direct API call also fails, return mock data
              console.error('⚠️ Direct API call also failed to return JSON. Using mock data.');
              resolve(getMockData(endpoint));
            }
          };
          
          directXhr.onerror = function() {
            console.error('⚠️ Direct API call failed:', directXhr.statusText);
            // Return mock data as last resort
            resolve(getMockData(endpoint));
          };
          
          // Send the direct request
          directXhr.send(options.body ? JSON.stringify(options.body) : null);
        } else {
          reject(new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`));
        }
      }
    };
    
    // Handle network errors
    xhr.onerror = function() {
      console.error('❌ Network error occurred:', xhr.statusText);
      
      // Try direct API call as fallback
      const directApiUrl = `http://localhost:5002${fullUrl}`;
      console.log('Attempting direct API call as fallback after network error:', directApiUrl);
      
      const directXhr = new XMLHttpRequest();
      directXhr.open(options.method || 'GET', directApiUrl, true);
      directXhr.setRequestHeader('Accept', 'application/json');
      directXhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      directXhr.withCredentials = true;
      
      directXhr.onload = function() {
        if (directXhr.getResponseHeader('content-type') && 
            directXhr.getResponseHeader('content-type').includes('application/json')) {
          try {
            const data = JSON.parse(directXhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error('Failed to parse JSON from direct API call'));
          }
        } else {
          // If direct API call also fails, return mock data
          console.error('⚠️ Direct API call also failed after network error. Using mock data.');
          resolve(getMockData(endpoint));
        }
      };
      
      directXhr.onerror = function() {
        console.error('⚠️ Direct API call failed after network error:', directXhr.statusText);
        // Return mock data as last resort
        resolve(getMockData(endpoint));
      };
      
      // Send the direct request
      directXhr.send(options.body ? JSON.stringify(options.body) : null);
    };
    
    // Send the request
    xhr.send(options.body ? JSON.stringify(options.body) : null);
  });
};

// Helper function to get mock data
const getMockData = (endpoint) => {
  console.log('Using mock data for endpoint:', endpoint);
  
  // Mock data for different endpoints
  if (endpoint === '/health') {
    return { status: 'ok', message: 'Mock API health check succeeded', timestamp: new Date().toISOString() };
  } else if (endpoint.includes('/orders/') && !endpoint.includes('/api/orders/')) {
    // Single order detail - ensure endpoint paths are consistent
    const orderId = endpoint.split('/').pop();
    return {
      id: orderId,
      status: 'In Progress',
      amount: 1250.00,
      description: 'Service Description (Mock Order API - API Unavailable)',
      serviceType: 'Service Type',
      sellerName: 'Service Provider Name',
      createdAt: new Date().toISOString(),
      buyerId: 'user-123',
      sellerId: 'user-456',
      buyerName: 'Client Name',
      role: 'buyer'
    };
  } else {
    // Orders list
    return [
      {
        id: 'mock-integration-12345',
        status: 'In Progress',
        amount: 1250.00,
        description: 'First Service (Mock Order API - API Unavailable)',
        serviceType: 'Service Type A',
        sellerName: 'Provider A',
        createdAt: new Date().toISOString(),
        buyerId: 'user-123',
        sellerId: 'user-456',
        buyerName: 'Client',
        role: 'buyer'
      },
      {
        id: 'mock-integration-67890',
        status: 'Completed',
        amount: 350.00,
        description: 'Second Service (Mock Order API - API Unavailable)',
        serviceType: 'Service Type B',
        sellerName: 'Provider B',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        buyerId: 'user-123',
        sellerId: 'user-789',
        buyerName: 'Client',
        role: 'buyer'
      }
    ];
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

  // Order list page component using OrderDetailCard
  const OrdersListPage = () => {
    const navigate = useNavigate();
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
          console.error('Server health check failed:', err);
          setServerStatus('not-running');
        }
      };
      
      checkServerStatus();
    }, []);

    // Fetch orders from API
    useEffect(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          console.log('Fetching orders from API...');
          
          // Use the callApi helper with correct API path
          const data = await callApi('/api/orders');
          console.log('Successfully fetched orders:', data);
          setOrders(data);
          setError(null);
        } catch (err) {
          console.error('❌ Error fetching orders:', err);
          setError(err.message);
          
          // Fallback to mock data in case of API error
          setOrders([
            {
              id: '12345',
              status: 'In Progress',
              amount: 1250.00,
              description: 'AC Replacement Service',
              serviceType: 'AC Replacement',
              sellerName: 'AC Services Inc.',
              createdAt: new Date().toISOString(),
              buyerId: 'user-123',
              sellerId: 'user-456',
              buyerName: 'John Doe',
              role: 'buyer'
            },
            {
              id: '12346',
              status: 'Completed',
              amount: 350.00,
              description: 'Plumbing repair services',
              serviceType: 'Plumbing Repair',
              sellerName: 'Reliable Plumbing Co.',
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              buyerId: 'user-123',
              sellerId: 'user-789',
              buyerName: 'John Doe',
              role: 'buyer'
            }
          ]);
        } finally {
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
            console.error('Error rendering OrderDetailCard:', error);
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
    const navigate = useNavigate();
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
          console.error(`Error fetching order ${orderId}:`, err);
          setError(err.message);
          
          // Fallback mock data
          setOrder({
            id: orderId,
            status: 'In Progress',
            amount: 1250.00,
            description: 'Service Description (Mock Data)',
            serviceType: 'Service Type',
            sellerName: 'Service Provider Name',
            createdAt: new Date().toISOString(),
            buyerId: 'user-123',
            sellerId: 'user-456',
            buyerName: 'Client Name',
            role: 'buyer'
          });
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

  return React.createElement(
    Routes,
    null,
    // List all orders
    React.createElement(
      Route,
      { 
        path: "/", 
        element: React.createElement(OrdersListPage)
      }
    ),
    
    // View a specific order
    React.createElement(
      Route,
      { 
        path: "/:orderId", 
        element: React.createElement(OrderDetailPage)
      }
    ),
    
    // Redirect any unmatched routes to main orders page
    React.createElement(
      Route,
      { 
        path: "*", 
        element: React.createElement(Navigate, { to: ORDERS_LIST, replace: true })
      }
    )
  );
};

export default OrdersRouter;
