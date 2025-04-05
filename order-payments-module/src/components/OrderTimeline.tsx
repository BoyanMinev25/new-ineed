import React from 'react';
import {
  Typography,
  Box
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Types
interface Order {
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

interface OrderTimelineProps {
  order: Order;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const getTimelineItems = () => {
    const items = [
      {
        icon: <ShoppingCartIcon />,
        title: 'Order Created',
        description: `Order was created on ${new Date(order.createdAt).toLocaleDateString()}`,
        completed: true
      }
    ];

    // Add payment status
    items.push({
      icon: <PaymentIcon />,
      title: 'Payment Processing',
      description: `Payment of ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(order.amount)} initiated`,
      completed: order.status !== 'pending'
    });

    // Add delivery status
    if (order.status !== 'pending') {
      items.push({
        icon: <LocalShippingIcon />,
        title: 'Service Delivery',
        description: order.deliveryFiles && order.deliveryFiles.length > 0
          ? 'Service files have been delivered'
          : 'Waiting for service delivery',
        completed: Boolean(order.deliveryFiles?.length)
      });
    }

    // Add completion status
    if (order.status === 'completed') {
      items.push({
        icon: <CheckCircleIcon />,
        title: 'Order Completed',
        description: 'Order has been completed successfully',
        completed: true
      });
    } else if (order.status === 'cancelled') {
      items.push({
        icon: <CancelIcon />,
        title: 'Order Cancelled',
        description: 'Order has been cancelled',
        completed: true
      });
    }

    return items;
  };

  return (
    <Timeline>
      {getTimelineItems().map((item, index, array) => (
        <TimelineItem key={index}>
          <TimelineSeparator>
            <TimelineDot color={item.completed ? 'primary' : 'grey'}>
              {item.icon}
            </TimelineDot>
            {index < array.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="subtitle2" component="h3">
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default OrderTimeline; 