import * as stripeUtils from '../../lib/stripe-utils';
import { stripeConfig } from '../../config/stripe-config';

// Mock the console.log to avoid cluttering test output
global.console.log = jest.fn();

describe('Stripe Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('createStripePaymentIntent should create a payment intent with the correct amount', async () => {
    const result = await stripeUtils.createStripePaymentIntent(1000, 'USD', { orderId: 'test-order' });
    
    // Check that we get a properly formatted result
    expect(result).toHaveProperty('clientSecret');
    expect(result).toHaveProperty('paymentIntentId');
    expect(typeof result.clientSecret).toBe('string');
    expect(typeof result.paymentIntentId).toBe('string');
    expect(result.clientSecret).toContain('pi_');
    expect(result.clientSecret).toContain('_secret_');
    expect(result.paymentIntentId).toContain('pi_');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith('Creating payment intent for 1000 USD');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Using Stripe secret key: ${stripeConfig.secretKey.substring(0, 8)}`)
    );
  });
  
  test('initializeStripeElements should initialize elements with client secret', () => {
    const clientSecret = 'pi_mock_secret_123';
    const elementId = 'payment-element';
    
    const result = stripeUtils.initializeStripeElements(clientSecret, elementId);
    
    // Check result has submit function
    expect(result).toHaveProperty('submit');
    expect(typeof result.submit).toBe('function');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith(`Initializing Stripe Elements with client secret: ${clientSecret}`);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Using Stripe publishable key: ${stripeConfig.publishableKey}`)
    );
  });
  
  test('submit function should process payment without errors', async () => {
    const clientSecret = 'pi_mock_secret_123';
    const elementId = 'payment-element';
    
    const elements = stripeUtils.initializeStripeElements(clientSecret, elementId);
    const result = await elements.submit();
    
    // Verify no error is returned
    expect(result).toEqual({ error: undefined });
    expect(console.log).toHaveBeenCalledWith('Processing payment submission');
  });
  
  test('captureStripePayment should capture a payment intent', async () => {
    const paymentIntentId = 'pi_mock_123';
    
    const result = await stripeUtils.captureStripePayment(paymentIntentId);
    
    // Check that we get a properly formatted result
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('succeeded');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith(`Capturing payment for intent: ${paymentIntentId}`);
  });
  
  test('createStripeTransfer should transfer funds to a destination account', async () => {
    const amount = 100;
    const destinationAccountId = 'acct_mock_123';
    const paymentIntentId = 'pi_mock_123';
    
    const result = await stripeUtils.createStripeTransfer(amount, destinationAccountId, paymentIntentId);
    
    // Check that we get a properly formatted result
    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('string');
    expect(result.id).toContain('tr_');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith(
      `Creating transfer of ${amount} to account ${destinationAccountId}`
    );
  });
  
  test('createStripeRefund should refund a payment intent', async () => {
    const paymentIntentId = 'pi_mock_123';
    
    const result = await stripeUtils.createStripeRefund(paymentIntentId);
    
    // Check that we get a properly formatted result
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status');
    expect(typeof result.id).toBe('string');
    expect(result.id).toContain('re_');
    expect(result.status).toBe('succeeded');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith(`Creating refund for payment intent ${paymentIntentId}`);
  });
  
  test('createStripeRefund should handle partial refunds', async () => {
    const paymentIntentId = 'pi_mock_123';
    const amount = 50;
    
    const result = await stripeUtils.createStripeRefund(paymentIntentId, amount);
    
    // Check result
    expect(result.id).toContain('re_');
    expect(result.status).toBe('succeeded');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith(`Creating refund for payment intent ${paymentIntentId}`);
    expect(console.log).toHaveBeenCalledWith(`Partial refund: ${amount}`);
  });
  
  test('validateStripeWebhookEvent should validate webhook events', () => {
    const payload = { id: 'evt_mock_123' };
    const signature = 'mock_signature';
    const endpointSecret = 'whsec_mock_123';
    
    const result = stripeUtils.validateStripeWebhookEvent(payload, signature, endpointSecret);
    
    // Check that we get a properly formatted result
    expect(result).toHaveProperty('event');
    expect(result.event).toHaveProperty('type');
    expect(result.event).toHaveProperty('data');
    expect(result.event.type).toBe('payment_intent.succeeded');
    expect(result.event.data.object).toHaveProperty('id');
    expect(result.event.data.object).toHaveProperty('amount');
    expect(result.event.data.object).toHaveProperty('status');
    
    // Verify the console.log was called with the right parameters
    expect(console.log).toHaveBeenCalledWith('Validating Stripe webhook event');
  });
}); 