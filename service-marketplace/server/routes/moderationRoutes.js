const express = require('express');
const router = express.Router();
const moderationService = require('../services/moderationService');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * Moderate text content
 * POST /api/moderation/text
 * Public route used by client-side before submitting content
 */
router.post('/text', async (req, res) => {
  try {
    const { content, contentType, contentId, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await moderationService.moderateText(
      content,
      contentType || 'unknown',
      contentId || null,
      userId || null
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error moderating text:', error);
    res.status(500).json({ error: 'Failed to moderate text' });
  }
});

/**
 * Moderate image content
 * POST /api/moderation/image
 * Public route used by client-side before submitting content
 */
router.post('/image', async (req, res) => {
  try {
    const { imageUrl, contentType, contentId, userId } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const result = await moderationService.moderateImage(
      imageUrl,
      contentType || 'unknown',
      contentId || null,
      userId || null
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error moderating image:', error);
    res.status(500).json({ error: 'Failed to moderate image' });
  }
});

// Apply authentication middleware to admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Get flagged content for review
 * GET /api/moderation/flagged
 * Admin only route
 */
router.get('/flagged', async (req, res) => {
  try {
    const { onlyUnreviewed, limit, startAfter } = req.query;
    
    const flaggedContent = await moderationService.getFlaggedContent(
      onlyUnreviewed === 'false' ? false : true,
      limit ? parseInt(limit) : 50,
      startAfter || null
    );
    
    res.json(flaggedContent);
  } catch (error) {
    console.error('Error getting flagged content:', error);
    res.status(500).json({ error: 'Failed to get flagged content' });
  }
});

/**
 * Review flagged content
 * POST /api/moderation/flagged/:id/review
 * Admin only route
 */
router.post('/flagged/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;
    const adminId = req.user.uid;
    
    if (!decision || !['remove', 'keep'].includes(decision)) {
      return res.status(400).json({ error: 'Valid decision (remove or keep) is required' });
    }
    
    const result = await moderationService.reviewFlaggedContent(
      id,
      adminId,
      decision,
      notes || ''
    );
    
    res.json({ success: result });
  } catch (error) {
    console.error('Error reviewing flagged content:', error);
    res.status(500).json({ error: 'Failed to review flagged content' });
  }
});

module.exports = router; 