// Test script to check Stripe configuration
require('dotenv').config();

console.log('STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
if (process.env.STRIPE_SECRET_KEY) {
  console.log('Key starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 10));
}

try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
  
  // Try to make a simple API call
  stripe.paymentMethods.list({ limit: 1 })
    .then(response => {
      console.log('Stripe API call successful');
      console.log('Configuration status: OK');
    })
    .catch(err => {
      console.log('Stripe API call failed:', err.message);
      console.log('Configuration status: ERROR');
    });
} catch (error) {
  console.log('Stripe initialization error:', error.message);
  console.log('Configuration status: ERROR');
} 