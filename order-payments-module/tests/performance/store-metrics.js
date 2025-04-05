/**
 * Performance metrics storage
 * 
 * This script stores performance test results for historical tracking
 * and trend analysis.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Directory containing test results
const RESULTS_DIR = path.join(__dirname, '../../performance-results');
const HISTORY_DIR = path.join(__dirname, '../../performance-history');

// Create history directory if it doesn't exist
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

/**
 * Get the current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

/**
 * Get the current time in HH:mm:ss format
 */
function getCurrentTime() {
  const date = new Date();
  return date.toTimeString().split(' ')[0];
}

/**
 * Load historical metrics
 */
function loadHistoricalMetrics() {
  const historyFile = path.join(HISTORY_DIR, 'performance-history.json');
  
  if (fs.existsSync(historyFile)) {
    return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  
  return {
    daily: {},
    weekly: {},
    monthly: {}
  };
}

/**
 * Update daily metrics
 */
function updateDailyMetrics(history, metrics) {
  const date = getCurrentDate();
  const time = getCurrentTime();
  
  if (!history.daily[date]) {
    history.daily[date] = {};
  }
  
  history.daily[date][time] = metrics;
  
  // Keep only the last 30 days of data
  const dates = Object.keys(history.daily).sort();
  if (dates.length > 30) {
    dates.slice(0, dates.length - 30).forEach(date => {
      delete history.daily[date];
    });
  }
}

/**
 * Update weekly metrics
 */
function updateWeeklyMetrics(history, metrics) {
  const date = new Date();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
  const weekKey = weekStart.toISOString().split('T')[0];
  
  if (!history.weekly[weekKey]) {
    history.weekly[weekKey] = {
      metrics: [],
      average: null
    };
  }
  
  history.weekly[weekKey].metrics.push(metrics);
  
  // Calculate weekly average
  const metricsList = history.weekly[weekKey].metrics;
  history.weekly[weekKey].average = calculateAverageMetrics(metricsList);
  
  // Keep only the last 12 weeks of data
  const weeks = Object.keys(history.weekly).sort();
  if (weeks.length > 12) {
    weeks.slice(0, weeks.length - 12).forEach(week => {
      delete history.weekly[week];
    });
  }
}

/**
 * Update monthly metrics
 */
function updateMonthlyMetrics(history, metrics) {
  const date = new Date();
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  if (!history.monthly[monthKey]) {
    history.monthly[monthKey] = {
      metrics: [],
      average: null
    };
  }
  
  history.monthly[monthKey].metrics.push(metrics);
  
  // Calculate monthly average
  const metricsList = history.monthly[monthKey].metrics;
  history.monthly[monthKey].average = calculateAverageMetrics(metricsList);
  
  // Keep only the last 12 months of data
  const months = Object.keys(history.monthly).sort();
  if (months.length > 12) {
    months.slice(0, months.length - 12).forEach(month => {
      delete history.monthly[month];
    });
  }
}

/**
 * Calculate average metrics from a list of metrics
 */
function calculateAverageMetrics(metricsList) {
  const average = {
    componentPerformance: {},
    apiPerformance: {},
    lighthousePerformance: {},
    bundleSizes: {
      total: 0,
      chunks: {}
    }
  };
  
  // Calculate component performance averages
  for (const scenario of Object.keys(metricsList[0].componentPerformance)) {
    average.componentPerformance[scenario] = {};
    
    for (const component of Object.keys(metricsList[0].componentPerformance[scenario])) {
      average.componentPerformance[scenario][component] = {
        renderTime: 0,
        memoryIncrease: 0
      };
      
      metricsList.forEach(metrics => {
        average.componentPerformance[scenario][component].renderTime +=
          metrics.componentPerformance[scenario][component].renderTime;
        average.componentPerformance[scenario][component].memoryIncrease +=
          metrics.componentPerformance[scenario][component].memoryIncrease;
      });
      
      average.componentPerformance[scenario][component].renderTime /= metricsList.length;
      average.componentPerformance[scenario][component].memoryIncrease /= metricsList.length;
    }
  }
  
  // Calculate API performance averages
  for (const endpoint of Object.keys(metricsList[0].apiPerformance)) {
    average.apiPerformance[endpoint] = {
      responseTime: 0
    };
    
    metricsList.forEach(metrics => {
      average.apiPerformance[endpoint].responseTime +=
        metrics.apiPerformance[endpoint].responseTime;
    });
    
    average.apiPerformance[endpoint].responseTime /= metricsList.length;
  }
  
  // Calculate Lighthouse performance averages
  for (const url of Object.keys(metricsList[0].lighthousePerformance)) {
    average.lighthousePerformance[url] = {
      performanceScore: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      totalBlockingTime: 0,
      cumulativeLayoutShift: 0
    };
    
    metricsList.forEach(metrics => {
      average.lighthousePerformance[url].performanceScore +=
        metrics.lighthousePerformance[url].performanceScore;
      average.lighthousePerformance[url].firstContentfulPaint +=
        metrics.lighthousePerformance[url].firstContentfulPaint;
      average.lighthousePerformance[url].largestContentfulPaint +=
        metrics.lighthousePerformance[url].largestContentfulPaint;
      average.lighthousePerformance[url].totalBlockingTime +=
        metrics.lighthousePerformance[url].totalBlockingTime;
      average.lighthousePerformance[url].cumulativeLayoutShift +=
        metrics.lighthousePerformance[url].cumulativeLayoutShift;
    });
    
    average.lighthousePerformance[url].performanceScore /= metricsList.length;
    average.lighthousePerformance[url].firstContentfulPaint /= metricsList.length;
    average.lighthousePerformance[url].largestContentfulPaint /= metricsList.length;
    average.lighthousePerformance[url].totalBlockingTime /= metricsList.length;
    average.lighthousePerformance[url].cumulativeLayoutShift /= metricsList.length;
  }
  
  // Calculate bundle size averages
  metricsList.forEach(metrics => {
    average.bundleSizes.total += metrics.bundleSizes.total;
    
    for (const [chunk, size] of Object.entries(metrics.bundleSizes.chunks)) {
      if (!average.bundleSizes.chunks[chunk]) {
        average.bundleSizes.chunks[chunk] = 0;
      }
      average.bundleSizes.chunks[chunk] += size;
    }
  });
  
  average.bundleSizes.total /= metricsList.length;
  
  for (const chunk of Object.keys(average.bundleSizes.chunks)) {
    average.bundleSizes.chunks[chunk] /= metricsList.length;
  }
  
  return average;
}

/**
 * Generate performance report
 */
function generateReport(history) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      daily: {},
      weekly: {},
      monthly: {}
    },
    trends: {
      componentPerformance: {},
      apiPerformance: {},
      lighthousePerformance: {},
      bundleSizes: {}
    }
  };
  
  // Add daily summary
  const today = getCurrentDate();
  if (history.daily[today]) {
    report.summary.daily = history.daily[today];
  }
  
  // Add weekly summary
  const date = new Date();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const weekKey = weekStart.toISOString().split('T')[0];
  if (history.weekly[weekKey]) {
    report.summary.weekly = history.weekly[weekKey].average;
  }
  
  // Add monthly summary
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (history.monthly[monthKey]) {
    report.summary.monthly = history.monthly[monthKey].average;
  }
  
  // Calculate trends
  const weeks = Object.keys(history.weekly).sort();
  if (weeks.length >= 2) {
    const currentWeek = weeks[weeks.length - 1];
    const previousWeek = weeks[weeks.length - 2];
    
    report.trends = calculateTrends(
      history.weekly[currentWeek].average,
      history.weekly[previousWeek].average
    );
  }
  
  return report;
}

