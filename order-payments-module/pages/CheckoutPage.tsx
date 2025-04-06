import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createStripePaymentIntent, initializeStripeElements } from '../lib/stripe-utils';
import routes from '../integration/navigation/routes';

interface CheckoutPageProps {
  fetchAdDetails?: (adId: string) => Promise<any>;
  createOrderFromAd?: (adId: string, details: OrderDetails) => Promise<any>;
  onCancel?: () => void;
}

interface OrderDetails {
  deliveryInstructions?: string;
  specialRequirements?: string;
  contactEmail?: string;
  contactPhone?: string;
  agreedToTerms: boolean;
}

/**
 * CheckoutPage Component
 * 
 * Handles the checkout flow for creating an order from a service ad.
 * Collects customer details, payment information, and processes the payment.
 */
const CheckoutPage: React.FC<CheckoutPageProps> = ({
  fetchAdDetails = defaultFetchAdDetails,
  createOrderFromAd = defaultCreateOrderFromAd,
  onCancel
}) => {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  
  const [adDetails, setAdDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    deliveryInstructions: '',
    specialRequirements: '',
    contactEmail: '',
    contactPhone: '',
    agreedToTerms: false
  });
  
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripeElements, setStripeElements] = useState<any>(null);

  // Fetch ad details when component mounts
  useEffect(() => {
    const getAdDetails = async () => {
      if (!adId) {
        setError('Missing ad ID');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const ad = await fetchAdDetails(adId);
        setAdDetails(ad);
      } catch (err: any) {
        console.error('Error fetching ad details:', err);
        setError('Could not load service details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getAdDetails();
  }, [adId, fetchAdDetails]);

  // Initialize Stripe when moving to payment step
  useEffect(() => {
    if (paymentStep !== 'payment' || !adDetails) return;
    
    const initializePayment = async () => {
      try {
        // Create a payment intent with Stripe
        const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
          adDetails.price * 100, // Convert to cents for Stripe
          adDetails.currency || 'USD',
          { adId, ...orderDetails }
        );
        
        setClientSecret(clientSecret);
        setPaymentIntentId(paymentIntentId);
        
        // Initialize Stripe Elements
        const elements = initializeStripeElements(clientSecret, 'payment-element');
        setStripeElements(elements);
        
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError('Failed to initialize payment. Please try again.');
        setPaymentStep('details');
      }
    };
    
    initializePayment();
  }, [paymentStep, adDetails, orderDetails, adId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setOrderDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle form submission to move to payment step
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderDetails.agreedToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }
    
    setPaymentStep('payment');
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripeElements || !adId) return;
    
    try {
      setPaymentStep('processing');
      setError(null);
      
      // Submit the payment with Stripe Elements
      const { error } = await stripeElements.submit();
      
      if (error) {
        throw new Error(error.message || 'Failed to process payment');
      }
      
      // Create the order with the payment intent
      if (paymentIntentId) {
        const order = await createOrderFromAd(adId, {
          ...orderDetails,
          paymentIntentId
        });
        
        // Navigate to success page
        navigate(routes.getPaymentStatusRoute('success'), { 
          state: { orderId: order.id } 
        });
      }
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setPaymentStep('payment');
    }
  };

  // Handle cancel and go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="checkout-page max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !adDetails) {
    return (
      <div className="checkout-page max-w-2xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page max-w-2xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Checkout</h2>
          <p className="text-sm text-gray-600 mt-1">
            You're ordering: {adDetails?.title}
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
            
            <div className="bg-gray-50 p-4 rounded border">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{adDetails?.title}</span>
                <span>${adDetails?.price.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Service Fee</span>
                <span>${(adDetails?.price * 0.05).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-semibold pt-2 mt-2 border-t">
                <span>Total</span>
                <span>${(adDetails?.price * 1.05).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Customer Details Form */}
          {paymentStep === 'details' && (
            <form onSubmit={handleDetailsSubmit}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Order Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={orderDetails.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone (optional)
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={orderDetails.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requirements (optional)
                  </label>
                  <textarea
                    id="specialRequirements"
                    name="specialRequirements"
                    value={orderDetails.specialRequirements}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Any specific requirements for this service..."
                  />
                </div>
                
                <div>
                  <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Instructions (optional)
                  </label>
                  <textarea
                    id="deliveryInstructions"
                    name="deliveryInstructions"
                    value={orderDetails.deliveryInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="How would you like the service delivered..."
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    name="agreedToTerms"
                    checked={orderDetails.agreedToTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 border rounded mr-2"
                  />
                  <label htmlFor="agreedToTerms" className="text-sm text-gray-700">
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          )}
          
          {/* Payment Form */}
          {paymentStep === 'payment' && (
            <form onSubmit={handlePaymentSubmit}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
              
              <div className="mb-6">
                <div id="payment-element" className="p-4 border rounded-md">
                  {/* Stripe Elements will be mounted here */}
                  {!clientSecret && (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-12 bg-gray-200 rounded mb-4"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPaymentStep('details')}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={!clientSecret}
                  className={`px-4 py-2 rounded text-white ${
                    !clientSecret
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Pay Now
                </button>
              </div>
            </form>
          )}
          
          {/* Processing */}
          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your payment...</p>
              <p className="text-sm text-gray-500 mt-2">Please do not close this window.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Security Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Payments are securely processed by Stripe</p>
        <p className="mt-1">We do not store your credit card information</p>
      </div>
    </div>
  );
};

// Default implementations for required props
async function defaultFetchAdDetails(adId: string): Promise<any> {
  throw new Error(`No fetchAdDetails implementation provided for ad ID ${adId}`);
}

async function defaultCreateOrderFromAd(adId: string, details: any): Promise<any> {
  throw new Error(`No createOrderFromAd implementation provided for ad ID ${adId}`);
}

export default CheckoutPage; 