// Performance Monitoring Service
// This service collects performance metrics and triggers alerts

const benchmarks = require('./performance-benchmarks');
const alertConfig = require('./alert-config');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      api: {},
      components: {},
      database: {},
      pageMetrics: {}
    };
    this.currentAlerts = new Map();
  }

  // Record API response time
  recordApiResponseTime(endpoint, timeMs) {
    if (!this.metrics.api[endpoint]) {
      this.metrics.api[endpoint] = [];
    }
    
    this.metrics.api[endpoint].push(timeMs);
    
    // Check if we need to trigger an alert
    const benchmark = this._getApiBenchmark(endpoint);
    if (benchmark && timeMs > benchmark) {
      const percentOver = ((timeMs - benchmark) / benchmark) * 100;
      this._checkAndTriggerAlert('api', 'responseTime', endpoint, timeMs, benchmark, percentOver);
    }
    
    // Trim metrics array to avoid memory issues
    if (this.metrics.api[endpoint].length > 100) {
      this.metrics.api[endpoint].shift();
    }
  }
  
  // Record component render time
  recordComponentRenderTime(component, timeMs) {
    if (!this.metrics.components[component]) {
      this.metrics.components[component] = [];
    }
    
    this.metrics.components[component].push(timeMs);
    
    // Check for alert trigger
    const benchmark = benchmarks.components.renderTime[component];
    if (benchmark && timeMs > benchmark) {
      const percentOver = ((timeMs - benchmark) / benchmark) * 100;
      this._checkAndTriggerAlert('components', 'renderTime', component, timeMs, benchmark, percentOver);
    }
    
    // Trim metrics array
    if (this.metrics.components[component].length > 50) {
      this.metrics.components[component].shift();
    }
  }
  
  // Record database query time
  recordDatabaseQueryTime(query, timeMs) {
    if (!this.metrics.database[query]) {
      this.metrics.database[query] = [];
    }
    
    this.metrics.database[query].push(timeMs);
    
    // Check for alert trigger
    const benchmark = benchmarks.database.queryTime[query];
    if (benchmark && timeMs > benchmark) {
      const percentOver = ((timeMs - benchmark) / benchmark) * 100;
      this._checkAndTriggerAlert('database', 'queryTime', query, timeMs, benchmark, percentOver);
    }
    
    // Trim metrics array
    if (this.metrics.database[query].length > 100) {
      this.metrics.database[query].shift();
    }
  }
  
  // Record Lighthouse page metrics
  recordPageMetrics(metrics) {
    Object.keys(metrics).forEach(metric => {
      if (benchmarks.pageMetrics[metric]) {
        if (!this.metrics.pageMetrics[metric]) {
          this.metrics.pageMetrics[metric] = [];
        }
        
        this.metrics.pageMetrics[metric].push(metrics[metric]);
        
        // Check for alert trigger
        const benchmark = benchmarks.pageMetrics[metric];
        const value = metrics[metric];
        
        if (benchmark && value > benchmark) {
          const percentOver = ((value - benchmark) / benchmark) * 100;
          this._checkAndTriggerAlert('pageMetrics', metric, 'page', value, benchmark, percentOver);
        }
        
        // Trim metrics array
        if (this.metrics.pageMetrics[metric].length > 30) {
          this.metrics.pageMetrics[metric].shift();
        }
      }
    });
  }
  
  // Get performance report
  getPerformanceReport() {
    const report = {};
    
    // Process each metric category
    Object.keys(this.metrics).forEach(category => {
      report[category] = {};
      
      Object.keys(this.metrics[category]).forEach(key => {
        const values = this.metrics[category][key];
        if (values.length > 0) {
          // Calculate statistics
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
          const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
          
          report[category][key] = {
            average: avg,
            p95: p95,
            p99: p99,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            count: values.length,
            benchmark: this._getBenchmark(category, key)
          };
        }
      });
    });
    
    return report;
  }
  
  // Private methods
  _getApiBenchmark(endpoint) {
    // Try to match endpoint to a benchmark
    for (const [key, value] of Object.entries(benchmarks.api.responseTime)) {
      if (endpoint.includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  }
  
  _getBenchmark(category, key) {
    if (category === 'api') {
      return this._getApiBenchmark(key);
    }
    
    if (benchmarks[category]) {
      // Handle nested objects in benchmarks
      for (const [metricType, metrics] of Object.entries(benchmarks[category])) {
        if (metrics[key]) {
          return metrics[key];
        }
      }
    }
    
    return null;
  }
  
  _checkAndTriggerAlert(category, metricType, name, value, benchmark, percentOver) {
    // Determine alert threshold
    const threshold = alertConfig.thresholds[category]?.[metricType] || 20;
    
    // Check if we should trigger an alert
    if (percentOver >= threshold) {
      const alertKey = `${category}:${metricType}:${name}`;
      const now = Date.now();
      
      // Check if we already have an active alert for this metric
      if (this.currentAlerts.has(alertKey)) {
        const lastAlert = this.currentAlerts.get(alertKey);
        
        // Respect throttling settings for each notification channel
        const shouldSendAlert = Object.entries(alertConfig.notifications)
          .filter(([_, config]) => config.enabled)
          .some(([channel, config]) => {
            if (!config.throttle) return true;
            
            const timeSinceLastAlert = now - lastAlert.timestamp;
            return timeSinceLastAlert >= config.throttle.timeWindow;
          });
        
        if (shouldSendAlert) {
          this._sendAlert(category, metricType, name, value, benchmark, percentOver);
          this.currentAlerts.set(alertKey, { timestamp: now, value, percentOver });
        }
      } else {
        this._sendAlert(category, metricType, name, value, benchmark, percentOver);
        this.currentAlerts.set(alertKey, { timestamp: now, value, percentOver });
      }
    }
  }
  
  _sendAlert(category, metricType, name, value, benchmark, percentOver) {
    // Determine severity
    let severity = 'info';
    
    if (percentOver >= alertConfig.severityLevels.critical.threshold) {
      severity = 'critical';
    } else if (percentOver >= alertConfig.thresholds[category]?.[metricType] || 20) {
      severity = 'warning';
    }
    
    const alert = {
      timestamp: new Date().toISOString(),
      category,
      metricType,
      name,
      value,
      benchmark,
      percentOver: Math.round(percentOver),
      severity
    };
    
    console.log(`[${severity.toUpperCase()}] Performance alert: ${category}.${metricType}.${name} - ${value}ms (${Math.round(percentOver)}% over benchmark)`);
    
    // Send to notification channels
    this._sendToNotificationChannels(alert, severity);
    
    // Create incident if necessary
    if (severity === 'critical' && alertConfig.severityLevels.critical.createIncident) {
      this._createIncident(alert);
    }
  }
  
  _sendToNotificationChannels(alert, severity) {
    // In a real implementation, this would send to actual notification channels
    // For this example, we'll just log
    Object.entries(alertConfig.notifications)
      .filter(([_, config]) => config.enabled)
      .forEach(([channel, _]) => {
        console.log(`Sending ${severity} alert to ${channel}`);
        // In real implementation:
        // if (channel === 'email') sendEmail(alert, alertConfig.notifications.email.recipients);
        // if (channel === 'slack') sendSlackMessage(alert, alertConfig.notifications.slack.channels);
      });
  }
  
  _createIncident(alert) {
    // In a real implementation, this would create an incident in your issue tracker
    console.log(`Creating incident for critical alert: ${alert.category}.${alert.metricType}.${alert.name}`);
  }
}

// Export singleton instance
const monitor = new PerformanceMonitor();
module.exports = monitor; 