/**
 * Performance Testing Server
 * 
 * This script starts a server for running performance tests.
 * It serves test pages and mock API endpoints.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('../tests/performance/config');

// Create Express server
const app = express();

// Enable CORS
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Serve test pages from the test-pages directory
app.use('/test-pages', express.static(path.join(__dirname, '../tests/performance/test-pages')));

// Set up mock API endpoints for testing
app.get('/api/orders', (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const orders = generateMockOrders(count);
  
  // Add artificial delay based on data size
  const delay = Math.min(50 + count / 10, 300);
  
  setTimeout(() => {
    res.json({ orders });
  }, delay);
});

app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const order = generateMockOrder(orderId);
  
  // Add artificial delay
  setTimeout(() => {
    res.json({ order });
  }, 50);
});

app.post('/api/payment/create-intent', (req, res) => {
  const { orderId, amount } = req.body;
  
  // Add artificial delay
  setTimeout(() => {
    res.json({
      clientSecret: `pi_mock_${orderId}_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
      amount,
      currency: 'usd',
      id: `pi_mock_${orderId}_${Date.now()}`
    });
  }, 200);
});

app.post('/api/payment/confirm', (req, res) => {
  const { paymentIntentId } = req.body;
  
  // Add artificial delay
  setTimeout(() => {
    res.json({
      success: true,
      paymentIntentId,
      status: 'succeeded'
    });
  }, 250);
});

app.post('/api/delivery/upload', (req, res) => {
  // Add artificial delay
  setTimeout(() => {
    res.json({
      success: true,
      fileId: `file_${Date.now()}`,
      downloadUrl: `https://example.com/files/file_${Date.now()}`
    });
  }, 300);
});

// Serve main test pages
app.get('/performance-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/component-test.html'));
});

app.get('/api-performance-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/api-test.html'));
});

// Serve route-specific test pages
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/orders-list.html'));
});

app.get('/orders/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/order-detail.html'));
});

app.get('/orders/:id/payment', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/payment-processing.html'));
});

app.get('/orders/:id/delivery', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/delivery.html'));
});

app.get('/orders/:id/resolution', (req, res) => {
  res.sendFile(path.join(__dirname, '../tests/performance/test-pages/resolution.html'));
});

// Helper function to generate mock orders
function generateMockOrders(count) {
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const orderId = `order_${Date.now()}_${i}`;
    orders.push(generateMockOrder(orderId));
  }
  
  return orders;
}

// Helper function to generate a mock order
function generateMockOrder(orderId) {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: orderId,
    customerId: `cust_${Math.random().toString(36).substring(2, 10)}`,
    amount: Math.floor(Math.random() * 1000) + 50,
    currency: 'usd',
    status,
    items: generateMockItems(Math.floor(Math.random() * 5) + 1),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Helper function to generate mock order items
function generateMockItems(count) {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `item_${Date.now()}_${i}`,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 100) + 10,
      quantity: Math.floor(Math.random() * 3) + 1
    });
  }
  
  return items;
}

// Start the server
const server = app.listen(config.server.port, config.server.host, () => {
  console.log(`Performance test server running at http://${config.server.host}:${config.server.port}`);
});

module.exports = server; 