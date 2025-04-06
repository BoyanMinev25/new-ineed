import React, { useState, useEffect, useRef } from 'react';
import { useOrders } from '../context/OrdersContext';
import { styled } from '@mui/system';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Box,
  Chip,
  Badge,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Send as SendIcon,
  Attachment as AttachmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CloudDownload as DownloadIcon,
  Info as InfoIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import CreateOrderModal from './CreateOrderModal';

interface OrderMessagePanelProps {
  orderId: string;
  userRole: 'buyer' | 'seller';
  userName: string;
  otherPartyName: string;
  isPreOrderChat?: boolean; // Flag to indicate this is a pre-order conversation
}

interface OrderMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  content: string;
  timestamp: Date | string;
  attachmentFiles?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
  }>;
  isRead: boolean;
}

// Pre-order messaging functions
const usePreOrderMessaging = (conversationId: string) => {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  
  const sendMessage = async (content: string, attachments: File[] = []): Promise<void> => {
    throw new Error('Pre-order messaging not implemented');
  };
  
  const markMessageAsRead = async (messageId: string): Promise<void> => {
    throw new Error('Pre-order messaging not implemented');
  };
  
  return {
    messages,
    sendMessage,
    markMessageAsRead,
    loading: false
  };
};

const MessageContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1
}));

const MessageList = styled(List)(({ theme }) => ({
  overflow: 'auto',
  flexGrow: 1,
  padding: theme.spacing(1)
}));

