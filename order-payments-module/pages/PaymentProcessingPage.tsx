import React, { useState, useEffect } from 'react';
import { Order, PaymentStatus } from '../models/order-models';
import { createStripePaymentIntent, initializeStripeElements } from '../lib/stripe-utils';

interface PaymentProcessingPageProps {
  order: Order;
  onPaymentComplete: (paymentIntentId: string) => void;
  onCancel: () => void;
}

/**
 * PaymentProcessingPage Component
 * 
 * Handles the payment processing flow using Stripe Elements.
 * Shows a payment form, processes the payment, and handles success/failure states.
 */
const PaymentProcessingPage: React.FC<PaymentProcessingPageProps> = ({
  order,
  onPaymentComplete,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentStatus, setPaymentStatus] = useState<'initial' | 'processing' | 'succeeded' | 'failed'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripeElements, setStripeElements] = useState<any>(null);

  // Initialize Stripe Elements when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create a payment intent with Stripe
        const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
          order.price.total * 100, // Convert to cents for Stripe
          order.price.currency,
          { orderId: order.id }
        );
        
        setClientSecret(clientSecret);
        setPaymentIntentId(paymentIntentId);
        
        // Initialize Stripe Elements
        const elements = initializeStripeElements(clientSecret, 'payment-element');
        setStripeElements(elements);
        
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError('Failed to initialize payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePayment();
  }, [order]);

  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripeElements) return;
    
    try {
      setPaymentStatus('processing');
      setError(null);
      
      // Submit the payment with Stripe Elements
      const { error } = await stripeElements.submit();
      
      if (error) {
        throw new Error(error.message || 'Failed to process payment');
      }
      
      // Payment succeeded
      setPaymentStatus('succeeded');
      
      // This is where we would typically confirm with our backend
      // that the payment was successful before proceeding
      
      // Notify parent component of successful payment
      if (paymentIntentId) {
        onPaymentComplete(paymentIntentId);
      }
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setPaymentStatus('failed');
    }
  };

  return (
    <div className="payment-processing-page max-w-xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Complete Your Payment</h2>
          <p className="text-sm text-gray-600 mt-1">
            You're ordering: {order.title}
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
            
            <div className="bg-gray-50 p-4 rounded border">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{order.title}</span>
                <span>{order.price.currency === 'USD' ? '$' : ''}{order.price.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Service Fee</span>
                <span>{order.price.currency === 'USD' ? '$' : ''}{order.price.fees.toFixed(2)}</span>
              </div>
              
              {order.price.taxes > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span>{order.price.currency === 'USD' ? '$' : ''}{order.price.taxes.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold pt-2 mt-2 border-t">
                <span>Total</span>
                <span>{order.price.currency === 'USD' ? '$' : ''}{order.price.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ) : error && paymentStatus !== 'processing' ? (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          ) : paymentStatus === 'succeeded' ? (
            <div className="bg-green-50 text-green-700 p-4 rounded text-center">
              <svg 
                className="mx-auto h-12 w-12 text-green-500 mb-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              <p className="font-medium">Payment Successful!</p>
              <p className="text-sm mt-1">Your order has been placed and payment has been processed successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
              
              {/* This div will be replaced by Stripe Elements */}
              <div id="payment-element" className="mb-6 border rounded p-3">
                {/* Stripe Elements will be mounted here */}
                <p className="text-gray-500 text-sm text-center py-8">
                  Stripe payment form would be rendered here in production
                </p>
              </div>
              
              {/* Payment processing error */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {/* Terms and conditions */}
              <div className="mb-6">
                <p className="text-xs text-gray-500">
                  By completing this payment, you agree to our Terms of Service and understand that your payment will be held securely until the service is complete.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  disabled={paymentStatus === 'processing'}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={paymentStatus === 'processing'}
                  className={`px-4 py-2 rounded text-white ${
                    paymentStatus === 'processing'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {paymentStatus === 'processing' ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Security Info */}
      <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
        <svg 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
        <span>Payments are secure and encrypted</span>
      </div>
    </div>
  );
};

export default PaymentProcessingPage; 