import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon
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
}

interface OrderDetailCardProps {
  order: Order;
  onActionClick: (order: Order) => void;
}

const OrderDetailCard: React.FC<OrderDetailCardProps> = ({ order, onActionClick }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3
        }
      }}
      onClick={() => onActionClick(order)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {order.serviceType}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {order.description}
            </Typography>
            
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Chip 
                label={order.status}
                color={getStatusColor(order.status)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                {order.role === 'buyer' ? `Seller: ${order.sellerName}` : `Buyer: ${order.buyerName}`}
              </Typography>
            </Stack>
            
            <Divider sx={{ my: 1 }} />
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(order.createdAt)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatAmount(order.amount)}
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          <IconButton size="small" sx={{ ml: 1 }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderDetailCard; 