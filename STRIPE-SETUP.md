# Stripe Integration Setup Guide

This guide will help you properly set up Stripe for processing payments in the application.

## Prerequisites

- A Stripe account (create one at [stripe.com](https://stripe.com) if you don't have one)
- The application codebase (which you already have)

## Steps to Configure Stripe

1. **Create a Stripe account**
   - Go to [stripe.com](https://stripe.com) and sign up for an account
   - Verify your email address

2. **Get your API keys**
   - Log in to your Stripe Dashboard
   - Go to Developers > API keys ([https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys))
   - You'll see two keys:
     - Publishable key (starts with `pk_test_` in test mode)
     - Secret key (starts with `sk_test_` in test mode)

3. **Update your environment variables**
   - Open the `.env` file at the root of your project
   - Update the following variables with your actual Stripe keys:
     ```
     REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
     STRIPE_SECRET_KEY=sk_test_your_secret_key_here
     ```

4. **Set up webhook (optional but recommended)**
   - In your Stripe Dashboard, go to Developers > Webhooks
   - Click "Add endpoint"
   - Set the URL to: `https://your-domain.com/api/orders/webhook` (use your actual domain)
   - Select events to listen for (at minimum, select `payment_intent.succeeded` and `payment_intent.payment_failed`)
   - After creating the webhook, you'll get a Signing Secret
   - Add this to your `.env` file:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
     ```

5. **Restart your application**
   - Make sure to restart your server after updating these environment variables

## Testing the Setup

To confirm your Stripe integration is working:

1. Run the test script:
   ```
   node test-stripe.js
   ```

2. Open your browser and go to:
   ```
   http://localhost:5002/api/stripe/config-check
   ```

If you see a success message, your Stripe integration is working correctly!

## Troubleshooting

- If you get an "Invalid API Key" error, double-check that your secret key is correctly copied from the Stripe Dashboard
- Make sure your account has completed the necessary verification steps in Stripe
- For webhook issues, verify that your endpoint URL is accessible from the internet

## Production Considerations

When moving to production:
- Replace test keys with production keys (start with `pk_live_` and `sk_live_`)
- Make sure your server is properly secured with HTTPS
- Handle errors gracefully in your payment flow
- Implement proper logging for payment-related events 