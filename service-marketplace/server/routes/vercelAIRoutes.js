const express = require('express');
const router = express.Router();
const vercelAIService = require('../services/vercelAIService');

// Try to import the user service, but handle the case if it doesn't exist
let userService;
try {
  userService = require('../services/user').userService;
} catch (error) {
  console.warn('User service not found, provider recommendations will use mock data');
  // Create a mock service that returns dummy data for development
  userService = {
    getServiceProviders: async () => {
      return [
        {
          id: 'provider1',
          name: 'John Doe',
          rating: 4.8,
          specialties: ['Plumbing', 'Electrical'],
          completedJobs: 25
        },
        {
          id: 'provider2',
          name: 'Jane Smith',
          rating: 4.9,
          specialties: ['Painting', 'Home Repair'],
          completedJobs: 32
        },
        {
          id: 'provider3',
          name: 'Mike Johnson',
          rating: 4.7,
          specialties: ['Gardening', 'Landscaping'],
          completedJobs: 18
        }
      ];
    }
  };
}

/**
 * Route to handle AI question assistance
 * Compatible with the frontend API needs
 */
router.post('/question-assistance', async (req, res) => {
  try {
    console.log('Received question-assistance request:', req.body);
    const { messages } = req.body;
    
    if (!messages || !messages.length) {
      return res.status(400).json({ 
        message: 'Missing required field: messages'
      });
    }
    
    // Get the last user message
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
      
    if (!lastUserMessage) {
      return res.status(400).json({
        message: 'No user message found'
      });
    }
    
    // Extract service type and request from the message
    const content = lastUserMessage.content;
    console.log('Processing message content:', content);
    
    const serviceType = content.includes('similar') 
      ? content.split('similar ')[1].split(' requests')[0] 
      : 'service';
    const initialRequest = content.includes('User Request:') 
      ? content.split('User Request: \'')[1].split('\'')[0]
      : content;
    
    console.log('Extracted serviceType:', serviceType);
    console.log('Extracted initialRequest:', initialRequest);
    
    try {
      // Try to get AI-generated suggestions
      const suggestions = await vercelAIService.generateQuestionSuggestions(
        initialRequest,
        serviceType
      );
      
      // Format response
      console.log('Sending AI-generated response');
      return res.status(200).json({
        role: 'assistant',
        content: suggestions
      });
    } catch (aiError) {
      // If OpenAI service fails, fall back to predefined questions
      console.error('OpenAI service error:', aiError);
      console.log('Using fallback predefined questions');
      
      // Generate questions based on request type/keywords
      let fallbackQuestions = '';
      
      // Extract keywords from request
      const keywords = initialRequest.toLowerCase();
      
      if (keywords.includes('car') || keywords.includes('vehicle') || keywords.includes('engine')) {
        fallbackQuestions = "1. When did you first notice the issue?\n2. What is the make, model and year of your vehicle?\n3. Have you had any recent repairs or maintenance done?\n4. Are there any warning lights on the dashboard?\n5. Does the issue occur at specific times or under certain conditions?";
      } else if (keywords.includes('house') || keywords.includes('home') || keywords.includes('apartment')) {
        fallbackQuestions = "1. How large is the space that needs work (in square footage)?\n2. Is this a rental property or do you own it?\n3. Are there any specific materials or brands you prefer?\n4. Do you need permits arranged for this work?\n5. Is there a specific deadline or timeline for completion?";
      } else if (keywords.includes('computer') || keywords.includes('laptop') || keywords.includes('tech')) {
        fallbackQuestions = "1. What operating system are you using?\n2. When did you first notice the problem?\n3. Have you installed any new software recently?\n4. Is the issue consistent or intermittent?\n5. Have you tried restarting the device or system?";
      } else {
        // Generic questions
        fallbackQuestions = "1. How urgently do you need this service?\n2. Do you have a specific budget range in mind?\n3. Have you tried to address this issue before?\n4. Are there any specific qualifications you're looking for in a service provider?\n5. Is there anything else about your specific situation that a service provider should know?";
      }
      
      return res.status(200).json({
        role: 'assistant',
        content: fallbackQuestions
      });
    }
  } catch (error) {
    console.error('Error in question-assistance route:', error);
    // Return fallback questions even in case of server error
    res.status(200).json({ 
      role: 'assistant',
      content: "1. How urgently do you need this service?\n2. What is your budget for this project?\n3. Do you require any specific qualifications?\n4. What is your availability for the service provider to come?\n5. Is there anything special about your situation that would be useful for the service provider to know?"
    });
  }
});

