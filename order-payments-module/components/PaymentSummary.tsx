import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

interface PaymentDetail {
  label: string;
  amount: number;
  isTotal?: boolean;
  description?: string;
}

interface PaymentSummaryProps {
  details: PaymentDetail[];
  currency?: string;
  onViewReceipt?: () => void;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ 
  details, 
  currency = 'USD',
  onViewReceipt
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        bgcolor: 'background.paper' 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Payment Summary
        </Typography>
        
        {onViewReceipt && (
          <Tooltip title="View Receipt">
            <IconButton 
              size="small"
              color="primary"
              onClick={onViewReceipt}
            >
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        {details.map((detail, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1.5,
              ...(detail.isTotal && { 
                mt: 2,
                pt: 2, 
                borderTop: '1px dashed rgba(0, 0, 0, 0.12)' 
              })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant={detail.isTotal ? "subtitle1" : "body2"} 
                sx={{ 
                  fontWeight: detail.isTotal ? 600 : 400,
                  color: detail.isTotal ? 'text.primary' : 'text.secondary',
                  mr: 0.5
                }}
              >
                {detail.label}
              </Typography>
              
              {detail.description && (
                <Tooltip title={detail.description}>
                  <InfoIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                </Tooltip>
              )}
            </Box>
            
            <Typography 
              variant={detail.isTotal ? "subtitle1" : "body2"} 
              sx={{ 
                fontWeight: detail.isTotal ? 600 : 500,
                color: detail.isTotal ? 'text.primary' : 'text.secondary'
              }}
            >
              {formatCurrency(detail.amount)}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        All payments are processed securely through Stripe.
      </Typography>
    </Paper>
  );
};

export default PaymentSummary; 