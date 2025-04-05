# Performance Testing Guide

This guide explains how to use the automated performance testing infrastructure for the Order Payments Module.

## Overview

The performance testing infrastructure allows you to:

1. Test component rendering performance with different data sizes
2. Measure API endpoint response times
3. Run Lighthouse audits for key pages
4. Track bundle sizes over time
5. Monitor performance trends

## Setup

To use the performance testing infrastructure, you'll need to:

1. Install all required dependencies:
   ```bash
   npm install
   ```

2. Make sure you have Chrome installed (required for Puppeteer and Lighthouse)

## Running Performance Tests

### Full Test Suite

To run the complete performance test suite:

```bash
npm run test:performance
```

This will:
- Start the test server
- Run component performance tests
- Test API endpoint response times
- Run Lighthouse audits
- Analyze bundle sizes
- Generate a comprehensive performance report

### Individual Tests

You can also run specific parts of the performance test suite:

#### Component Performance Tests

```bash
# Start the test server in one terminal
npm run start:test-server

# Run component tests in another terminal
node tests/performance/run-performance-tests.js --components
```

#### API Performance Tests

```bash
# Start the test server in one terminal
npm run start:test-server

# Run API tests in another terminal
node tests/performance/run-performance-tests.js --api
```

#### Lighthouse Audits

```bash
# Start the test server in one terminal
npm run start:test-server

# Run Lighthouse tests in another terminal
node tests/performance/run-performance-tests.js --lighthouse
```

#### Bundle Size Analysis

```bash
node tests/performance/run-performance-tests.js --bundle
```

## Test Configuration

Performance thresholds and test parameters are defined in `tests/performance/config.js`. This configuration includes:

- React component render time thresholds
- API response time thresholds
- Lighthouse performance score targets
- Bundle size limits
- Test scenarios with different data sizes

You can modify this configuration to adjust the thresholds based on your specific requirements.

## Test Results

After running the tests, results are saved to the `performance-results` directory:

- `component-performance.json`: Component render times and memory usage
- `api-performance.json`: API endpoint response times
- `lighthouse-performance.json`: Lighthouse audit results
- `bundle-sizes.json`: Bundle size analysis
- `performance-summary.json`: Complete summary of all test results

## CI/CD Integration

Performance tests are automatically run:

1. On every push to the `main` branch
2. On pull requests targeting the `main` branch
3. Weekly (every Sunday at midnight)
4. Manually via GitHub Actions workflow dispatch

The CI/CD pipeline will fail if any performance metric exceeds its defined threshold.

## Historical Tracking

Performance metrics are tracked over time to identify trends and regressions. Historical data is stored in the `performance-history` directory:

- Daily metrics: Last 30 days
- Weekly metrics: Last 12 weeks
- Monthly metrics: Last 12 months

You can view historical performance reports in `performance-history/performance-report.json`.

## Adding New Tests

### Adding a New Component Test

1. Add the component to the `reactMetrics.maxRenderTimes` and `reactMetrics.maxMemoryIncrease` objects in `tests/performance/config.js`
2. Create a mock implementation of the component in `tests/performance/test-pages/component-test.html`

### Adding a New API Test

1. Add the endpoint to the `apiThresholds` object in `tests/performance/config.js`
2. Add the endpoint configuration to the `ApiTestUtils.endpoints` object in `tests/performance/test-pages/api-test.html`
3. Update the test server in `scripts/start-test-server.js` to handle the new endpoint

### Adding a New Page Test

1. Add the page URL to the `testUrls` array in `tests/performance/config.js`
2. Create a test page in `tests/performance/test-pages/{page-name}.html`
3. Update the test server to serve the new page

## Troubleshooting

### Common Issues

1. **Tests fail to start**: Make sure Chrome is installed and accessible
2. **Component tests fail**: Check that React and ReactDOM are properly loaded in the test pages
3. **API tests timeout**: Verify that the test server is running on the configured port
4. **Lighthouse tests fail**: Ensure the test pages are properly rendered and accessible

### Debugging

For more detailed logging during test runs:

```bash
DEBUG=true npm run test:performance
```

## Best Practices

1. Run performance tests locally before pushing changes
2. Add performance tests for new components and API endpoints
3. Regularly review performance trends to identify regressions
4. Optimize bundle sizes by removing unused dependencies
5. Focus on improving real user metrics (LCP, FID, CLS)

## Additional Resources

- [Web Vitals](https://web.dev/vitals/) - Essential metrics for web performance
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Automated auditing tool
- [React Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) - Measuring render performance 