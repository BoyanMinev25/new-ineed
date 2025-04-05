import React, { useState, useEffect } from 'react';
import { Order, OrderEvent, OrderDelivery } from '../models/order-models';
import OrderTimeline from '../components/OrderTimeline';

// Note: This will later be integrated with React Router
interface OrderDetailsPageProps {
  orderId: string;
}

/**
 * OrderDetailsPage Component
 * 
 * Displays comprehensive details about an order including:
 * - Order information (ID, service, provider, etc.)
 * - Order timeline
 * - Delivery documentation
 * - Payment information
 * - Support/Resolution options
 */
const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ orderId }) => {
  // State for the order data
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [deliveries, setDeliveries] = useState<OrderDelivery[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'delivery' | 'payment' | 'support'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order data when component mounts
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        
        // These will be implemented to fetch from our API
        // const orderData = await getOrderById(orderId);
        // const orderEvents = await getOrderTimeline(orderId);
        // const orderDeliveries = await getOrderDeliveries(orderId);
        
        // For now, using placeholder data
        setOrder({
          id: orderId,
          clientId: 'client-123',
          providerId: 'provider-456',
          serviceId: 'service-789',
          title: 'Example Service',
          description: 'This is a placeholder service description',
          status: 'IN_PROGRESS',
          createdAt: new Date(),
          updatedAt: new Date(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          price: {
            subtotal: 100,
            fees: 20,
            taxes: 10,
            total: 130,
            currency: 'USD'
          },
          paymentStatus: 'HELD'
        } as Order);
        
        setEvents([
          {
            id: 'event-1',
            orderId,
            type: 'ORDER_CREATED',
            description: 'Order was placed',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            createdBy: 'client-123',
            metadata: {}
          },
          {
            id: 'event-2',
            orderId,
            type: 'ORDER_CONFIRMED',
            description: 'Provider accepted the order',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            createdBy: 'provider-456',
            metadata: {}
          }
        ] as OrderEvent[]);
        
        setDeliveries([]);
        
      } catch (err) {
        setError('Failed to load order details. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId]);

  // Handle tab switching
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="order-info">
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            {order && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded shadow-sm">
                  <h4 className="font-medium text-gray-700">Service Details</h4>
                  <p className="text-lg font-semibold mt-1">{order.title}</p>
                  <p className="text-sm text-gray-600 mt-2">{order.description}</p>
                </div>
                
                <div className="p-4 border rounded shadow-sm">
                  <h4 className="font-medium text-gray-700">Order Details</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{order.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span>{order.deadline.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded shadow-sm md:col-span-2">
                  <h4 className="font-medium text-gray-700">Payment Details</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>${order.price.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fees:</span>
                      <span>${order.price.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes:</span>
                      <span>${order.price.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${order.price.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'timeline':
        return <OrderTimeline events={events} currentOrderId={orderId} isLoading={isLoading} />;
        
      case 'delivery':
        return (
          <div className="delivery-documentation">
            <h3 className="text-lg font-semibold mb-4">Delivery Documentation</h3>
            {deliveries.length > 0 ? (
              <div className="space-y-4">
                {/* Delivery items will be rendered here */}
                <p>Deliveries will be displayed here</p>
              </div>
            ) : (
              <div className="text-center py-6 border rounded bg-gray-50">
                <p className="text-gray-500">No deliveries yet</p>
                {/* If provider, show upload button */}
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Upload Delivery
                </button>
              </div>
            )}
          </div>
        );
        
      case 'payment':
        return (
          <div className="payment-history">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <p>Payment history will be displayed here</p>
          </div>
        );
        
      case 'support':
        return (
          <div className="support-resolution">
            <h3 className="text-lg font-semibold mb-4">Support & Resolution Center</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded shadow-sm">
                <h4 className="font-medium text-gray-700">Create Support Ticket</h4>
                <p className="text-sm text-gray-500 mt-2">
                  Having issues with this order? Create a support ticket.
                </p>
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Create Ticket
                </button>
              </div>
              
              <div className="p-4 border rounded shadow-sm">
                <h4 className="font-medium text-gray-700">Frequently Asked Questions</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="text-blue-600 hover:underline cursor-pointer">
                    How do I request changes?
                  </li>
                  <li className="text-blue-600 hover:underline cursor-pointer">
                    When will I receive my refund?
                  </li>
                  <li className="text-blue-600 hover:underline cursor-pointer">
                    How do I extend the deadline?
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="order-details-page max-w-4xl mx-auto py-6 px-4">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : (
        order && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{order.title}</h2>
              <p className="text-gray-600">Order #{orderId}</p>
            </div>
            
            {/* Tab navigation */}
            <div className="border-b mb-6">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'info'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Order Info
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'timeline'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'delivery'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'payment'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Payment
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'support'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Support
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            <div className="tab-content">
              {renderTabContent()}
            </div>
            
            {/* Action buttons */}
            <div className="mt-8 flex justify-end space-x-4">
              {order.status === 'DELIVERED' && (
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Accept Delivery
                </button>
              )}
              
              {['CREATED', 'CONFIRMED', 'IN_PROGRESS'].includes(order.status) && (
                <button className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50">
                  Cancel Order
                </button>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default OrderDetailsPage;