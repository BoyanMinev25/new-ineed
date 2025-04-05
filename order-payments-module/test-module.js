// Test script for the Order Payments Module
import * as OrderPaymentsModule from './dist/index.js';

console.log("Successfully imported the Order Payments Module!");
console.log("Available exports:");
console.log(Object.keys(OrderPaymentsModule));

// Check the OrderPaymentsModule.routes
console.log("\nModule routes configuration:");
console.log(OrderPaymentsModule.OrderPaymentsModule.routes);

// Check the routes
console.log("\nRoutes:");
console.log(OrderPaymentsModule.routes);

console.log("\nTest completed successfully!"); 