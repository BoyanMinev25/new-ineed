import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../models/order-models';
import VirtualizedOrdersList from './VirtualizedOrdersList';
import Pagination from './Pagination';
import '../styles/components/PaginatedOrdersList.scss';

interface PaginatedOrdersListProps {
  orders: Order[];
  pageSize?: number;
  onOrderClick?: (orderId: string) => void;
  fetchOrders?: (page: number, pageSize: number) => Promise<{
    orders: Order[];
    totalCount: number;
  }>;
  initialPage?: number;
}

const PaginatedOrdersList: React.FC<PaginatedOrdersListProps> = ({
  orders: initialOrders,
  pageSize = 20,
  onOrderClick,
  fetchOrders,
  initialPage = 1
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>(initialOrders);
  const [totalItems, setTotalItems] = useState(initialOrders.length);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialOrders.length / pageSize));
  const [loading, setLoading] = useState(false);

  // When using client-side pagination (no fetchOrders provided)
  const updateDisplayedOrdersLocally = useCallback(() => {
    if (!fetchOrders) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, initialOrders.length);
      setDisplayedOrders(initialOrders.slice(startIndex, endIndex));
      setTotalItems(initialOrders.length);
      setTotalPages(Math.ceil(initialOrders.length / pageSize));
    }
  }, [currentPage, pageSize, initialOrders, fetchOrders]);

  // Fetch orders from the server when page changes
  const loadOrders = useCallback(async () => {
    if (fetchOrders) {
      setLoading(true);
      try {
        const result = await fetchOrders(currentPage, pageSize);
        setDisplayedOrders(result.orders);
        setTotalItems(result.totalCount);
        setTotalPages(Math.ceil(result.totalCount / pageSize));
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, fetchOrders]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    if (document.querySelector('.paginated-orders-container')) {
      document.querySelector('.paginated-orders-container')?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Initialize with appropriate data
  useEffect(() => {
    if (fetchOrders) {
      loadOrders();
    } else {
      updateDisplayedOrdersLocally();
    }
  }, [currentPage, fetchOrders, loadOrders, updateDisplayedOrdersLocally]);

  // Update if initial orders change
  useEffect(() => {
    if (!fetchOrders) {
      updateDisplayedOrdersLocally();
    }
  }, [initialOrders, fetchOrders, updateDisplayedOrdersLocally]);

  return (
    <div className="paginated-orders-container">
      <div className="paginated-orders-list">
        {loading ? (
          <div className="paginated-orders-loading">
            <div className="loader"></div>
            <p>Loading orders...</p>
          </div>
        ) : (
          <VirtualizedOrdersList 
            orders={displayedOrders}
            onOrderClick={onOrderClick}
            loading={loading}
          />
        )}
      </div>
      
      <div className="paginated-orders-footer">
        <div className="paginated-orders-count">
          Showing {displayedOrders.length} of {totalItems} orders
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default PaginatedOrdersList; 