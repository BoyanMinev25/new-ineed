const { OpenAI } = require('openai');

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate follow-up questions based on the category of service
 * @param {string} category - The category of service (e.g., "painting", "plumbing", "dog walking")
 * @param {Object} adDetails - Initial details provided by the user
 * @returns {Promise<Array<string>>} - Array of follow-up questions
 */
async function generateFollowUpQuestions(category, adDetails) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better reasoning
      messages: [
        {
          role: "system",
          content: `You are an expert in ${category} services. Your job is to ask relevant follow-up questions 
          to help clarify and specify the details of a service request. Ask questions that a professional 
          would ask to properly scope and price the job. Generate 3-5 specific, detailed questions.`
        },
        {
          role: "user",
          content: `I need help with a ${category} service. Here are the initial details: ${JSON.stringify(adDetails)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract and format the questions from the AI response
    const aiMessage = response.choices[0].message.content;
    
    // Split by new lines and filter out empty strings
    const questions = aiMessage
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^[0-9]+[\.\)]\s+.+/) || line.endsWith('?'))
      .map(line => {
        // Remove numbering if present
        return line.replace(/^[0-9]+[\.\)]\s+/, '');
      });

    return questions.length > 0 ? questions : [aiMessage]; // Fallback to entire response if parsing fails
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [
      "What are the specific dimensions of the area?",
      "When do you need this service completed?",
      "Are there any special requirements or considerations for this job?"
    ]; // Fallback questions in case of API error
  }
}

/**
 * Determine the most appropriate category for an ad based on its description
 * @param {string} description - User's description of the service needed
 * @returns {Promise<string>} - The determined category
 */
async function determineCategory(description) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in categorizing service requests. 
          Given a description of a service needed, categorize it into one of the following categories:
          - Home Repair & Maintenance
          - Cleaning & Housekeeping
          - Moving & Transportation
          - Pet Care
          - Personal Care & Wellness
          - Professional Services
          - Technology Help
          - Events & Entertaining
          - Education & Tutoring
          - Other (only if it truly doesn't fit elsewhere)
          
          Respond with only the category name, nothing else.`
        },
        {
          role: "user",
          content: `Please categorize this service request: "${description}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error determining category:', error);
    return 'Other'; // Default fallback category
  }
}

module.exports = {
  generateFollowUpQuestions,
  determineCategory,
}; 