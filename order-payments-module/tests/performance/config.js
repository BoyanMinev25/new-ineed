/**
 * Performance testing configuration
 * 
 * This file defines the performance thresholds and test parameters
 * for automated performance testing in the CI/CD pipeline.
 */

module.exports = {
  // Performance test server configuration
  server: {
    port: process.env.PERF_TEST_PORT || 3333,
    host: process.env.PERF_TEST_HOST || 'localhost',
  },
  
  // Lighthouse configuration for page performance audits
  lighthouse: {
    // Chrome flags for running Lighthouse
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    // Categories to audit
    categories: ['performance', 'accessibility', 'best-practices'],
    // Number of runs per page for calculating median values
    runs: 3,
  },
  
  // React performance metrics thresholds
  reactMetrics: {
    // Maximum render times in milliseconds
    maxRenderTimes: {
      OrdersListPage: 100,
      OrderDetailCard: 50,
      PaymentSummary: 30,
      OrderTimeline: 40,
      PaymentProcessingPage: 80,
    },
    // Maximum memory usage increase in MB
    maxMemoryIncrease: {
      OrdersListPage: 5,
      OrderDetailCard: 2,
      PaymentSummary: 1,
      OrderTimeline: 1,
      PaymentProcessingPage: 3,
    },
  },
  
  // API performance thresholds in milliseconds
  apiThresholds: {
    getOrders: 200,
    getOrderDetails: 150,
    createPaymentIntent: 300,
    confirmPayment: 300,
    uploadDeliveryFile: 500,
  },
  
  // Bundle size thresholds in kilobytes
  bundleSizeThresholds: {
    main: 250,
    vendor: 500,
    total: 1000,
  },
  
  // Test scenarios with typical data sizes
  scenarios: {
    // Small dataset (e.g., 10 orders)
    small: {
      orderCount: 10,
      itemsPerOrder: 2,
    },
    // Medium dataset (e.g., 100 orders)
    medium: {
      orderCount: 100,
      itemsPerOrder: 5,
    },
    // Large dataset (e.g., 1000 orders)
    large: {
      orderCount: 1000,
      itemsPerOrder: 10,
    },
  },
  
  // URLs to test in the application
  testUrls: [
    '/orders',
    '/orders/123',
    '/orders/123/payment',
    '/orders/123/delivery',
    '/orders/123/resolution',
  ],
}; 