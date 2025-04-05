import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Import components
import OrderTimeline from '../components/OrderTimeline';
import PaymentSummary from '../components/PaymentSummary';
import DeliveryFileUploader from '../components/DeliveryFileUploader';
import ReviewForm from '../components/ReviewForm';

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
  deliveryFiles?: string[];
  review?: {
    rating: number;
    comment: string;
  };
}

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // In a real implementation, this would fetch from your OrdersContext
    // For demo purposes, we'll use mock data
    const fetchOrder = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for display
        const mockOrder: Order = {
          id: orderId || 'order-123456',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          amount: 150,
          buyerId: 'user-123',
          sellerId: 'user-456',
          serviceType: 'Web Development',
          buyerName: 'John Doe',
          sellerName: 'Jane Smith',
          role: 'buyer',
          description: 'Website landing page design and development'
        };
        
        setOrder(mockOrder);
        setLoading(false);
      } catch (err) {
        setError('Failed to load order details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);

  const handleBack = () => {
    navigate(routes.getOrdersListRoute());
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!order) return;
    
    setOrder({
      ...order,
      status: newStatus
    });
  };

  const handleDeliveryUpload = (files: string[]) => {
    if (!order) return;
    
    setOrder({
      ...order,
      deliveryFiles: files
    });
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!order) return;
    
    setOrder({
      ...order,
      review: { rating, comment }
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Order not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Order Details
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary">
          Order #{order.id.slice(-6)}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Order Status Stepper */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Order Created</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Order was created on {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Payment Processing</StepLabel>
                <StepContent>
                  <PaymentSummary 
                    details={[
                      { label: 'Service Fee', amount: order.amount * 0.9 },
                      { label: 'Platform Fee', amount: order.amount * 0.1 },
                      { label: 'Total', amount: order.amount, isTotal: true }
                    ]}
                    currency="USD"
                  />
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Service Delivery</StepLabel>
                <StepContent>
                  <DeliveryFileUploader
                    files={order.deliveryFiles || []}
                    onUpload={handleDeliveryUpload}
                  />
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Review & Completion</StepLabel>
                <StepContent>
                  <ReviewForm
                    orderId={order.id}
                    sellerName={order.sellerName}
                    onSubmitReview={async (review) => {
                      handleReviewSubmit(review.rating, review.comment);
                    }}
                    isSubmitting={false}
                  />
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
        
        {/* Order Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Timeline
            </Typography>
            <OrderTimeline order={order} />
          </Paper>
        </Grid>
        
        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {order.status === 'in_progress' && order.role === 'seller' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleStatusUpdate('delivered')}
              >
                Mark as Delivered
              </Button>
            )}
            
            {order.status === 'delivered' && order.role === 'buyer' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleStatusUpdate('completed')}
              >
                Accept Delivery
              </Button>
            )}
            
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleStatusUpdate('cancelled')}
              >
                Cancel Order
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetailPage; 