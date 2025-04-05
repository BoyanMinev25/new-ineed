/**
 * Stripe Configuration
 * 
 * This file manages Stripe API keys for different environments.
 * IMPORTANT: Never commit your actual API keys to version control.
 * Use environment variables or a .env file in production.
 */

// Environment type
type Environment = 'test' | 'production';

// Determine current environment
// In a real app, this would check process.env.NODE_ENV or a similar variable
const currentEnvironment: Environment = process.env.NODE_ENV === 'production' 
  ? 'production' 
  : 'test';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

// Configuration for different environments
const config: Record<Environment, StripeConfig> = {
  // Test environment keys (safe to commit these as they're just placeholders)
  test: {
    publishableKey: 'pk_test_YourTestPublishableKey',
    secretKey: 'sk_test_YourTestSecretKey',
    webhookSecret: 'whsec_YourTestWebhookSecret',
  },
  
  // Production keys (NEVER commit actual values - use environment variables)
  production: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  }
};

// Export the configuration for the current environment
export const stripeConfig = config[currentEnvironment];

// Helper function to validate that keys are properly set
export function validateStripeConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];
  
  if (!stripeConfig.publishableKey) missingKeys.push('publishableKey');
  if (!stripeConfig.secretKey) missingKeys.push('secretKey');
  if (!stripeConfig.webhookSecret) missingKeys.push('webhookSecret');
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
}

// Create a default export with the config and helpers
const stripeConfigExport = {
  ...stripeConfig,
  validateStripeConfig,
  currentEnvironment
};

export default stripeConfigExport;

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. For local/test development:
 *    - Replace the placeholder test keys with your actual Stripe test keys
 * 
 * 2. For production:
 *    - NEVER hardcode actual production keys in this file
 *    - Set the following environment variables:
 *      - STRIPE_PUBLISHABLE_KEY
 *      - STRIPE_SECRET_KEY
 *      - STRIPE_WEBHOOK_SECRET
 * 
 * 3. In your code, import and use like this:
 *    ```
 *    import { stripeConfig } from '../config/stripe-config';
 *    
 *    // Client-side (front-end)
 *    const stripe = Stripe(stripeConfig.publishableKey);
 *    
 *    // Server-side (back-end)
 *    const stripe = require('stripe')(stripeConfig.secretKey);
 *    ```
 */ 