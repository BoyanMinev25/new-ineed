const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Create a new conversation or get existing one
 * POST /api/messaging/conversations
 */
router.post('/conversations', async (req, res) => {
  try {
    const { otherUserId, adId, metadata } = req.body;
    const userId = req.user.uid;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }
    
    const conversationId = await messagingService.createConversation(userId, otherUserId, adId, metadata);
    res.status(201).json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * Get all conversations for the current user
 * GET /api/messaging/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.uid;
    const conversations = await messagingService.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * Send a message in a conversation
 * POST /api/messaging/conversations/:conversationId/messages
 */
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type } = req.body;
    const userId = req.user.uid;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const messageId = await messagingService.sendMessage(
      conversationId,
      userId,
      content,
      type || 'text'
    );
    
    res.status(201).json({ messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Get messages from a conversation
 * GET /api/messaging/conversations/:conversationId/messages
 */
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, startAfter } = req.query;
    
    const messages = await messagingService.getConversationMessages(
      conversationId,
      limit ? parseInt(limit) : 50,
      startAfter
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * Mark conversation as read
 * POST /api/messaging/conversations/:conversationId/read
 */
router.post('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uid;
    
    await messagingService.markConversationAsRead(conversationId, userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

module.exports = router; 