/**
 * Calculate performance trends between two sets of metrics
 */
function calculateTrends(current, previous) {
  const trends = {
    componentPerformance: {},
    apiPerformance: {},
    lighthousePerformance: {},
    bundleSizes: {}
  };
  
  // Calculate component performance trends
  for (const scenario of Object.keys(current.componentPerformance)) {
    trends.componentPerformance[scenario] = {};
    
    for (const component of Object.keys(current.componentPerformance[scenario])) {
      trends.componentPerformance[scenario][component] = {
        renderTime: calculateTrend(
          current.componentPerformance[scenario][component].renderTime,
          previous.componentPerformance[scenario][component].renderTime
        ),
        memoryIncrease: calculateTrend(
          current.componentPerformance[scenario][component].memoryIncrease,
          previous.componentPerformance[scenario][component].memoryIncrease
        )
      };
    }
  }
  
  // Calculate API performance trends
  for (const endpoint of Object.keys(current.apiPerformance)) {
    trends.apiPerformance[endpoint] = {
      responseTime: calculateTrend(
        current.apiPerformance[endpoint].responseTime,
        previous.apiPerformance[endpoint].responseTime
      )
    };
  }
  
  // Calculate Lighthouse performance trends
  for (const url of Object.keys(current.lighthousePerformance)) {
    trends.lighthousePerformance[url] = {
      performanceScore: calculateTrend(
        current.lighthousePerformance[url].performanceScore,
        previous.lighthousePerformance[url].performanceScore
      ),
      firstContentfulPaint: calculateTrend(
        current.lighthousePerformance[url].firstContentfulPaint,
        previous.lighthousePerformance[url].firstContentfulPaint
      ),
      largestContentfulPaint: calculateTrend(
        current.lighthousePerformance[url].largestContentfulPaint,
        previous.lighthousePerformance[url].largestContentfulPaint
      ),
      totalBlockingTime: calculateTrend(
        current.lighthousePerformance[url].totalBlockingTime,
        previous.lighthousePerformance[url].totalBlockingTime
      ),
      cumulativeLayoutShift: calculateTrend(
        current.lighthousePerformance[url].cumulativeLayoutShift,
        previous.lighthousePerformance[url].cumulativeLayoutShift
      )
    };
  }
  
  // Calculate bundle size trends
  trends.bundleSizes = {
    total: calculateTrend(current.bundleSizes.total, previous.bundleSizes.total),
    chunks: {}
  };
  
  for (const chunk of Object.keys(current.bundleSizes.chunks)) {
    trends.bundleSizes.chunks[chunk] = calculateTrend(
      current.bundleSizes.chunks[chunk],
      previous.bundleSizes.chunks[chunk]
    );
  }
  
  return trends;
}

