import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Grid,
  Alert
} from '@mui/material';
import { useOrders } from '../context/OrdersContext';

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  offerId: string;
  offerDetails: {
    price: number;
    description: string;
    timeframe: string;
    scope?: string;
    additionalDetails?: string;
  };
  onOrderCreated: (orderId: string) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  open,
  onClose,
  offerId,
  offerDetails,
  onOrderCreated
}) => {
  const { createOrderFromOffer, loading, error } = useOrders();
  
  const [price, setPrice] = useState<number>(offerDetails.price);
  const [description, setDescription] = useState<string>(offerDetails.description);
  const [timeframe, setTimeframe] = useState<string>(offerDetails.timeframe);
  const [scope, setScope] = useState<string>(offerDetails.scope || '');
  const [additionalDetails, setAdditionalDetails] = useState<string>(
    offerDetails.additionalDetails || ''
  );
  
  // Update form when offer details change
  useEffect(() => {
    setPrice(offerDetails.price);
    setDescription(offerDetails.description);
    setTimeframe(offerDetails.timeframe);
    setScope(offerDetails.scope || '');
    setAdditionalDetails(offerDetails.additionalDetails || '');
  }, [offerDetails]);
  
  const handleCreateOrder = async () => {
    try {
      // TODO: In a future implementation, we might want to update the offer details
      // before creating the order. For now, we'll just create the order with the existing details.
      const order = await createOrderFromOffer(offerId);
      if (order && order.id) {
        onOrderCreated(order.id);
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create Order from Offer
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="subtitle1" gutterBottom>
          Please review and confirm the offer details before creating an order.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Delivery Timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={loading}
                sx={{ flex: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Scope of Work"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Additional Details"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateOrder} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderModal; 