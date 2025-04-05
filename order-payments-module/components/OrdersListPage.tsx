import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../models/order-models';
import { withPerformanceTracking, usePerformanceTracking } from '../lib/withPerformanceTracking';
import { lazyLoad } from '../lib/lazyLoad';
import LoadingSpinner from './LoadingSpinner';
import '../styles/components/OrdersListPage.scss';

// Lazy load the PaginatedOrdersList component
const LazyPaginatedOrdersList = lazyLoad(
  () => import('./PaginatedOrdersList'),
  'PaginatedOrdersList'
);

interface OrdersListPageProps {
  initialOrders?: Order[];
  ordersPerPage?: number;
  fetchOrdersFromServer?: boolean;
  apiEndpoint?: string;
}

const OrdersListPage: React.FC<OrdersListPageProps> = ({
  initialOrders = [],
  ordersPerPage = 20,
  fetchOrdersFromServer = false,
  apiEndpoint = '/api/orders'
}) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackDataFetch, trackUserInteraction } = usePerformanceTracking();
  
  // Fetch all orders if not using server-side pagination
  const fetchAllOrders = useCallback(async () => {
    if (!fetchOrdersFromServer && initialOrders.length === 0) {
      setIsLoading(true);
      setError(null);
      
      const startTime = performance.now();
      try {
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.statusText}`);
        }
        
        const data = await response.json();
        setOrders(data);
        
        const fetchTime = performance.now() - startTime;
        trackDataFetch('fetch_all_orders', fetchTime);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchOrdersFromServer, initialOrders.length, apiEndpoint, trackDataFetch]);
  
  // Server-side pagination function
  const fetchOrdersPage = useCallback(async (page: number, pageSize: number) => {
    if (!fetchOrdersFromServer) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, orders.length);
      return { 
        orders: orders.slice(startIndex, endIndex),
        totalCount: orders.length
      };
    }
    
    const startTime = performance.now();
    try {
      const response = await fetch(
        `${apiEndpoint}?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching orders: ${response.statusText}`);
      }
      
      const data = await response.json();
      const fetchTime = performance.now() - startTime;
      trackDataFetch(`fetch_orders_page_${page}`, fetchTime);
      
      return {
        orders: data.orders,
        totalCount: data.totalCount
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching orders page:', err);
      return { orders: [], totalCount: 0 };
    }
  }, [fetchOrdersFromServer, apiEndpoint, orders, trackDataFetch]);
  
  // Navigate to order detail page
  const handleOrderClick = (orderId: string) => {
    const startTime = performance.now();
    navigate(`/orders/${orderId}`);
    const duration = performance.now() - startTime;
    trackUserInteraction('order_click', duration);
  };
  
  useEffect(() => {
    if (!fetchOrdersFromServer) {
      fetchAllOrders();
    }
  }, [fetchAllOrders, fetchOrdersFromServer]);
  
  return (
    <div className="orders-list-page">
      <header className="orders-list-page__header">
        <h1 className="orders-list-page__title">Your Orders</h1>
        <div className="orders-list-page__actions">
          <button 
            className="btn btn-secondary"
            onClick={() => trackUserInteraction('filter_click', 0)}
          >
            Filter
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => trackUserInteraction('new_order_click', 0)}
          >
            New Order
          </button>
        </div>
      </header>
      
      {error && (
        <div className="orders-list-page__error">
          <p>{error}</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              trackUserInteraction('retry_click', 0);
              fetchAllOrders();
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="orders-list-page__content">
        {isLoading ? (
          <div className="orders-list-page__loading">
            <LoadingSpinner size="large" />
            <p>Loading orders...</p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="orders-list-page__loading">
              <LoadingSpinner size="large" />
              <p>Loading orders list component...</p>
            </div>
          }>
            <LazyPaginatedOrdersList
              orders={initialOrders.length > 0 ? initialOrders : orders}
              pageSize={ordersPerPage}
              onOrderClick={handleOrderClick}
              fetchOrders={fetchOrdersFromServer ? fetchOrdersPage : undefined}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default withPerformanceTracking(OrdersListPage, 'OrdersListPage'); 