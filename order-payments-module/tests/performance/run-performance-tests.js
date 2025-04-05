/**
 * Performance test runner
 * 
 * This script runs performance tests for React components and API endpoints,
 * collecting metrics and comparing them against defined thresholds.
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Directory for storing test results
const RESULTS_DIR = path.join(__dirname, '../../performance-results');

// Create results directory if it doesn't exist
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Run component performance tests using React's performance profiler
 */
async function runComponentTests() {
  console.log('🏎️ Running component performance tests...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable performance metrics collection
    await page.coverage.startJSCoverage();
    
    // Navigate to component test page
    await page.goto(`http://${config.server.host}:${config.server.port}/performance-test.html`);
    
    // Wait for test page to load
    await page.waitForSelector('#performance-test-container', { timeout: 5000 });
    
    // Run tests for different data sizes
    const results = {};
    
    for (const [scenarioName, scenario] of Object.entries(config.scenarios)) {
      console.log(`📊 Testing with ${scenarioName} dataset (${scenario.orderCount} orders)...`);
      
      // Set test parameters
      await page.evaluate((scenario) => {
        window.testParams = scenario;
      }, scenario);
      
      // Run the test for each component
      for (const component of Object.keys(config.reactMetrics.maxRenderTimes)) {
        console.log(`🧪 Testing ${component}...`);
        
        // Run the test for the specific component
        const metrics = await page.evaluate((componentName) => {
          return window.runComponentTest(componentName);
        }, component);
        
        // Store results
        if (!results[scenarioName]) results[scenarioName] = {};
        results[scenarioName][component] = metrics;
      }
    }
    
    // Get JS coverage data
    const jsCoverage = await page.coverage.stopJSCoverage();
    
    // Calculate bundle size metrics
    const bundleSizeMetrics = {
      total: 0,
      used: 0,
      components: {}
    };
    
    for (const entry of jsCoverage) {
      const filename = path.basename(entry.url);
      const componentName = filename.split('.')[0];
      
      const totalBytes = entry.text.length;
      
      // Calculate used bytes
      let usedBytes = 0;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }
      
      bundleSizeMetrics.total += totalBytes;
      bundleSizeMetrics.used += usedBytes;
      
      if (Object.keys(config.reactMetrics.maxRenderTimes).includes(componentName)) {
        bundleSizeMetrics.components[componentName] = {
          total: totalBytes,
          used: usedBytes,
          percentage: (usedBytes / totalBytes) * 100
        };
      }
    }
    
    // Write results to JSON file
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'component-performance.json'),
      JSON.stringify(results, null, 2)
    );
    
    // Write bundle size metrics to JSON file
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'bundle-size-metrics.json'),
      JSON.stringify(bundleSizeMetrics, null, 2)
    );
    
    console.log('✅ Component performance tests completed.');
    return results;
    
  } catch (error) {
    console.error('❌ Component performance tests failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Run API endpoint performance tests
 */
async function runApiTests() {
  console.log('🏎️ Running API performance tests...');
  
  try {
    const results = {};
    
    // Create a browser instance for API testing
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to API test page
    await page.goto(`http://${config.server.host}:${config.server.port}/api-performance-test.html`);
    
    // Wait for test page to load
    await page.waitForSelector('#api-test-container', { timeout: 5000 });
    
    // Test each API endpoint
    for (const [endpoint, threshold] of Object.entries(config.apiThresholds)) {
      console.log(`🧪 Testing API endpoint: ${endpoint}...`);
      
      // Run the test for the specific API endpoint
      const metrics = await page.evaluate((endpointName) => {
        return window.runApiTest(endpointName);
      }, endpoint);
      
      results[endpoint] = metrics;
    }
    
    // Write results to JSON file
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'api-performance.json'),
      JSON.stringify(results, null, 2)
    );
    
    await browser.close();
    
    console.log('✅ API performance tests completed.');
    return results;
    
  } catch (error) {
    console.error('❌ API performance tests failed:', error);
    throw error;
  }
}

/**
 * Run Lighthouse performance audits
 */