/**
 * Calculate trend percentage between two values
 */
function calculateTrend(current, previous) {
  return ((current - previous) / previous) * 100;
}

/**
 * Main function to store performance metrics
 */
function storeMetrics() {
  console.log('💾 Storing performance metrics...');
  
  try {
    // Load current test results
    const metrics = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, 'performance-summary.json'), 'utf8')
    );
    
    // Load historical metrics
    const history = loadHistoricalMetrics();
    
    // Update metrics history
    updateDailyMetrics(history, metrics);
    updateWeeklyMetrics(history, metrics);
    updateMonthlyMetrics(history, metrics);
    
    // Generate performance report
    const report = generateReport(history);
    
    // Save updated history
    fs.writeFileSync(
      path.join(HISTORY_DIR, 'performance-history.json'),
      JSON.stringify(history, null, 2)
    );
    
    // Save performance report
    fs.writeFileSync(
      path.join(HISTORY_DIR, 'performance-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Performance metrics stored successfully!');
    console.log(`📊 History saved to: ${HISTORY_DIR}`);
    
  } catch (error) {
    console.error('❌ Error storing performance metrics:', error);
    process.exit(1);
  }
}

// Store metrics if this file is executed directly
if (require.main === module) {
  storeMetrics();
}

module.exports = {
  loadHistoricalMetrics,
  updateDailyMetrics,
  updateWeeklyMetrics,
  updateMonthlyMetrics,
  generateReport,
  calculateTrends,
  storeMetrics
}; 