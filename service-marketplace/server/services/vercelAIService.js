const { OpenAI } = require('openai');

/**
 * VercelAIService - Service for handling AI-powered features using OpenAI
 * This service is built to work with the Vercel AI SDK on the frontend
 */
class VercelAIService {
  constructor() {
    // Initialize OpenAI if environment variables are set
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.aiAvailable = true;
        console.log('OpenAI service initialized successfully');
      } catch (error) {
        console.error('Error initializing OpenAI service:', error);
        this.aiAvailable = false;
      }
    } else {
      console.warn('OpenAI API key not found in environment variables');
      this.aiAvailable = false;
    }
    
    // Add cache for responses to reduce API calls
    this.cache = {
      priceEstimates: new Map(),
      questionSuggestions: new Map(),
      categorizations: new Map()
    };
    
    // Rate limiting tracking
    this.rateLimitStatus = {
      isRateLimited: false,
      resetTime: null,
      consecutiveFailures: 0
    };
    
    // Set up cache cleanup interval (every hour)
    setInterval(() => this._cleanupCache(), 60 * 60 * 1000);
  }

  /**
   * Clean up old cache entries
   * @private
   */
  _cleanupCache() {
    const now = Date.now();
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    
    const cleanMap = (map) => {
      for (const [key, entry] of map.entries()) {
        if (now - entry.timestamp > MAX_AGE) {
          map.delete(key);
        }
      }
    };
    
    cleanMap(this.cache.priceEstimates);
    cleanMap(this.cache.questionSuggestions);
    cleanMap(this.cache.categorizations);
    
    console.log('Cache cleanup completed');
  }

  /**
   * Check if AI service is available
   * @private
   * @throws {Error} If AI service is not available
   */
  _checkAIAvailability() {
    if (!this.aiAvailable) {
      throw new Error('AI service is not available');
    }
    
    // Check if we're currently rate limited
    if (this.rateLimitStatus.isRateLimited) {
      const now = new Date();
      if (this.rateLimitStatus.resetTime && now < this.rateLimitStatus.resetTime) {
        const waitTime = Math.ceil((this.rateLimitStatus.resetTime - now) / 1000);
        throw new Error(`Rate limited. Please try again in ${waitTime} seconds.`);
      } else {
        // Reset rate limit status if reset time has passed
        this.rateLimitStatus.isRateLimited = false;
        this.rateLimitStatus.resetTime = null;
      }
    }
  }
  
  /**
   * Handle rate limit error
   * @private
   * @param {Error} error - The rate limit error
   */
  _handleRateLimit(error) {
    // Check if this is a rate limit error
    if (error.status === 429) {
      this.rateLimitStatus.isRateLimited = true;
      this.rateLimitStatus.consecutiveFailures++;
      
      // Parse retry-after header if available or default to 60 seconds
      let retryAfter = 60;
      if (error.headers && error.headers['retry-after-ms']) {
        retryAfter = parseInt(error.headers['retry-after-ms']) / 1000;
      } else if (error.headers && error.headers['retry-after']) {
        retryAfter = parseInt(error.headers['retry-after']);
      }
      
      // Add some jitter and backoff based on consecutive failures
      const backoffMultiplier = Math.min(Math.pow(2, this.rateLimitStatus.consecutiveFailures - 1), 16);
      retryAfter = retryAfter * backoffMultiplier + Math.random() * 5;
      
      // Set reset time
      const resetTime = new Date();
      resetTime.setSeconds(resetTime.getSeconds() + retryAfter);
      this.rateLimitStatus.resetTime = resetTime;
      
      console.warn(`Rate limited. Will retry after ${retryAfter.toFixed(1)} seconds (${resetTime.toLocaleTimeString()})`);
    }
  }

  /**
   * Generate question suggestions for a service request
   * @param {string} request - The initial service request
   * @param {string} serviceType - Type of service requested
   * @returns {Promise<string>} - Suggested questions
   */
  async generateQuestionSuggestions(request, serviceType) {
    try {
      this._checkAIAvailability();
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert service advisor for ${serviceType}. Your job is to identify missing details in service requests and suggest questions to help users provide complete information.`
          },
          {
            role: "user",
            content: `User Request: '${request}'. Based on similar ${serviceType} requests, suggest 3-5 additional details that may be needed in a clear, concise format.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating question suggestions:', error);
      return "What are the dimensions or scope of the project? When do you need this service completed? Do you have any specific requirements or preferences?";
    }
  }

  /**
   * Categorize a service request
   * @param {string} description - The service request description
   * @returns {Promise<string>} - The categorization
   */
  async categorizeService(description) {
    try {
      this._checkAIAvailability();
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert in categorizing service requests. Categorize the request into a primary and secondary category using the format "Primary → Secondary".`
          },
          {
            role: "user",
            content: `Service Request: '${description}'. Categorize this request into a primary and secondary category based on industry standards.`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error categorizing service:', error);
      return "Other → General Service";
    }
  }

  /**
   * Estimate price for a service
   * @param {string} serviceDescription - The service description
   * @returns {Promise<string>} - The price estimate
   */
  async estimatePrice(serviceDescription) {
    // First, check cache for this service description
    const cacheKey = serviceDescription.trim().toLowerCase();
    if (this.cache.priceEstimates.has(cacheKey)) {
      const cachedResult = this.cache.priceEstimates.get(cacheKey);
      console.log('Returning cached price estimate');
      return cachedResult.response;
    }
    
    try {
      this._checkAIAvailability();
      
      // Generate a fallback estimate based on the description
      const fallbackEstimate = this._generateFallbackPriceEstimate(serviceDescription);
      
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert estimator for service pricing. Provide a realistic price range and explain the key factors affecting the cost.`
            },
            {
              role: "user",
              content: `Service Request: '${serviceDescription}'. Considering industry standards and regional factors, provide a price estimate range and highlight the key variables affecting the cost.`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        
        const result = response.choices[0].message.content;
        
        // Cache the result with timestamp
        this.cache.priceEstimates.set(cacheKey, {
          response: result,
          timestamp: Date.now()
        });
        
        // Reset consecutive failures counter on success
        this.rateLimitStatus.consecutiveFailures = 0;
        
        return result;
      } catch (error) {
        // Handle rate limiting
        if (error.status === 429) {
          this._handleRateLimit(error);
          console.warn('Using fallback price estimate due to rate limiting');
          return fallbackEstimate;
        }
        
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error('Error estimating price:', error);
      
      // Return fallback response
      return this._generateFallbackPriceEstimate(serviceDescription);
    }
  }
  
  /**
   * Generate a fallback price estimate without using AI
   * @private
   * @param {string} description - The service description
   * @returns {string} - Fallback price estimate
   */
  _generateFallbackPriceEstimate(description) {
    // Extract potential service type from description
    const lowerDesc = description.toLowerCase();
    
    // Simple rule-based estimates based on keywords
    if (lowerDesc.includes('website') || lowerDesc.includes('web development')) {
      return "For website development, prices typically range from $1,000-$10,000 depending on complexity, features, and design requirements. Simple websites cost less, while e-commerce or custom functionality increases the price.";
    } else if (lowerDesc.includes('logo') || lowerDesc.includes('brand')) {
      return "Logo design typically costs between $100-$2,500 depending on designer experience, number of concepts, revisions, and whether brand guidelines are included.";
    } else if (lowerDesc.includes('mobile app') || lowerDesc.includes('app development')) {
      return "Mobile app development ranges from $5,000-$50,000+ depending on platform (iOS/Android/both), features, complexity, and integration requirements. Simple apps start lower, while complex enterprise solutions cost significantly more.";
    } else if (lowerDesc.includes('clean') || lowerDesc.includes('cleaning')) {
      return "Cleaning services typically range from $30-$50 per hour or $100-$300 per home depending on size, condition, and specific requirements. Deep cleaning or specialized services may cost more.";
    } else if (lowerDesc.includes('repair') || lowerDesc.includes('fix')) {
      return "Repair services typically range from $50-$300 depending on the complexity of the problem, parts required, and specialist expertise needed.";
    }
    
    // Default fallback for unknown service types
    return "Estimated cost typically ranges from $100-$1,000 depending on scope, complexity, and specific requirements. Please provide more details for a more accurate estimate.";
  }

  /**
   * AI Chatbot for user support
   * @param {array} messages - The conversation history
   * @returns {Promise<string>} - The chatbot response
   */
  async chatbotResponse(messages) {
    try {
      this._checkAIAvailability();
      const formattedMessages = [
        {
          role: "system",
          content: `You are a helpful customer support chatbot for a service marketplace platform. Help users with questions about using the platform, finding providers, and understanding how services work.`
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      return "I'm having trouble processing your request right now. Please try again or contact our support team for assistance.";
    }
  }

  /**
   * Recommend service providers based on user request
   * @param {string} serviceRequest - The service request
   * @param {array} providers - Available service providers
   * @returns {Promise<array>} - Recommended providers with rationale
   */
  async recommendProviders(serviceRequest, providers) {
    try {
      this._checkAIAvailability();
      const providersStr = JSON.stringify(providers);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert recommender system for service providers. Given a service request and a list of providers with their profiles, recommend the best matches with a brief explanation for each.`
          },
          {
            role: "user",
            content: `User Request: '${serviceRequest}'. Based on the following provider profiles, recommend the top 2-3 candidates with a brief rationale for each recommendation. Provider profiles: ${providersStr}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      // Parse response to extract recommendations
      const content = response.choices[0].message.content;
      const recommendations = this._parseRecommendations(content, providers);
      
      return recommendations;
    } catch (error) {
      console.error('Error recommending providers:', error);
      return [];
    }
  }

  /**
   * Parse recommendations from AI response
   * @private
   * @param {string} content - The AI response content
   * @param {array} providers - Available providers
   * @returns {array} - Structured recommendations
   */
  _parseRecommendations(content, providers) {
    try {
      // Simple parsing strategy: look for provider names in the content
      const recommendations = [];
      
      for (const provider of providers) {
        const namePattern = new RegExp(`${provider.name}\\s*\\(([^\\)]+)\\)[^:]*:([^\\n]+)`, 'i');
        const match = content.match(namePattern);
        
        if (match) {
          recommendations.push({
            provider: provider,
            rating: match[1].trim(),
            rationale: match[2].trim()
          });
        }
      }
      
      // If pattern matching failed, just return providers mentioned in the response
      if (recommendations.length === 0) {
        for (const provider of providers) {
          if (content.includes(provider.name)) {
            recommendations.push({
              provider: provider,
              rationale: "Recommended by AI based on your requirements"
            });
          }
        }
      }
      
      return recommendations.length > 0 ? recommendations : providers.slice(0, 3);
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return providers.slice(0, 3);
    }
  }
}

module.exports = new VercelAIService(); 