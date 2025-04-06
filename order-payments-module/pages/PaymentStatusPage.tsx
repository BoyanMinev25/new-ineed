import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import routes from '../integration/navigation/routes';

interface PaymentStatusPageProps {
  fetchOrderById?: (orderId: string) => Promise<any>;
}

/**
 * PaymentStatusPage Component
 * 
 * Displays payment status information after checkout.
 * Handles success, cancel, and processing states.
 */
const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  fetchOrderById = defaultFetchOrderById
}) => {
  const { status } = useParams<{ status: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get orderId from location state if available
  const orderId = location.state?.orderId;

  // Fetch order details if orderId is available
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }
    
    const getOrderDetails = async () => {
      try {
        setIsLoading(true);
        const orderData = await fetchOrderById(orderId);
        setOrder(orderData);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError('Could not load order details.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getOrderDetails();
  }, [orderId, fetchOrderById]);

  // Validate status
  const validStatus = ['success', 'cancel', 'processing'].includes(status || '');
  if (!validStatus) {
    return (
      <div className="payment-status-page max-w-xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          <p>Invalid payment status.</p>
        </div>
        <button
          onClick={() => navigate(routes.ORDERS_LIST)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Orders
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="payment-status-page max-w-xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-page max-w-xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">
            {status === 'success' && 'Payment Successful!'}
            {status === 'cancel' && 'Payment Cancelled'}
            {status === 'processing' && 'Payment Processing'}
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="bg-green-50 p-6 rounded-lg mb-6">
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
                <h3 className="text-lg font-medium text-green-800 mb-2">Payment Successful!</h3>
                <p className="text-green-700">
                  Your payment has been processed successfully. Your order is now being prepared.
                </p>
                
                {order && (
                  <div className="mt-4 bg-white p-4 rounded border text-left">
                    <p className="text-sm text-gray-500 mb-1">Order ID:</p>
                    <p className="font-medium">{order.id}</p>
                    
                    <p className="text-sm text-gray-500 mt-3 mb-1">Total Amount:</p>
                    <p className="font-medium">
                      {order.price?.currency === 'USD' ? '$' : ''}{order.price?.total.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mb-6">
                We've sent a confirmation email with all the details of your order.
                You can also view your order status in your account dashboard.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate(routes.getOrderDetailRoute(orderId || ''))}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!orderId}
                >
                  View Order Details
                </button>
                
                <button
                  onClick={() => navigate(routes.ORDERS_LIST)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Go to Orders
                </button>
              </div>
            </div>
          )}
          
          {/* Cancel State */}
          {status === 'cancel' && (
            <div className="text-center">
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <svg 
                  className="mx-auto h-12 w-12 text-yellow-500 mb-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Payment Cancelled</h3>
                <p className="text-yellow-700">
                  Your payment was cancelled. No charges have been made to your account.
                </p>
              </div>
              
              <p className="text-gray-600 mb-6">
                If you experienced any issues during checkout, please try again or contact our support team for assistance.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => navigate(routes.ORDERS_LIST)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Go to Orders
                </button>
              </div>
            </div>
          )}
          
          {/* Processing State */}
          {status === 'processing' && (
            <div className="text-center">
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Payment Processing</h3>
                <p className="text-blue-700">
                  Your payment is currently being processed. This may take a few moments.
                </p>
                
                {order && (
                  <div className="mt-4 bg-white p-4 rounded border text-left">
                    <p className="text-sm text-gray-500 mb-1">Order ID:</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mb-6">
                Please do not close this page. You will be redirected once the payment is complete.
              </p>
              
              <div className="text-sm text-gray-500">
                <p>This page will refresh automatically in 30 seconds.</p>
                <p className="mt-1">If you are not redirected, you can check your order status in your account.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Default implementation for fetchOrderById
async function defaultFetchOrderById(orderId: string): Promise<any> {
  throw new Error(`No fetchOrderById implementation provided for order ID ${orderId}`);
}

export default PaymentStatusPage; 