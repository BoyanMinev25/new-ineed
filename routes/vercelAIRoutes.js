const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');

/**
 * Route to generate follow-up questions based on the category of service
 */
router.post('/questions', async (req, res) => {
  try {
    const { category, adDetails } = req.body;
    
    if (!category || !adDetails) {
      return res.status(400).json({ 
        message: 'Missing required fields: category and adDetails are required' 
      });
    }
    
    const questions = await openaiService.generateFollowUpQuestions(category, adDetails);
    
    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Error generating questions' });
  }
});

/**
 * Route to determine the most appropriate category for an ad
 */
router.post('/determine-category', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        message: 'Missing required field: description is required' 
      });
    }
    
    const category = await openaiService.determineCategory(description);
    
    res.status(200).json({ category });
  } catch (error) {
    console.error('Error determining category:', error);
    res.status(500).json({ message: 'Error determining category' });
  }
});

module.exports = router; 