/**
 * Route to handle service categorization
 */
router.post('/categorize', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        message: 'Missing required field: prompt'
      });
    }
    
    // Extract description from the prompt
    const description = prompt.includes('Service Request:') 
      ? prompt.split('Service Request: \'')[1].split('\'')[0]
      : prompt;
    
    const category = await vercelAIService.categorizeService(description);
    
    // Format response
    res.status(200).json({ text: category });
  } catch (error) {
    console.error('Error categorizing service:', error);
    res.status(500).json({ 
      text: 'Error categorizing service. Please try again.' 
    });
  }
});

/**
 * Route to handle price estimation
 */
router.post('/price-estimate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        message: 'Missing required field: prompt'
      });
    }
    
    // Extract service description from the prompt
    const serviceDescription = prompt.includes('Service Request:') 
      ? prompt.split('Service Request: \'')[1].split('\'')[0]
      : prompt;
    
    const priceEstimate = await vercelAIService.estimatePrice(serviceDescription);
    
    // Format response
    res.status(200).json({ text: priceEstimate });
  } catch (error) {
    console.error('Error estimating price:', error);
    
    // Check if this is a rate limit error
    if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
      // Extract retry-after time if available
      let retryAfter = 60; // Default to 60 seconds
      if (error.headers && error.headers['retry-after']) {
        retryAfter = parseInt(error.headers['retry-after'], 10);
      }
      
      console.warn(`Rate limit reached. Retry after ${retryAfter} seconds.`);
      
      // Generate a fallback price estimate
      let fallbackEstimate;
      try {
        fallbackEstimate = vercelAIService._generateFallbackPriceEstimate(serviceDescription);
      } catch (fallbackError) {
        fallbackEstimate = 'AI service is currently at capacity. Please try again later.';
      }
      
      return res.status(429).json({
        text: fallbackEstimate,
        isRateLimited: true,
        retryAfter
      });
    }
    
    // For other errors, return a generic message
    res.status(500).json({ 
      text: 'Error estimating price. Please try again.'
    });
  }
});

/**
 * Route to handle chatbot responses
 */
router.post('/chatbot', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !messages.length) {
      return res.status(400).json({ 
        message: 'Missing required field: messages'
      });
    }
    
    const response = await vercelAIService.chatbotResponse(messages);
    
    // Format response
    res.status(200).json({
      role: 'assistant',
      content: response
    });
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    res.status(500).json({ 
      role: 'assistant',
      content: 'I\'m having trouble processing your request right now. Please try again or contact our support team for assistance.'
    });
  }
});

/**
 * Route to handle provider recommendations
 */
router.post('/provider-recommendations', async (req, res) => {
  try {
    const { serviceRequest } = req.body;
    
    if (!serviceRequest) {
      return res.status(400).json({ 
        message: 'Missing required field: serviceRequest'
      });
    }
    
    // Get providers from user service
    const providers = await userService.getServiceProviders();
    
    const recommendations = await vercelAIService.recommendProviders(
      serviceRequest,
      providers
    );
    
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error('Error getting provider recommendations:', error);
    res.status(500).json({ 
      message: 'Error getting provider recommendations',
      recommendations: []
    });
  }
});

module.exports = router; 