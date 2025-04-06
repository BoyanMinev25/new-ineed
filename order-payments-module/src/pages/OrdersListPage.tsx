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

interface OrdersListPageProps {
  apiClient?: {
    getOrders: () => Promise<Order[]>;
  };
}

const OrdersListPage: React.FC<OrdersListPageProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders from API client if provided
        let orderData: Order[] = [];
        if (apiClient && apiClient.getOrders) {
          orderData = await apiClient.getOrders();
        } else {
          // Use fetch API as fallback
          const response = await fetch('/api/orders');
          if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          orderData = data.orders || data;
        }
        
        setOrders(orderData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [apiClient]);

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