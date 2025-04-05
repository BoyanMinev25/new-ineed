import React, { useState } from 'react';
import { UsabilityTestingProvider, useUsabilityTesting, Scenario } from '../../lib/usability-testing/UsabilityTestingProvider';
import UsabilityFeedback from '../../components/UsabilityFeedback';
import OrderDetailCard from '../../components/OrderDetailCard';
import OrdersListPage from '../../components/OrdersListPage';
import PaymentSummary from '../../components/PaymentSummary';
import { OrderStatus, PaymentStatus } from '../../models/order-models';
import '../../styles/components/UsabilityTestingTaskInfo.scss';

// Define test scenarios based on our test script
const testScenarios: Scenario[] = [
  {
    id: 'browse_orders',
    name: 'Browse and Filter Orders',
    tasks: [
      'Navigate to the orders list page.',
      'Find the most recent order in the list.',
      'Filter the list to show only orders that are "processing".',
      'Sort the orders by date (newest first).',
      'Identify how many orders are in "completed" status.'
    ]
  },
  {
    id: 'review_order',
    name: 'Review Order Details',
    tasks: [
      'Select any order from the list.',
      'Locate the order\'s total cost.',
      'Find out when the order was placed.',
      'Identify the payment status.',
      'Check if there\'s a way to track the delivery.',
      'Find how to contact support about this order.'
    ]
  },
  {
    id: 'payment_process',
    name: 'Complete Payment Process',
    tasks: [
      'Select credit card as your payment method.',
      'Enter the provided test credit card information.',
      'Review the payment summary.',
      'Complete the payment.',
      'Locate the order confirmation and receipt.'
    ]
  }
];

// Sample order data
const sampleOrder = {
  id: 'order-123456',
  clientId: 'client-789',
  providerId: 'provider-456',
  serviceId: 'service-101',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  status: OrderStatus.IN_PROGRESS,
  title: 'Website Development',
  description: 'Full stack web application development',
  totalAmount: 1299.99,
  currency: 'USD',
  paymentStatus: PaymentStatus.HELD,
  paymentMethod: 'credit_card',
  deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  price: {
    subtotal: 1299.99,
    fees: 129.99,
    taxes: 0,
    total: 1429.98,
    currency: 'USD'
  },
  items: [
    { id: 'item-1', name: 'Frontend Development', quantity: 1, price: 599.99 },
    { id: 'item-2', name: 'Backend Development', quantity: 1, price: 699.99 }
  ]
};

// Sample orders list
const sampleOrders = Array.from({ length: 20 }, (_, index) => ({
  ...sampleOrder,
  id: `order-${10000 + index}`,
  status: [
    OrderStatus.COMPLETED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CREATED,
    OrderStatus.DELIVERED
  ][index % 4],
  createdAt: new Date(Date.now() - index * 2 * 24 * 60 * 60 * 1000),
  title: `Order #${10000 + index}`,
  totalAmount: 100 + index * 50,
  price: {
    subtotal: 100 + index * 50,
    fees: (100 + index * 50) * 0.1,
    taxes: 0,
    total: (100 + index * 50) * 1.1,
    currency: 'USD'
  },
  deadline: new Date(Date.now() + (14 - index) * 24 * 60 * 60 * 1000)
}));

