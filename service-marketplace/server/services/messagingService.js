const admin = require('firebase-admin');
const notificationService = require('./notificationService');

/**
 * Messaging Service
 * Handles in-app messaging between users
 */
class MessagingService {
  constructor() {
    this.db = admin.firestore();
    this.messagesCollection = this.db.collection('messages');
    this.conversationsCollection = this.db.collection('conversations');
  }

  /**
   * Create a new conversation between users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {string} adId - Optional ad ID if conversation is related to an ad
   * @param {Object} metadata - Optional metadata for the conversation
   * @returns {Promise<string>} - Conversation ID
   */
  async createConversation(user1Id, user2Id, adId = null, metadata = null) {
    try {
      // Sort user IDs to ensure consistent conversation lookup
      const participants = [user1Id, user2Id].sort();
      
      // Extract offerId from metadata if it exists
      const offerId = metadata?.offerId || null;
      
      // Check if conversation already exists
      let existingConversationQuery = this.conversationsCollection
        .where('participants', '==', participants);
      
      const existingConversationSnapshot = await existingConversationQuery.get();
      
      // Find the conversation that matches both participants and the offer ID (if any)
      let existingConversation = null;
      if (!existingConversationSnapshot.empty) {
        existingConversation = existingConversationSnapshot.docs.find(doc => {
          const data = doc.data();
          
          if (offerId) {
            // For specific offer conversations, match the offer ID
            return (data.metadata && data.metadata.offerId === offerId) || 
                   (data.offerId === offerId);
          } else {
            // For general conversations, ensure there's no offer ID attached
            return (!data.metadata || !data.metadata.offerId) && !data.offerId;
          }
        });
      }
      
      if (existingConversation) {
        return existingConversation.id;
      }
      
      // Create a new conversation
      const conversationData = {
        participants,
        participantsMap: {
          [user1Id]: true,
          [user2Id]: true
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        adId,
        metadata
      };
      
      const conversationRef = await this.conversationsCollection.add(conversationData);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} content - Message content
   * @param {string} type - Message type (text, image, etc.)
   * @returns {Promise<string>} - Message ID
   */
  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      // Get conversation to verify sender is a participant
      const conversationRef = this.conversationsCollection.doc(conversationId);
      const conversation = await conversationRef.get();
      
      if (!conversation.exists) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      
      const conversationData = conversation.data();
      if (!conversationData.participantsMap[senderId]) {
        throw new Error(`User ${senderId} is not a participant in this conversation`);
      }
      
      // Create the message
      const messageData = {
        conversationId,
        senderId,
        content,
        type,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: {}
      };
      
      // Mark as unread for all participants except sender
      conversationData.participants.forEach(participantId => {
        if (participantId !== senderId) {
          messageData.read[participantId] = false;
        }
      });
      
      // Add message to database
      const messageRef = await this.messagesCollection.add(messageData);
      
      // Update conversation with last message
      await conversationRef.update({
        lastMessage: {
          content: type === 'text' ? content : `[${type}]`,
          senderId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get sender information for notification
      const senderDoc = await admin.firestore().collection('users').doc(senderId).get();
      const senderData = senderDoc.data();
      const senderName = senderData.displayName || 'A user';
      
      // Send notification to other participants
      const otherParticipants = conversationData.participants.filter(id => id !== senderId);
      
      for (const recipientId of otherParticipants) {
        await notificationService.sendNewMessageNotification(
          recipientId,
          senderId,
          senderName,
          type === 'text' ? content : `[${type}]`
        );
      }
      
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of conversations
   */
  async getUserConversations(userId) {
    try {
      const conversationsSnapshot = await this.conversationsCollection
        .where(`participantsMap.${userId}`, '==', true)
        .orderBy('updatedAt', 'desc')
        .get();
      
      if (conversationsSnapshot.empty) {
        return [];
      }
      
      const conversations = [];
      
      for (const doc of conversationsSnapshot.docs) {
        const conversationData = doc.data();
        
        // Get the other participant's info
        const otherParticipantId = conversationData.participants.find(id => id !== userId);
        const otherParticipantDoc = await admin.firestore().collection('users').doc(otherParticipantId).get();
        const otherParticipantData = otherParticipantDoc.data();
        
        conversations.push({
          id: doc.id,
          otherParticipant: {
            id: otherParticipantId,
            displayName: otherParticipantData.displayName || 'Unknown User',
            photoURL: otherParticipantData.photoURL || null
          },
          lastMessage: conversationData.lastMessage,
          updatedAt: conversationData.updatedAt,
          adId: conversationData.adId
        });
      }
      
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages from a conversation
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Maximum number of messages to retrieve
   * @param {string} startAfter - Start after this message ID for pagination
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversationMessages(conversationId, limit = 50, startAfter = null) {
    try {
      let query = this.messagesCollection
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (startAfter) {
        const startAfterDoc = await this.messagesCollection.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      const messagesSnapshot = await query.get();
      
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return messages;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read for a user
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markConversationAsRead(conversationId, userId) {
    try {
      // Get unread messages for the user in this conversation
      const unreadMessagesSnapshot = await this.messagesCollection
        .where('conversationId', '==', conversationId)
        .where(`read.${userId}`, '==', false)
        .get();
      
      if (unreadMessagesSnapshot.empty) {
        return;
      }
      
      // Create a batch to update multiple messages
      const batch = this.db.batch();
      
      unreadMessagesSnapshot.docs.forEach(doc => {
        const messageRef = this.messagesCollection.doc(doc.id);
        batch.update(messageRef, {
          [`read.${userId}`]: true
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }
}

module.exports = new MessagingService(); 