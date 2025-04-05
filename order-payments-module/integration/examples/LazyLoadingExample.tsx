import React, { useState } from 'react';
import { lazyLoad, usePreload } from '../../lib/lazyLoad';
import LazyImage from '../../components/LazyImage';

// Lazy load heavy components
const LazyOrderDetailCard = lazyLoad(
  () => import('../../components/OrderDetailCard'),
  'OrderDetailCard'
);

const LazyPaymentSummary = lazyLoad(
  () => import('../../components/PaymentSummary'),
  'PaymentSummary'
);

const LazyPerformanceDashboard = lazyLoad(
  () => import('../../components/PerformanceDashboard'),
  'PerformanceDashboard',
  { preload: true } // Preload this component immediately
);

const LazyLoadingExample: React.FC = () => {
  const [showDetailCard, setShowDetailCard] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { preloadComponent, preloaded } = usePreload();
  
  // Sample order data
  const sampleOrder = {
    id: 'order-123',
    customerId: 'cust-456',
    status: 'processing',
    totalAmount: 249.99,
    items: [
      { id: 'item-1', name: 'Product A', quantity: 2, price: 99.99 },
      { id: 'item-2', name: 'Product B', quantity: 1, price: 50.01 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return (
    <div className="lazy-loading-example">
      <h1>Lazy Loading Example</h1>
      
      <section className="example-section">
        <h2>Lazy Loaded Images</h2>
        <div className="image-gallery">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <LazyImage
              key={num}
              src={`https://picsum.photos/id/${num + 100}/400/300`}
              alt={`Example image ${num}`}
              width="400px"
              height="300px"
            />
          ))}
        </div>
      </section>
      
      <section className="example-section">
        <h2>Lazy Loaded Components</h2>
        
        <div className="component-demo">
          <button
            className="btn btn-primary"
            onMouseEnter={() => preloadComponent(LazyOrderDetailCard, 'order-detail')}
            onClick={() => setShowDetailCard(!showDetailCard)}
          >
            {showDetailCard ? 'Hide' : 'Show'} Order Detail Card
            {!showDetailCard && preloaded['order-detail'] && ' (Preloaded)'}
          </button>
          
          {showDetailCard && (
            <div className="component-container">
              <LazyOrderDetailCard order={sampleOrder} />
            </div>
          )}
        </div>
        
        <div className="component-demo">
          <button
            className="btn btn-primary"
            onMouseEnter={() => preloadComponent(LazyPaymentSummary, 'payment-summary')}
            onClick={() => setShowPaymentSummary(!showPaymentSummary)}
          >
            {showPaymentSummary ? 'Hide' : 'Show'} Payment Summary
            {!showPaymentSummary && preloaded['payment-summary'] && ' (Preloaded)'}
          </button>
          
          {showPaymentSummary && (
            <div className="component-container">
              <LazyPaymentSummary
                amount={sampleOrder.totalAmount}
                currency="USD"
                items={sampleOrder.items}
              />
            </div>
          )}
        </div>
        
        <div className="component-demo">
          <button
            className="btn btn-primary"
            onClick={() => setShowDashboard(!showDashboard)}
          >
            {showDashboard ? 'Hide' : 'Show'} Performance Dashboard (Auto-Preloaded)
          </button>
          
          {showDashboard && (
            <div className="component-container">
              <LazyPerformanceDashboard />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LazyLoadingExample; 