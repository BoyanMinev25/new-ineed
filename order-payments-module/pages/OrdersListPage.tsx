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
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import components
import OrderDetailCard from '../components/OrderDetailCard';

// Types and utils
import routes from '../integration/navigation/routes';

// Import OrdersContext and Auth
import { useOrders } from '../context/OrdersContext';
import orderPaymentsAuth from '../integration/auth/orderPaymentsAuth';

// Define the interface for order data - compatible with OrderDetailCard
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
  const [retryCount, setRetryCount] = useState(0);
  const [retryInProgress, setRetryInProgress] = useState(false);
  
  // Use the OrdersContext instead of local state
  const { 
    orders, 
    buyerOrders, 
    sellerOrders, 
    loading, 
    error, 
    fetchOrders 
  } = useOrders();
  
  // Check auth status on mount
  useEffect(() => {
    // Check if user is authenticated
    const userId = orderPaymentsAuth.getCurrentUserRoleId();
  }, []);

  // Fetch orders when component mounts
  useEffect(() => {
    // Force a fresh fetch every time this component mounts 
    fetchOrders();
  }, [fetchOrders]); // Include fetchOrders in the dependency array to avoid lint warnings

  // Handle manual retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRetryInProgress(true);
    
    // Try to fetch orders again
    fetchOrders().finally(() => {
      setRetryInProgress(false);
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewOrder = (order: Order) => {
    navigate(routes.getOrderDetailRoute(order.id));
  };

  // Use the context's filtered orders based on the active tab and adapt them to the local Order interface
  const adaptOrders = (ordersData: any[]): Order[] => {
    if (!ordersData || ordersData.length === 0) {
      return [];
    }
    
    return ordersData.map(order => {
      // Check if we have a Firestore timestamp object and convert if needed
      let createdAt = order.createdAt;
      if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
        createdAt = new Date(createdAt.seconds * 1000);
      }
      
      // Create a properly adapted order object
      const adaptedOrder: Order = {
        id: order.id,
        status: order.status || 'pending',
        createdAt: createdAt || new Date(),
        // Handle different price formats
        amount: order.amount || order.price?.total || 
                (order.price && typeof order.price === 'number' ? order.price : 0),
        buyerId: order.buyerId || '',
        sellerId: order.sellerId || '',
        description: order.description || '',
        // Use title as serviceType or fallback
        serviceType: order.serviceType || order.title || 'Unknown Service',
        buyerName: order.buyerName || 'Client',
        sellerName: order.sellerName || 'Provider',
        role: order.role || ''
      };
      
      return adaptedOrder;
    });
  };
  
  const filteredOrders = activeTab === 0 
    ? adaptOrders(orders)
    : activeTab === 1 
      ? adaptOrders(buyerOrders)
      : adaptOrders(sellerOrders);

  // Check if we have an auth error
  const isAuthError = error && (
    error.includes('Authentication required') || 
    error.includes('401') ||
    error.includes('authenticated') ||
    error.includes('login')
  );

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
      
      {loading || retryInProgress ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
            >
              Retry
            </Button>
          }
        >
          {isAuthError 
            ? "Authentication error. Please ensure you're logged in and try again." 
            : error}
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