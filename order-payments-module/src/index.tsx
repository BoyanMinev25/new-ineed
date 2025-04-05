import React from 'react';

// Components
export { default as OrderDetailCard } from './components/OrderDetailCard';
export { default as OrderTimeline } from './components/OrderTimeline';
export { default as PaymentSummary } from './components/PaymentSummary';
export { default as DeliveryFileUploader } from './components/DeliveryFileUploader';
export { default as ReviewForm } from './components/ReviewForm';

// Pages
export { default as OrdersListPage } from './pages/OrdersListPage';
export { default as OrderDetailPage } from './pages/OrderDetailPage';

// Routes
export { default as routes } from './integration/navigation/routes';

// Types
export interface Order {
  id: string;
  status: string;
  createdAt: string | Date;
  amount: number;
  buyerId: string;
  sellerId: string;
  description?: string;
  serviceType: string;
  buyerName: string;
  sellerName: string;
  role: 'buyer' | 'seller';
  deliveryFiles?: string[];
  review?: {
    rating: number;
    comment: string;
  };
}

// Define interfaces needed for component props
export interface OrdersListPageProps {
  // Optional props if needed for testing or flexibility
}

// Import explicitly for use in the module configuration
import routesConfig from './integration/navigation/routes';

// Module configuration - using route paths without React elements
export const OrderPaymentsModule = {
  routes: [
    {
      path: routesConfig.ORDERS_LIST,
      component: 'OrdersListPage'
    },
    {
      path: routesConfig.ORDER_DETAIL,
      component: 'OrderDetailPage'
    }
  ]
}; 