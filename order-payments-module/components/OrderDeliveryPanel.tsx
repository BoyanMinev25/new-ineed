import React, { useState } from 'react';
import { useOrders } from '../context/OrdersContext';
import { styled } from '@mui/system';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import DeliveryFileUploader from './DeliveryFileUploader';

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadDate?: Date | string;
  status?: 'uploading' | 'complete' | 'error';
}

interface RevisionRequest {
  id: string;
  requesterId: string;
  requesterRole: 'buyer' | 'seller';
  description: string;
  timestamp: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  responseMessage?: string;
}

interface OrderDeliveryPanelProps {
  orderId: string;
  orderStatus: string;
  userRole: 'buyer' | 'seller';
  deliveryFiles?: FileData[];
  revisionRequests?: RevisionRequest[];
}

const DeliveryContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const OrderDeliveryPanel: React.FC<OrderDeliveryPanelProps> = ({
  orderId,
  orderStatus,
  userRole,
  deliveryFiles = [],
  revisionRequests = []
}) => {
  const { submitDelivery, requestRevision, approveDelivery, rejectDelivery } = useOrders();
  
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [revisionReason, setRevisionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Get active step based on order status
  const getActiveStep = () => {
    switch (orderStatus) {
      case 'pending': return 0;
      case 'in_progress': return 1;
      case 'delivered': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };
  
  const handleDeliverySubmit = async () => {
    if (files.length === 0) {
      setError('Please add at least one file to deliver');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await submitDelivery(orderId, files, deliveryMessage);
      setSuccess('Delivery submitted successfully!');
      setFiles([]);
      setFileUrls([]);
      setDeliveryMessage('');
    } catch (err: any) {
      setError(`Failed to submit delivery: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRevisionRequest = async () => {
    if (revisionReason.trim() === '') {
      setError('Please provide a reason for the revision request');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await requestRevision(orderId, revisionReason);
      setSuccess('Revision requested successfully!');
      setRevisionReason('');
      setIsRejectDialogOpen(false);
    } catch (err: any) {
      setError(`Failed to request revision: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleApproveDelivery = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await approveDelivery(orderId);
      setSuccess('Delivery approved! Order completed successfully.');
    } catch (err: any) {
      setError(`Failed to approve delivery: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRejectDelivery = async () => {
    if (revisionReason.trim() === '') {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await rejectDelivery(orderId, revisionReason);
      setSuccess('Delivery rejected. Revision requested successfully!');
      setRevisionReason('');
      setIsRejectDialogOpen(false);
    } catch (err: any) {
      setError(`Failed to reject delivery: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddFiles = (newFileUrls: string[]) => {
    const diff = newFileUrls.length - fileUrls.length;
    
    if (diff > 0) {
      // New files were added
      // In a real implementation, we would convert the file URLs back to actual File objects
      // For now, we'll simulate this by creating new File objects
      const newFiles: File[] = [];
      for (let i = 0; i < diff; i++) {
        const filename = newFileUrls[fileUrls.length + i].split('/').pop() || 'file.txt';
        newFiles.push(new File(['dummy content'], filename, { type: 'text/plain' }));
      }
      
      setFiles([...files, ...newFiles]);
      setFileUrls(newFileUrls);
    } else {
      // Files were removed
      const removedIndices = fileUrls.map((url, i) => 
        newFileUrls.includes(url) ? -1 : i
      ).filter(i => i !== -1);
      
      setFiles(files.filter((_, i) => !removedIndices.includes(i)));
      setFileUrls(newFileUrls);
    }
  };
  
  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };
  
  // Convert FileData objects to URL strings for DeliveryFileUploader
  const deliveryFileUrls = deliveryFiles.map(file => file.url || '').filter(url => url !== '');
  
  return (
    <DeliveryContainer elevation={2}>
      <Typography variant="h6" gutterBottom>
        Order Delivery
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {(error || success) && (
        <Box sx={{ mb: 2 }}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
        </Box>
      )}
      
      <Stepper activeStep={getActiveStep()} orientation="vertical">
        <Step>
          <StepLabel>Order Placed</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              Order has been created and is awaiting processing.
            </Typography>
          </StepContent>
        </Step>
        
        <Step>
          <StepLabel>In Progress</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              The seller is working on your order.
            </Typography>
          </StepContent>
        </Step>
        
        <Step>
          <StepLabel>Delivered</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              The seller has delivered the order. Please review and either approve or request revisions.
            </Typography>
          </StepContent>
        </Step>
        
        <Step>
          <StepLabel>Completed</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              The order has been completed. Thank you for your business!
            </Typography>
          </StepContent>
        </Step>
      </Stepper>
      
      {/* Revision History */}
      {revisionRequests.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="subtitle1">
                  Revision History ({revisionRequests.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {revisionRequests.map((revision, index) => (
                <Box 
                  key={revision.id} 
                  sx={{ 
                    border: '1px solid #eee', 
                    p: 2, 
                    borderRadius: 1, 
                    mb: 1,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Typography variant="subtitle2">
                    Revision #{revisionRequests.length - index}
                    <Typography 
                      component="span" 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ ml: 1 }}
                    >
                      Requested on {formatTimestamp(revision.timestamp)}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {revision.description}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
      
      {/* Delivery Files Display */}
      {deliveryFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Delivery Files
          </Typography>
          <DeliveryFileUploader 
            files={deliveryFileUrls} 
            onUpload={() => {}} // Read-only mode, no upload function needed
          />
        </Box>
      )}
      
      {/* Action Panels based on role and status */}
      {userRole === 'seller' && orderStatus === 'in_progress' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Submit Delivery
          </Typography>
          
          <DeliveryFileUploader 
            files={fileUrls} 
            onUpload={handleAddFiles} 
          />
          
          <TextField
            label="Delivery Message"
            placeholder="Provide any instructions or notes about your delivery..."
            multiline
            rows={3}
            fullWidth
            value={deliveryMessage}
            onChange={(e) => setDeliveryMessage(e.target.value)}
            margin="normal"
          />
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              onClick={handleDeliverySubmit}
              disabled={isSubmitting || files.length === 0}
            >
              Submit Delivery
            </Button>
          </Box>
        </Box>
      )}
      
      {userRole === 'buyer' && orderStatus === 'delivered' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Review Delivery
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review the delivery and either approve it or request revisions if needed.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              onClick={handleApproveDelivery}
              disabled={isSubmitting}
              sx={{ flexGrow: 1 }}
            >
              Approve Delivery
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<ErrorIcon />}
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isSubmitting}
              sx={{ flexGrow: 1 }}
            >
              Request Revisions
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Revision Request Dialog */}
      <Dialog 
        open={isRejectDialogOpen} 
        onClose={() => setIsRejectDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Request Revisions</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please explain what changes you need the seller to make.
            Be specific so the seller can address your concerns effectively.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Revision Details"
            fullWidth
            multiline
            rows={4}
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRejectDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleRevisionRequest} 
            color="primary" 
            variant="contained"
            disabled={isSubmitting || revisionReason.trim() === ''}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </DeliveryContainer>
  );
};

export default OrderDeliveryPanel; 