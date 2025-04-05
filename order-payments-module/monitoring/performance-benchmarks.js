// Performance Benchmarks Configuration
// This file defines performance thresholds and metrics to monitor

module.exports = {
  // API Performance Metrics
  api: {
    // Maximum acceptable response times (ms)
    responseTime: {
      createOrder: 300,
      getOrderDetails: 200,
      listOrders: 400,
      processPayment: 500,
      createPaymentIntent: 600,
      confirmPayment: 400,
      uploadDeliveryFiles: 800,
      submitReview: 300
    },
    // Maximum acceptable error rates (percentage)
    errorRates: {
      orderEndpoints: 0.5,
      paymentEndpoints: 0.2,
      deliveryEndpoints: 1.0
    }
  },
  
  // Frontend Component Performance
  components: {
    // Target render times (ms)
    renderTime: {
      OrderTimeline: 120,
      OrderDetailsPage: 200,
      OrdersListPage: 150,
      PaymentProcessingPage: 180,
      DeliveryFileUploader: 100
    },
    // Maximum memory usage (MB)
    memoryUsage: {
      OrdersListPage: 10,
      OrderDetailsPage: 5
    },
    // Maximum acceptable bundle sizes (KB)
    bundleSize: {
      orderPaymentsModule: 250
    }
  },
  
  // Database Performance
  database: {
    // Maximum query execution times (ms)
    queryTime: {
      fetchOrders: 300,
      fetchOrderDetails: 200,
      updateOrderStatus: 250,
      fetchPaymentHistory: 300
    },
    // Maximum document sizes (KB)
    documentSize: {
      orderDocument: 50,
      paymentDocument: 30
    }
  },
  
  // General Page Performance (based on Lighthouse metrics)
  pageMetrics: {
    firstContentfulPaint: 1800,
    timeToInteractive: 3500,
    totalBlockingTime: 300,
    cumulativeLayoutShift: 0.1,
    largestContentfulPaint: 2500
  }
}; 