// Demo Control Panel Component
const DemoControlPanel: React.FC = () => {
  const {
    isTestingActive,
    startTesting,
    stopTesting,
    setScenario,
    currentScenario,
    nextTask,
    prevTask,
    currentTaskIndex
  } = useUsabilityTesting();
  
  return (
    <div className="demo-control-panel">
      <h2>Usability Testing Controls</h2>
      
      <div className="demo-control-panel__section">
        <h3>Testing Mode</h3>
        {!isTestingActive ? (
          <button 
            className="demo-control-panel__button demo-control-panel__button--primary"
            onClick={() => startTesting('demo_user_1')}
          >
            Start Usability Testing
          </button>
        ) : (
          <button 
            className="demo-control-panel__button demo-control-panel__button--secondary"
            onClick={stopTesting}
          >
            Stop Usability Testing
          </button>
        )}
      </div>
      
      {isTestingActive && (
        <>
          <div className="demo-control-panel__section">
            <h3>Select Scenario</h3>
            <div className="demo-control-panel__scenarios">
              {testScenarios.map(scenario => (
                <button
                  key={scenario.id}
                  className={`demo-control-panel__scenario ${
                    currentScenario === scenario.id ? 'demo-control-panel__scenario--active' : ''
                  }`}
                  onClick={() => setScenario(scenario.id)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="demo-control-panel__section">
            <h3>Task Navigation</h3>
            <div className="demo-control-panel__task-nav">
              <button
                className="demo-control-panel__button"
                onClick={prevTask}
                disabled={currentTaskIndex === 0}
              >
                Previous Task
              </button>
              <button
                className="demo-control-panel__button"
                onClick={nextTask}
                disabled={
                  !currentScenario || 
                  currentTaskIndex === 
                  testScenarios.find(s => s.id === currentScenario)?.tasks.length! - 1
                }
              >
                Next Task
              </button>
            </div>
          </div>
        </>
      )}
      
      <div className="demo-control-panel__section">
        <h3>Manual Feedback</h3>
        <p>You can also use the feedback button that appears at the bottom right.</p>
      </div>
    </div>
  );
};

// Demo Page Component
const DemoPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'detail' | 'payment'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Get the selected order
  const selectedOrder = sampleOrders.find(order => order.id === selectedOrderId) || sampleOrder;
  
  // Handle order click
  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveView('detail');
  };
  
  // Go back to list
  const handleBackToList = () => {
    setActiveView('list');
  };
  
  // Go to payment
  const handleGoToPayment = () => {
    setActiveView('payment');
  };
  
  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <h1>Order Payments Module - Usability Testing Demo</h1>
      </header>
      
      <div className="demo-page__content">
        <nav className="demo-page__nav">
          <button 
            className={`demo-page__nav-btn ${activeView === 'list' ? 'demo-page__nav-btn--active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            Orders List
          </button>
          <button 
            className={`demo-page__nav-btn ${activeView === 'detail' ? 'demo-page__nav-btn--active' : ''}`}
            onClick={() => setActiveView('detail')}
            disabled={!selectedOrderId}
          >
            Order Details
          </button>
          <button 
            className={`demo-page__nav-btn ${activeView === 'payment' ? 'demo-page__nav-btn--active' : ''}`}
            onClick={() => setActiveView('payment')}
          >
            Payment
          </button>
        </nav>
        
        <main className="demo-page__main">
          {activeView === 'list' && (
            <OrdersListPage 
              initialOrders={sampleOrders}
              ordersPerPage={10}
              fetchOrdersFromServer={false}
              // @ts-ignore - routing related props might be different than expected
              onOrderClick={handleOrderClick}
            />
          )}
          
          {activeView === 'detail' && (
            <div className="demo-page__detail">
              <button 
                className="demo-page__back-btn"
                onClick={handleBackToList}
              >
                Back to List
              </button>
              <OrderDetailCard order={selectedOrder} />
              <button 
                className="demo-page__payment-btn"
                onClick={handleGoToPayment}
              >
                Go to Payment
              </button>
            </div>
          )}
          
          {activeView === 'payment' && (
            <div className="demo-page__payment">
              <button 
                className="demo-page__back-btn"
                onClick={() => setActiveView('detail')}
              >
                Back to Order Details
              </button>
              <h2>Payment for Order {selectedOrder.id}</h2>
              <PaymentSummary 
                // @ts-ignore - component props might be different than expected
                totalAmount={selectedOrder.totalAmount}
                currency={selectedOrder.currency}
                items={selectedOrder.items}
              />
              <div className="demo-page__payment-form">
                <h3>Payment Method</h3>
                <div className="demo-page__payment-methods">
                  <label className="demo-page__payment-method">
                    <input type="radio" name="payment-method" defaultChecked />
                    <span>Credit Card</span>
                  </label>
                  <label className="demo-page__payment-method">
                    <input type="radio" name="payment-method" />
                    <span>PayPal</span>
                  </label>
                  <label className="demo-page__payment-method">
                    <input type="radio" name="payment-method" />
                    <span>Bank Transfer</span>
                  </label>
                </div>
                
                <div className="demo-page__card-form">
                  <div className="demo-page__form-field">
                    <label>Card Number</label>
                    <input type="text" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="demo-page__form-row">
                    <div className="demo-page__form-field">
                      <label>Expiry Date</label>
                      <input type="text" placeholder="MM/YY" />
                    </div>
                    <div className="demo-page__form-field">
                      <label>CVC</label>
                      <input type="text" placeholder="123" />
                    </div>
                  </div>
                  <div className="demo-page__form-field">
                    <label>Name on Card</label>
                    <input type="text" placeholder="John Doe" />
                  </div>
                </div>
                
                <button className="demo-page__pay-btn">
                  Pay ${selectedOrder.totalAmount.toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </main>
        
        <aside className="demo-page__sidebar">
          <DemoControlPanel />
        </aside>
      </div>
    </div>
  );
};

// Wrap with the provider
const UsabilityTestingDemo: React.FC = () => {
  return (
    <UsabilityTestingProvider scenarios={testScenarios} debug={true}>
      <DemoPage />
    </UsabilityTestingProvider>
  );
};

export default UsabilityTestingDemo; 