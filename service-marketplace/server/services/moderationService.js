const admin = require('firebase-admin');
const { OpenAI } = require('openai');

/**
 * Content Moderation Service
 * Handles screening of user-generated content for inappropriate material
 */
class ModerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.db = admin.firestore();
    this.flaggedContentCollection = this.db.collection('flaggedContent');
  }

  /**
   * Moderate text content using OpenAI's moderation API
   * @param {string} content - The text content to moderate
   * @param {string} contentType - The type of content (ad, message, review, etc.)
   * @param {string} contentId - The ID of the content
   * @param {string} userId - The ID of the user who created the content
   * @returns {Promise<Object>} - Moderation result and whether content is flagged
   */
  async moderateText(content, contentType, contentId, userId) {
    try {
      if (!content || content.trim() === '') {
        return { flagged: false, categories: {}, scores: {} };
      }
      
      const result = await this.openai.moderations.create({
        input: content
      });
      
      const moderationData = result.results[0];
      
      // Check if content is flagged
      if (moderationData.flagged) {
        await this.logFlaggedContent(content, contentType, contentId, userId, 'text', moderationData);
      }
      
      return {
        flagged: moderationData.flagged,
        categories: moderationData.categories,
        scores: moderationData.category_scores
      };
    } catch (error) {
      console.error('Error moderating text content:', error);
      // If moderation API fails, log the error but don't block the content
      return { flagged: false, categories: {}, scores: {}, error: error.message };
    }
  }

  /**
   * Moderate image content using content hashing and AI detection
   * @param {string} imageUrl - URL of the image to moderate
   * @param {string} contentType - The type of content (ad, profile, etc.)
   * @param {string} contentId - The ID of the content
   * @param {string} userId - The ID of the user who uploaded the image
   * @returns {Promise<Object>} - Moderation result
   */
  async moderateImage(imageUrl, contentType, contentId, userId) {
    try {
      // For a complete implementation, you would:
      // 1. Use a computer vision API to analyze the image
      // 2. Check against known inappropriate image hashes
      // 3. Implement nudity detection
      
      // This is a simplified placeholder implementation
      // In a real implementation, integrate with a service like Google Vision API
      
      // Simulated result - in production, replace with actual API call
      const simulatedResult = {
        flagged: false,
        categories: {
          explicit: false,
          suggestive: false,
          violent: false,
          harmful: false
        },
        confidence: 0.95
      };
      
      // Log flagged content if detected
      if (simulatedResult.flagged) {
        await this.logFlaggedContent(imageUrl, contentType, contentId, userId, 'image', simulatedResult);
      }
      
      return simulatedResult;
    } catch (error) {
      console.error('Error moderating image:', error);
      // If moderation fails, log the error but don't block the content
      return {
        flagged: false,
        categories: {},
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Log flagged content for review
   * @param {string} content - Content that was flagged
   * @param {string} contentType - Type of content
   * @param {string} contentId - ID of the content
   * @param {string} userId - ID of the user who created the content
   * @param {string} mediaType - Type of media (text, image)
   * @param {object} moderationResult - Result from moderation service
   * @returns {Promise<string>} - ID of the flagged content log
   */
  async logFlaggedContent(content, contentType, contentId, userId, mediaType, moderationResult) {
    try {
      const flaggedContentData = {
        content: mediaType === 'text' ? content : null,
        contentUrl: mediaType === 'image' ? content : null,
        contentType,
        contentId,
        userId,
        mediaType,
        moderationResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        reviewDecision: null
      };
      
      const docRef = await this.flaggedContentCollection.add(flaggedContentData);
      
      // Trigger notification to admin (in a real system, this might send an email or alert)
      console.log(`Content flagged for review: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error logging flagged content:', error);
      throw error;
    }
  }

  /**
   * Review flagged content
   * @param {string} flaggedContentId - ID of the flagged content
   * @param {string} adminId - ID of the admin reviewing the content
   * @param {string} decision - Decision (remove, keep)
   * @param {string} notes - Optional notes about the decision
   * @returns {Promise<boolean>} - Success status
   */
  async reviewFlaggedContent(flaggedContentId, adminId, decision, notes = '') {
    try {
      const flaggedContentRef = this.flaggedContentCollection.doc(flaggedContentId);
      const flaggedContentDoc = await flaggedContentRef.get();
      
      if (!flaggedContentDoc.exists) {
        throw new Error(`Flagged content with ID ${flaggedContentId} not found`);
      }
      
      const flaggedContent = flaggedContentDoc.data();
      
      // Update the flagged content record
      await flaggedContentRef.update({
        reviewed: true,
        reviewedBy: adminId,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewDecision: decision,
        reviewNotes: notes
      });
      
      // If decision is to remove content, take action on the actual content
      if (decision === 'remove') {
        await this.removeContent(
          flaggedContent.contentType,
          flaggedContent.contentId,
          flaggedContent.userId
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error reviewing flagged content:', error);
      throw error;
    }
  }

  /**
   * Remove content that violates guidelines
   * @param {string} contentType - Type of content
   * @param {string} contentId - ID of the content
   * @param {string} userId - ID of the user who created the content
   * @returns {Promise<boolean>} - Success status
   */
  async removeContent(contentType, contentId, userId) {
    try {
      // Handle different types of content
      switch (contentType) {
        case 'ad':
          await this.db.collection('ads').doc(contentId).update({
            status: 'removed',
            removedReason: 'Content violation',
            removedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
          
        case 'message':
          await this.db.collection('messages').doc(contentId).update({
            content: '[Message removed for content violation]',
            removed: true,
            removedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
          
        case 'review':
          await this.db.collection('reviews').doc(contentId).update({
            content: '[Review removed for content violation]',
            removed: true,
            removedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
          
        case 'profilePhoto':
          // Get user document
          const userRef = this.db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            // Update user document to remove photo URL
            await userRef.update({
              photoURL: null,
              photoRemoved: true,
              photoRemovedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          break;
          
        default:
          console.warn(`Unknown content type: ${contentType}`);
          return false;
      }
      
      // Notify user about content removal
      // In a real implementation, send a notification to the user
      
      return true;
    } catch (error) {
      console.error('Error removing content:', error);
      throw error;
    }
  }

  /**
   * Get flagged content for review
   * @param {boolean} onlyUnreviewed - Whether to get only unreviewed content
   * @param {number} limit - Maximum number of items to retrieve
   * @param {string} startAfter - Start after this document ID for pagination
   * @returns {Promise<Array>} - Array of flagged content items
   */
  async getFlaggedContent(onlyUnreviewed = true, limit = 50, startAfter = null) {
    try {
      let query = this.flaggedContentCollection
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (onlyUnreviewed) {
        query = query.where('reviewed', '==', false);
      }
      
      if (startAfter) {
        const startAfterDoc = await this.flaggedContentCollection.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting flagged content:', error);
      throw error;
    }
  }
}

module.exports = new ModerationService(); 