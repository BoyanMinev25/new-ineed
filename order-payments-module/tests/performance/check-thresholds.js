/**
 * Performance threshold checker
 * 
 * This script checks the performance test results against defined thresholds
 * and fails the build if any thresholds are exceeded.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Directory containing test results
const RESULTS_DIR = path.join(__dirname, '../../performance-results');

/**
 * Check if a value exceeds its threshold
 */
function exceedsThreshold(value, threshold) {
  return value > threshold;
}

/**
 * Check component performance metrics
 */
function checkComponentPerformance(results) {
  const failures = [];
  
  for (const [scenario, components] of Object.entries(results)) {
    for (const [component, metrics] of Object.entries(components)) {
      // Check render time
      if (exceedsThreshold(metrics.renderTime, config.reactMetrics.maxRenderTimes[component])) {
        failures.push(
          `❌ ${component} render time (${metrics.renderTime}ms) exceeds threshold ` +
          `(${config.reactMetrics.maxRenderTimes[component]}ms) in ${scenario} scenario`
        );
      }
      
      // Check memory increase
      if (exceedsThreshold(metrics.memoryIncrease, config.reactMetrics.maxMemoryIncrease[component])) {
        failures.push(
          `❌ ${component} memory increase (${metrics.memoryIncrease}MB) exceeds threshold ` +
          `(${config.reactMetrics.maxMemoryIncrease[component]}MB) in ${scenario} scenario`
        );
      }
    }
  }
  
  return failures;
}

/**
 * Check API performance metrics
 */
function checkApiPerformance(results) {
  const failures = [];
  
  for (const [endpoint, metrics] of Object.entries(results)) {
    if (exceedsThreshold(metrics.responseTime, config.apiThresholds[endpoint])) {
      failures.push(
        `❌ ${endpoint} response time (${metrics.responseTime}ms) exceeds threshold ` +
        `(${config.apiThresholds[endpoint]}ms)`
      );
    }
  }
  
  return failures;
}

/**
 * Check Lighthouse performance metrics
 */
function checkLighthousePerformance(results) {
  const failures = [];
  
  for (const [url, metrics] of Object.entries(results)) {
    // Check performance score (should be at least 90)
    if (metrics.performanceScore < 90) {
      failures.push(
        `❌ Lighthouse performance score for ${url} (${metrics.performanceScore}) is below threshold (90)`
      );
    }
    
    // Check First Contentful Paint (should be under 1.8s)
    if (metrics.firstContentfulPaint > 1800) {
      failures.push(
        `❌ First Contentful Paint for ${url} (${metrics.firstContentfulPaint}ms) exceeds threshold (1800ms)`
      );
    }
    
    // Check Largest Contentful Paint (should be under 2.5s)
    if (metrics.largestContentfulPaint > 2500) {
      failures.push(
        `❌ Largest Contentful Paint for ${url} (${metrics.largestContentfulPaint}ms) exceeds threshold (2500ms)`
      );
    }
    
    // Check Total Blocking Time (should be under 200ms)
    if (metrics.totalBlockingTime > 200) {
      failures.push(
        `❌ Total Blocking Time for ${url} (${metrics.totalBlockingTime}ms) exceeds threshold (200ms)`
      );
    }
    
    // Check Cumulative Layout Shift (should be under 0.1)
    if (metrics.cumulativeLayoutShift > 0.1) {
      failures.push(
        `❌ Cumulative Layout Shift for ${url} (${metrics.cumulativeLayoutShift}) exceeds threshold (0.1)`
      );
    }
  }
  
  return failures;
}

/**
 * Check bundle size metrics
 */
function checkBundleSizes(results) {
  const failures = [];
  
  // Check total bundle size
  if (exceedsThreshold(results.total, config.bundleSizeThresholds.total)) {
    failures.push(
      `❌ Total bundle size (${results.total}KB) exceeds threshold (${config.bundleSizeThresholds.total}KB)`
    );
  }
  
  // Check individual chunk sizes
  for (const [chunk, size] of Object.entries(results.chunks)) {
    const threshold = config.bundleSizeThresholds[chunk] || config.bundleSizeThresholds.vendor;
    
    if (exceedsThreshold(size, threshold)) {
      failures.push(
        `❌ ${chunk} chunk size (${size}KB) exceeds threshold (${threshold}KB)`
      );
    }
  }
  
  return failures;
}

/**
 * Main function to check all performance thresholds
 */
function checkThresholds() {
  console.log('🔍 Checking performance thresholds...');
  
  try {
    // Read test results
    const componentResults = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, 'component-performance.json'), 'utf8')
    );
    const apiResults = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, 'api-performance.json'), 'utf8')
    );
    const lighthouseResults = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, 'lighthouse-performance.json'), 'utf8')
    );
    const bundleSizes = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, 'bundle-sizes.json'), 'utf8')
    );
    
    // Check all metrics
    const failures = [
      ...checkComponentPerformance(componentResults),
      ...checkApiPerformance(apiResults),
      ...checkLighthousePerformance(lighthouseResults),
      ...checkBundleSizes(bundleSizes)
    ];
    
    // Report results
    if (failures.length > 0) {
      console.error('\n❌ Performance check failed!');
      console.error('\nFailed thresholds:');
      failures.forEach(failure => console.error(failure));
      process.exit(1);
    } else {
      console.log('\n✅ All performance thresholds passed!');
    }
    
  } catch (error) {
    console.error('❌ Error checking performance thresholds:', error);
    process.exit(1);
  }
}

// Run checks if this file is executed directly
if (require.main === module) {
  checkThresholds();
}

module.exports = {
  checkComponentPerformance,
  checkApiPerformance,
  checkLighthousePerformance,
  checkBundleSizes,
  checkThresholds
}; 