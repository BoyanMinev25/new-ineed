import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Import components
import OrderDetailCard from '../components/OrderDetailCard';

// Types and utils
import routes from '../integration/navigation/routes';

// Define the interface for order data
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

// PageProps
interface OrdersListPageProps {
  // Optional props if needed for testing or flexibility
}

const OrdersListPage: React.FC<OrdersListPageProps> = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from your OrdersContext
    // For demo purposes, we'll use mock data
    const fetchOrders = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for display
        const mockOrders: Order[] = [
          {
            id: 'order-123456',
            status: 'pending',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            amount: 150,
            buyerId: 'user-123',
            sellerId: 'user-456',
            serviceType: 'Web Development',
            buyerName: 'John Doe',
            sellerName: 'Jane Smith',
            role: 'buyer',
            description: 'Website landing page design and development'
          },
          {
            id: 'order-789012',
            status: 'completed',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            amount: 75,
            buyerId: 'user-789',
            sellerId: 'user-123',
            serviceType: 'Logo Design',
            buyerName: 'Bob Johnson',
            sellerName: 'John Doe',
            role: 'seller',
            description: 'Modern minimalist logo for a coffee shop'
          }
        ];
        
        setOrders(mockOrders);
        setLoading(false);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewOrder = (order: Order) => {
    navigate(routes.getOrderDetailRoute(order.id));
  };

  const filteredOrders = activeTab === 0 
    ? orders 
    : activeTab === 1 
      ? orders.filter(order => order.role === 'buyer')
      : orders.filter(order => order.role === 'seller');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          Orders & Payments
        </Typography>
        
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<FilterIcon />}
        >
          Filter
        </Button>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="All Orders" />
        <Tab label="Buying" />
        <Tab label="Selling" />
      </Tabs>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No orders found. Start by exploring services available in the marketplace.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/home')}
          >
            Explore Marketplace
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {filteredOrders.map(order => (
            <OrderDetailCard
              key={order.id}
              order={order}
              onActionClick={handleViewOrder}
            />
          ))}
        </>
      )}
    </Container>
  );
};

export default OrdersListPage; 