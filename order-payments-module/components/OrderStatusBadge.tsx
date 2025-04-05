import React from 'react';
import { OrderStatus } from '../models/order-models';
import '../styles/components/OrderStatusBadge.scss';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.CREATED:
        return 'status-badge--yellow';
      case OrderStatus.CONFIRMED:
        return 'status-badge--blue';
      case OrderStatus.IN_PROGRESS:
        return 'status-badge--purple';
      case OrderStatus.DELIVERED:
        return 'status-badge--teal';
      case OrderStatus.COMPLETED:
        return 'status-badge--green';
      case OrderStatus.CANCELLED:
        return 'status-badge--red';
      case OrderStatus.DISPUTED:
        return 'status-badge--orange';
      default:
        return 'status-badge--gray';
    }
  };

  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default OrderStatusBadge; 