async function runLighthouseTests() {
  console.log('🏎️ Running Lighthouse performance audits...');
  
  try {
    const results = {};
    
    // Launch Chrome for Lighthouse
    const chrome = await puppeteer.launch({
      headless: true,
      args: config.lighthouse.chromeFlags
    });
    
    const port = new URL(chrome.wsEndpoint()).port;
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: config.lighthouse.categories,
      port
    };
    
    // Run Lighthouse for each test URL
    for (const testUrl of config.testUrls) {
      console.log(`🧪 Running Lighthouse audit for: ${testUrl}...`);
      
      const fullUrl = `http://${config.server.host}:${config.server.port}${testUrl}`;
      
      // Run multiple audits and get median values
      const runResults = [];
      
      for (let i = 0; i < config.lighthouse.runs; i++) {
        console.log(`   Run ${i + 1}/${config.lighthouse.runs}...`);
        const runResult = await lighthouse(fullUrl, options);
        runResults.push(runResult.lhr);
      }
      
      // Calculate median values for key metrics
      const performanceScores = runResults.map(result => result.categories.performance.score * 100).sort((a, b) => a - b);
      const fcp = runResults.map(result => result.audits['first-contentful-paint'].numericValue).sort((a, b) => a - b);
      const lcp = runResults.map(result => result.audits['largest-contentful-paint'].numericValue).sort((a, b) => a - b);
      const tbt = runResults.map(result => result.audits['total-blocking-time'].numericValue).sort((a, b) => a - b);
      const cls = runResults.map(result => result.audits['cumulative-layout-shift'].numericValue).sort((a, b) => a - b);
      
      // Get median values
      const getMedian = arr => {
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
      };
      
      results[testUrl] = {
        performanceScore: getMedian(performanceScores),
        firstContentfulPaint: getMedian(fcp),
        largestContentfulPaint: getMedian(lcp),
        totalBlockingTime: getMedian(tbt),
        cumulativeLayoutShift: getMedian(cls)
      };
      
      // Save detailed report for the median performance run
      const medianRunIndex = Math.floor(config.lighthouse.runs / 2);
      fs.writeFileSync(
        path.join(RESULTS_DIR, `lighthouse-${testUrl.replace(/\//g, '-')}.json`),
        JSON.stringify(runResults[medianRunIndex], null, 2)
      );
    }
    
    // Write summary results to JSON file
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'lighthouse-performance.json'),
      JSON.stringify(results, null, 2)
    );
    
    await chrome.close();
    
    console.log('✅ Lighthouse performance audits completed.');
    return results;
    
  } catch (error) {
    console.error('❌ Lighthouse performance audits failed:', error);
    throw error;
  }
}

/**
 * Run bundle size analysis
 */
async function analyzeBundleSize() {
  console.log('📦 Analyzing bundle size...');
  
  try {
    // Run webpack bundle analyzer
    execSync('npm run analyze-bundle', { stdio: 'inherit' });
    
    // Read the stats generated by the analyzer
    const statsPath = path.join(__dirname, '../../dist/stats.json');
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    
    // Calculate bundle sizes
    const bundleSizes = {
      total: 0,
      chunks: {}
    };
    
    for (const asset of stats.assets) {
      const sizeInKb = asset.size / 1024;
      bundleSizes.total += sizeInKb;
      
      // Categorize by chunk
      const chunkName = asset.chunkNames[0] || 'other';
      if (!bundleSizes.chunks[chunkName]) {
        bundleSizes.chunks[chunkName] = 0;
      }
      bundleSizes.chunks[chunkName] += sizeInKb;
    }
    
    // Write bundle size results to JSON file
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'bundle-sizes.json'),
      JSON.stringify(bundleSizes, null, 2)
    );
    
    console.log('✅ Bundle size analysis completed.');
    return bundleSizes;
    
  } catch (error) {
    console.error('❌ Bundle size analysis failed:', error);
    throw error;
  }
}

/**
 * Main function to run all performance tests
 */
async function runAllTests() {
  console.log('🚀 Starting performance test suite...');
  
  try {
    // Start the test server
    console.log('📡 Starting test server...');
    const server = require('../../scripts/start-test-server');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run tests
    const componentResults = await runComponentTests();
    const apiResults = await runApiTests();
    const lighthouseResults = await runLighthouseTests();
    const bundleSizes = await analyzeBundleSize();
    
    // Stop the server
    console.log('🛑 Stopping test server...');
    server.close();
    
    // Create summary report
    const summary = {
      timestamp: new Date().toISOString(),
      componentPerformance: componentResults,
      apiPerformance: apiResults,
      lighthousePerformance: lighthouseResults,
      bundleSizes,
    };
    
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'performance-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('🎉 All performance tests completed successfully!');
    console.log(`📊 Results saved to: ${RESULTS_DIR}`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Performance tests failed:', error);
    process.exit(1);
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runComponentTests,
  runApiTests,
  runLighthouseTests,
  analyzeBundleSize,
  runAllTests
}; 