import * as stripeUtils from '../../lib/stripe-utils';
import { Order, OrderStatus, PaymentStatus } from '../../models/order-models';
import { stripeConfig } from '../../config/stripe-config';

// Mock firestore functions - would be replaced with actual firestore mocks in a real test
const mockUpdateOrder = jest.fn();
const mockCreateOrderEvent = jest.fn();

// Mock order data for testing
const mockOrder: Order = {
  id: 'order-123456789',
  clientId: 'client-123',
  providerId: 'provider-456',
  serviceId: 'service-789',
  title: 'Test Order',
  description: 'This is a test order description.',
  status: OrderStatus.CONFIRMED,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  deadline: new Date('2023-02-01'),
  price: {
    subtotal: 100,
    fees: 10,
    taxes: 5,
    total: 115,
    currency: 'USD'
  },
  paymentStatus: PaymentStatus.PENDING
};

// Mock console.log to avoid cluttering test output
global.console.log = jest.fn();

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Complete payment flow: creation to release', async () => {
    // Step 1: Create a payment intent
    const paymentCreation = await stripeUtils.createStripePaymentIntent(
      mockOrder.price.total * 100, // Convert to cents for Stripe
      mockOrder.price.currency,
      { orderId: mockOrder.id }
    );
    
    // Validate payment intent was created
    expect(paymentCreation).toHaveProperty('clientSecret');
    expect(paymentCreation).toHaveProperty('paymentIntentId');
    
    // Step 2: Initialize Stripe Elements (client-side)
    const elements = stripeUtils.initializeStripeElements(
      paymentCreation.clientSecret, 
      'payment-element-container'
    );
    
    // Step 3: Submit payment (client-side)
    const submission = await elements.submit();
    expect(submission).toEqual({ error: undefined });
    
    // Step 4: Update order with payment intent ID
    const orderWithPayment = {
      ...mockOrder,
      paymentIntent: paymentCreation.paymentIntentId
    };
    mockUpdateOrder(orderWithPayment);
    expect(mockUpdateOrder).toHaveBeenCalledWith(orderWithPayment);
    
    // Step 5: Capture payment (server-side on successful submission)
    const capture = await stripeUtils.captureStripePayment(paymentCreation.paymentIntentId);
    expect(capture.status).toBe('succeeded');
    
    // Step 6: Update order status and payment status
    const orderAfterCapture = {
      ...orderWithPayment,
      status: OrderStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.HELD,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderAfterCapture);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'payment_captured',
      description: 'Payment was successfully captured and is being held in escrow',
    });
    
    expect(mockUpdateOrder).toHaveBeenCalledWith(orderAfterCapture);
    expect(mockCreateOrderEvent).toHaveBeenCalled();
    
    // Step 7: Mark order as delivered
    const orderDelivered = {
      ...orderAfterCapture,
      status: OrderStatus.DELIVERED,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderDelivered);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'order_delivered',
      description: 'Provider has marked the order as delivered',
    });
    
    // Step 8: Client accepts delivery, mark as complete
    const orderCompleted = {
      ...orderDelivered,
      status: OrderStatus.COMPLETED,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderCompleted);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'order_completed',
      description: 'Client has accepted the delivery and marked the order as complete',
    });
    
    // Step 9: Release payment to provider
    const transfer = await stripeUtils.createStripeTransfer(
      mockOrder.price.total * 100 * 0.9, // Provider gets 90% of the total (after platform fee)
      'acct_provider_456', // Provider's Stripe account ID
      paymentCreation.paymentIntentId
    );
    
    expect(transfer).toHaveProperty('id');
    expect(transfer.id).toContain('tr_');
    
    // Step 10: Update order payment status
    const orderWithReleasedPayment = {
      ...orderCompleted,
      paymentStatus: PaymentStatus.RELEASED,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderWithReleasedPayment);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'payment_released',
      description: 'Payment has been released to the provider',
    });
    
    expect(mockUpdateOrder).toHaveBeenCalledWith(orderWithReleasedPayment);
    expect(mockCreateOrderEvent).toHaveBeenCalled();
    
    // Verify all required steps were called
    expect(mockUpdateOrder).toHaveBeenCalledTimes(5);
    expect(mockCreateOrderEvent).toHaveBeenCalledTimes(4);
  });
  
  test('Handles payment refund flow for cancelled orders', async () => {
    // Create and capture payment first (setup)
    const paymentCreation = await stripeUtils.createStripePaymentIntent(
      mockOrder.price.total * 100,
      mockOrder.price.currency,
      { orderId: mockOrder.id }
    );
    
    const orderWithPayment = {
      ...mockOrder,
      paymentIntent: paymentCreation.paymentIntentId,
      paymentStatus: PaymentStatus.HELD
    };
    
    // Step 1: Order is cancelled
    const orderCancelled = {
      ...orderWithPayment,
      status: OrderStatus.CANCELLED,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderCancelled);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'order_cancelled',
      description: 'Order has been cancelled',
    });
    
    // Step 2: Process refund
    const refund = await stripeUtils.createStripeRefund(
      paymentCreation.paymentIntentId,
      undefined, // Full refund
      'requested_by_customer'
    );
    
    expect(refund).toHaveProperty('id');
    expect(refund.id).toContain('re_');
    expect(refund.status).toBe('succeeded');
    
    // Step 3: Update order payment status
    const orderRefunded = {
      ...orderCancelled,
      paymentStatus: PaymentStatus.REFUNDED,
      updatedAt: expect.any(Date)
    };
    mockUpdateOrder(orderRefunded);
    mockCreateOrderEvent({
      orderId: mockOrder.id,
      type: 'payment_refunded',
      description: 'Payment has been refunded to the client',
    });
    
    expect(mockUpdateOrder).toHaveBeenCalledWith(orderRefunded);
    expect(mockCreateOrderEvent).toHaveBeenCalled();
  });
}); 