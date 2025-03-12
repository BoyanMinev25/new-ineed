const admin = require('firebase-admin');

/**
 * Notification Service
 * Handles sending real-time notifications to users via Firebase Cloud Messaging
 */
class NotificationService {
  /**
   * Send a notification to a specific user
   * @param {string} userId - The ID of the user to send notification to
   * @param {object} notification - The notification object
   * @param {string} notification.title - The notification title
   * @param {string} notification.body - The notification body
   * @param {object} data - Additional data to include with the notification
   * @returns {Promise<string>} - The message ID
   */
  async sendToUser(userId, notification, data = {}) {
    try {
      // Get the user's FCM token from Firestore
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      
      if (!fcmToken) {
        throw new Error(`FCM token not found for user ${userId}`);
      }
      
      // Create the message
      const message = {
        notification,
        data,
        token: fcmToken,
      };
      
      // Send the message
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent notification to user ${userId}:`, response);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
  
  /**
   * Send a notification to multiple users
   * @param {string[]} userIds - Array of user IDs to send notifications to
   * @param {object} notification - The notification object
   * @param {string} notification.title - The notification title
   * @param {string} notification.body - The notification body
   * @param {object} data - Additional data to include with the notification
   * @returns {Promise<string[]>} - Array of message IDs
   */
  async sendToMultipleUsers(userIds, notification, data = {}) {
    try {
      const promises = userIds.map(userId => this.sendToUser(userId, notification, data));
      return Promise.all(promises);
    } catch (error) {
      console.error('Error sending multiple notifications:', error);
      throw error;
    }
  }
  
  /**
   * Send notification for a new bid on an ad
   * @param {string} adOwnerId - The ID of the ad owner
   * @param {string} adId - The ID of the ad
   * @param {string} bidderName - Name of the bidder
   * @param {number} bidAmount - The bid amount
   * @returns {Promise<string>} - The message ID
   */
  async sendNewBidNotification(adOwnerId, adId, bidderName, bidAmount) {
    const notification = {
      title: 'New Bid Received',
      body: `${bidderName} has placed a bid of ${bidAmount} on your service request`
    };
    
    const data = {
      type: 'new_bid',
      adId,
      bidAmount: bidAmount.toString()
    };
    
    return this.sendToUser(adOwnerId, notification, data);
  }
  
  /**
   * Send notification for a bid acceptance
   * @param {string} bidderId - The ID of the bidder
   * @param {string} adId - The ID of the ad
   * @param {string} adTitle - The title of the ad
   * @returns {Promise<string>} - The message ID
   */
  async sendBidAcceptedNotification(bidderId, adId, adTitle) {
    const notification = {
      title: 'Bid Accepted',
      body: `Your bid for "${adTitle}" has been accepted!`
    };
    
    const data = {
      type: 'bid_accepted',
      adId
    };
    
    return this.sendToUser(bidderId, notification, data);
  }
  
  /**
   * Send notification for a new message
   * @param {string} recipientId - The ID of the message recipient
   * @param {string} senderId - The ID of the message sender
   * @param {string} senderName - The name of the sender
   * @param {string} messageText - The message text (preview)
   * @returns {Promise<string>} - The message ID
   */
  async sendNewMessageNotification(recipientId, senderId, senderName, messageText) {
    const notification = {
      title: `New message from ${senderName}`,
      body: messageText.length > 100 ? `${messageText.substring(0, 97)}...` : messageText
    };
    
    const data = {
      type: 'new_message',
      senderId
    };
    
    return this.sendToUser(recipientId, notification, data);
  }
}

module.exports = new NotificationService(); 