/**
 * Order Payments Module - Integration Example
 * 
 * This file provides an example of how to integrate the Order Payments Module
 * with a main application. This is NOT a functional component, but rather
 * a demonstration of how the integration should be implemented.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Order Payments Module imports
import { 
  OrdersRouter, 
  routes, 
  orderPaymentsAuth, 
  OrderDetailCard,
  PaymentSummary
} from '../index';

const ExampleMainApp = () => {
  // Example: Initialize the Order Payments Module auth with the main app's auth
  useEffect(() => {
    // This would typically come from your authentication system
    const user = {
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'Example User',
      role: 'client' // or 'provider' or 'admin'
    };
    
    // Create the auth context for the Order Payments Module
    const mainAppAuth = {
      currentUser: user,
      isAuthenticated: true,
      roles: {
        isClient: () => user.role === 'client',
        isProvider: () => user.role === 'provider',
        isAdmin: () => user.role === 'admin',
      },
      getAuthToken: async () => 'example-auth-token',
      refreshAuthToken: async () => {}
    };
    
    // Initialize the Order Payments Module auth
    orderPaymentsAuth.initializeAuth(mainAppAuth);
  }, []);
  
  return (
    <BrowserRouter>
      <div className="main-app">
        <header className="main-app-header">
          <h1>Main Application</h1>
          <nav>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/app/orders">Orders</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/settings">Settings</Link></li>
            </ul>
          </nav>
        </header>
        
        <main className="main-app-content">
          <Routes>
            {/* Main app routes */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Integrate the Order Payments Module router */}
            <Route path="/app/*" element={
              <OrdersRouter 
                basePath="/app" 
                fallback={<div>Loading order module...</div>} 
              />
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

// Example Dashboard page that shows recent orders
const DashboardPage = () => {
  // Example order data
  const recentOrders = [
    {
      id: 'order-123',
      title: 'Website Design',
      description: 'Custom website design for a small business',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: new Date(Date.now() + 86400000 * 14), // 14 days from now
      price: {
        subtotal: 1000,
        fees: 50,
        taxes: 75,
        total: 1125,
        currency: 'USD'
      },
      paymentStatus: 'PENDING',
      clientId: 'user-123',
      providerId: 'provider-456',
      serviceId: 'service-789'
    }
  ];
  
  // Example navigation using the Order Payments Module routes
  const handleViewOrder = (orderId) => {
    // Generate the route to a specific order
    const orderRoute = routes.generateOrderRoute(routes.ORDER_DETAIL, orderId);
    window.location.href = orderRoute;
  };
  
  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>
      
      <section className="recent-orders">
        <h3>Recent Orders</h3>
        {recentOrders.map(order => (
          <div key={order.id} className="order-preview">
            {/* Use the OrderDetailCard component from the Order Payments Module */}
            <OrderDetailCard
              order={order}
              isCompact={true}
              onClick={() => handleViewOrder(order.id)}
            />
          </div>
        ))}
      </section>
    </div>
  );
};

// Stub components for the example
const ProfilePage = () => <div><h2>Profile Page</h2></div>;
const SettingsPage = () => <div><h2>Settings Page</h2></div>;

export default ExampleMainApp; 