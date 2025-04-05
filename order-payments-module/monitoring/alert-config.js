// Alert Configuration for Order Payments Module
// This file defines alert thresholds and notification settings

const benchmarks = require('./performance-benchmarks');

module.exports = {
  // Alert thresholds (percentage above benchmark to trigger alert)
  thresholds: {
    api: {
      // Alert if response times exceed benchmark by this percentage
      responseTime: 25,
      // Alert if error rates exceed benchmark 
      errorRates: 10
    },
    components: {
      // Alert if render times exceed benchmark by this percentage
      renderTime: 30,
      // Alert if memory usage exceeds benchmark by this percentage
      memoryUsage: 20
    },
    database: {
      // Alert if query times exceed benchmark by this percentage
      queryTime: 25
    },
    pageMetrics: {
      // Alert if Lighthouse metrics exceed benchmark by this percentage
      firstContentfulPaint: 20,
      timeToInteractive: 20,
      totalBlockingTime: 25,
      largestContentfulPaint: 20
    }
  },
  
  // Alert notification channels
  notifications: {
    email: {
      enabled: true,
      recipients: ['dev-team@example.com', 'product-owner@example.com'],
      throttle: {
        // Don't send more than 1 alert per hour for the same issue
        timeWindow: 60 * 60 * 1000,
        maxAlerts: 1
      }
    },
    slack: {
      enabled: true,
      channels: ['#order-payments-alerts', '#dev-monitoring'],
      throttle: {
        // Don't send more than 3 alerts per hour for the same issue
        timeWindow: 60 * 60 * 1000,
        maxAlerts: 3
      }
    },
    dashboard: {
      enabled: true,
      // Always show all alerts on dashboard
      throttle: false
    }
  },
  
  // Alert severity levels
  severityLevels: {
    critical: {
      // Critical if metric exceeds benchmark by this percentage
      threshold: 50,
      // Auto-create incident in issue tracker
      createIncident: true,
      // Send SMS alerts for critical issues
      smsNotification: true
    },
    warning: {
      // Warning if metric exceeds benchmark by threshold percentage
      // (defined in thresholds above)
      createIncident: false,
      smsNotification: false
    },
    info: {
      // Info if metric is approaching threshold
      threshold: 80, // 80% of the way to warning threshold
      createIncident: false,
      smsNotification: false,
      // Only show on dashboard, no other notifications
      notificationChannels: ['dashboard']
    }
  }
}; 