const MessageItem = styled(ListItem)<{ isMine: boolean }>(({ theme, isMine }) => ({
  flexDirection: 'column',
  alignItems: isMine ? 'flex-end' : 'flex-start',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const MessageContent = styled(Paper)<{ isMine: boolean }>(({ theme, isMine }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '80%',
  backgroundColor: isMine ? theme.palette.primary.light : theme.palette.grey[100],
  color: isMine ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.spacing(1)
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`
}));

const FileInputHidden = styled('input')({
  display: 'none'
});

const OrderMessagePanel: React.FC<OrderMessagePanelProps> = ({
  orderId,
  userRole,
  userName,
  otherPartyName,
  isPreOrderChat = false
}) => {
  // Use different messaging functions based on whether this is pre-order or order chat
  const ordersContext = useOrders();
  const preOrderMessaging = usePreOrderMessaging(orderId);
  
  // Select the appropriate messaging functions based on isPreOrderChat
  const {
    messages,
    loading: isLoading,
    sendMessage: sendMessageFn,
    markMessageAsRead: markMessageAsReadFn
  } = isPreOrderChat 
    ? preOrderMessaging 
    : {
        messages: [] as OrderMessage[],
        loading: false,
        sendMessage: ordersContext.sendOrderMessage,
        markMessageAsRead: ordersContext.markOrderMessageAsRead
      };
  
  // If using regular order messaging, load messages from OrdersContext
  const [orderMessages, setOrderMessages] = useState<OrderMessage[]>([]);
  const [orderMessagesLoading, setOrderMessagesLoading] = useState(false);
  
  // Only fetch order messages if this is not a pre-order chat
  useEffect(() => {
    if (!isPreOrderChat) {
      const fetchMessages = async () => {
        setOrderMessagesLoading(true);
        try {
          const msgs = await ordersContext.getOrderMessages(orderId);
          setOrderMessages(msgs);
          
          // Mark all unread messages from the other party as read
          for (const message of msgs) {
            if (!message.isRead && message.senderRole !== userRole) {
              await ordersContext.markOrderMessageAsRead(orderId, message.id);
            }
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setOrderMessagesLoading(false);
        }
      };
      
      fetchMessages();
      
      // Set up polling for new messages
      const intervalId = setInterval(fetchMessages, 30000); // Check every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [orderId, isPreOrderChat, ordersContext, userRole]);
  
  // Combine state for consistent UI handling
  const combinedMessages = isPreOrderChat ? messages : orderMessages;
  const combinedLoading = isPreOrderChat ? isLoading : orderMessagesLoading;
  
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combinedMessages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && attachments.length === 0) return;
    
    setIsSending(true);
    try {
      if (isPreOrderChat) {
        // Use pre-order messaging function
        await preOrderMessaging.sendMessage(newMessage, attachments);
      } else {
        // Use regular order messaging function
        await ordersContext.sendOrderMessage(orderId, newMessage, attachments);
        
        // Refresh messages
        const msgs = await ordersContext.getOrderMessages(orderId);
        setOrderMessages(msgs);
      }
      
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      // Error handling without logging
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Add these new state variables
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    price: 0,
    description: '',
    timeframe: '',
    additionalDetails: ''
  });
  
  // Add these new handler functions
  const handleAttachmentMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAttachmentMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateOrderClick = () => {
    handleAttachmentMenuClose();
    
    // In a real implementation, we would fetch the offer details here
    // For now, we'll use placeholder data
    setOfferDetails({
      price: 100,
      description: 'Service description',
      timeframe: '7 days',
      additionalDetails: 'Additional details about the service'
    });
    
    setShowCreateOrderModal(true);
  };

  const handleOrderCreated = (orderId: string) => {
    setShowCreateOrderModal(false);
    
    // Send a message in the chat indicating that an order was created
    const message = `An order has been created from this offer. Order ID: ${orderId}`;
    if (isPreOrderChat) {
      preOrderMessaging.sendMessage(message, []);
    } else {
      ordersContext.sendOrderMessage(orderId, message, []);
    }
  };

  return (
    <MessageContainer elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {isPreOrderChat ? 'Offer Discussion' : 'Order Communication'}
      </Typography>
      
      {isPreOrderChat && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              This is a pre-order discussion. Messages sent here will help clarify the offer details before acceptance.
            </Typography>
          </Box>
        </Alert>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      {combinedLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <MessageList>
            {combinedMessages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Typography color="textSecondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              combinedMessages.map((message) => {
                const isMine = message.senderRole === userRole || message.senderName === 'You';
                return (
                  <MessageItem key={message.id} isMine={isMine}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 30 }}>
                        <Avatar 
                          sx={{ width: 24, height: 24 }}
                          alt={message.senderName}
                        >
                          {message.senderId === 'system' ? 
                            <InfoIcon fontSize="small" /> : 
                            isMine ? 
                              <PersonIcon fontSize="small" /> : 
                              <BusinessIcon fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <Typography variant="caption" color="textSecondary">
                        {message.senderName} - {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Box>
                    
                    <MessageContent isMine={isMine}>
                      <Typography variant="body2">{message.content}</Typography>
                      
                      {message.attachmentFiles && message.attachmentFiles.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {message.attachmentFiles.map((file) => (
                            <Box 
                              key={file.id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 1,
                                p: 0.5,
                                mt: 0.5
                              }}
                            >
                              <AttachmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="caption" sx={{ mr: 1 }}>
                                {file.name} ({formatFileSize(file.size)})
                              </Typography>
                              {file.url && (
                                <IconButton 
                                  size="small" 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </MessageContent>
                  </MessageItem>
                );
              })
            )}
            <div ref={messageEndRef} />
          </MessageList>
          
          {attachments.length > 0 && (
            <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={`${file.name} (${formatFileSize(file.size)})`}
                  onDelete={() => handleRemoveAttachment(index)}
                  icon={<AttachmentIcon />}
                  size="small"
                />
              ))}
            </Box>
          )}
          
          <MessageInputContainer>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Message to ${otherPartyName}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              sx={{ mr: 1 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              multiline
              maxRows={3}
              disabled={isSending}
            />
            
            <Box>
              <IconButton 
                color="primary" 
                onClick={handleAttachmentMenuClick}
                disabled={isSending}
                sx={{ mr: 0.5 }}
              >
                <Badge badgeContent={attachments.length} color="secondary">
                  <AttachmentIcon />
                </Badge>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAttachmentMenuClose}
              >
                <MenuItem onClick={handleAttachmentClick}>
                  <ListItemIcon>
                    <AttachmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Upload Files" />
                </MenuItem>
                
                {/* Only show Create Order option if this is a pre-order chat and the user is a seller */}
                {isPreOrderChat && userRole === 'seller' && (
                  <MenuItem onClick={handleCreateOrderClick}>
                    <ListItemIcon>
                      <ShoppingCartIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Create Order" />
                  </MenuItem>
                )}
              </Menu>
              
              <FileInputHidden
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*,application/pdf,application/zip,text/plain"
              />
              
              <Button
                variant="contained"
                color="primary"
                endIcon={isSending ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSendMessage}
                disabled={isSending || (newMessage.trim() === '' && attachments.length === 0)}
              >
                Send
              </Button>
            </Box>
          </MessageInputContainer>
        </>
      )}
      
      {/* Add the CreateOrderModal */}
      <CreateOrderModal
        open={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        offerId={orderId} // Using orderId as the offerId for now
        offerDetails={offerDetails}
        onOrderCreated={handleOrderCreated}
      />
    </MessageContainer>
  );
};

export default OrderMessagePanel; 