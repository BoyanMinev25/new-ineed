import React, { useState, useRef, useEffect } from 'react';
import { Order } from '../models/order-models';
import OrderDetailCard from './OrderDetailCard';
import '../styles/components/VirtualizedOrdersList.scss';

interface VirtualizedOrdersListProps {
  orders: Order[];
  onOrderClick?: (orderId: string) => void;
  itemHeight?: number;
  loadMoreThreshold?: number;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const VirtualizedOrdersList: React.FC<VirtualizedOrdersListProps> = ({
  orders,
  onOrderClick,
  itemHeight = 200,
  loadMoreThreshold = 5,
  loadMore,
  hasMore = false,
  loading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate which items should be visible based on scroll position
  const calculateVisibleItems = () => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const totalHeight = orders.length * itemHeight;
    const bufferItems = 5; // Show extra items for smoother scrolling
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems);
    const visibleItemCount = Math.ceil(clientHeight / itemHeight) + 2 * bufferItems;
    const endIndex = Math.min(orders.length - 1, startIndex + visibleItemCount);
    
    setVisibleRange({ start: startIndex, end: endIndex });
    
    // Check if we need to load more items
    if (
      loadMore && 
      hasMore && 
      !loading && 
      endIndex >= orders.length - loadMoreThreshold
    ) {
      loadMore();
    }
  };

  // Update container height when orders change
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(calculateVisibleItems);
    };

    container.addEventListener('scroll', handleScroll);
    // Initial calculation
    calculateVisibleItems();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [orders.length, itemHeight, loadMore, hasMore, loading]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        calculateVisibleItems();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const renderOrderItems = () => {
    return orders
      .slice(visibleRange.start, visibleRange.end + 1)
      .map((order) => (
        <div 
          key={order.id} 
          className="virtualized-order-item"
          style={{ 
            height: `${itemHeight}px`, 
            transform: `translateY(${visibleRange.start * itemHeight}px)` 
          }}
        >
          <OrderDetailCard 
            order={order} 
            isCompact={true}
            onClick={() => onOrderClick && onOrderClick(order.id)}
          />
        </div>
      ));
  };

  return (
    <div 
      ref={containerRef} 
      className="virtualized-orders-container"
    >
      <div 
        className="virtualized-orders-content"
        style={{ height: `${orders.length * itemHeight}px` }}
      >
        {renderOrderItems()}
      </div>
      
      {loading && (
        <div className="virtualized-orders-loading">
          <div className="loader"></div>
          <p>Loading more orders...</p>
        </div>
      )}
      
      {!hasMore && orders.length > 0 && (
        <div className="virtualized-orders-end">
          <p>No more orders to load</p>
        </div>
      )}
      
      {orders.length === 0 && !loading && (
        <div className="virtualized-orders-empty">
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedOrdersList; 