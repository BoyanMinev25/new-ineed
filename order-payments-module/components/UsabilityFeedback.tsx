import React, { useState } from 'react';
import '../styles/components/UsabilityFeedback.scss';

interface UsabilityFeedbackProps {
  pageId: string;
  componentId?: string;
  isVisible?: boolean;
  onSubmit?: (feedback: FeedbackData) => void;
  onDismiss?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  theme?: 'light' | 'dark';
}

export interface FeedbackData {
  pageId: string;
  componentId?: string;
  rating: number | null;
  difficulty: number | null;
  comments: string;
  email?: string;
  timestamp: number;
  taskCompleted: boolean;
  userAgent: string;
  screenSize: {
    width: number;
    height: number;
  };
}

const UsabilityFeedback: React.FC<UsabilityFeedbackProps> = ({
  pageId,
  componentId,
  isVisible = true,
  onSubmit,
  onDismiss,
  position = 'bottom-right',
  theme = 'light'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [email, setEmail] = useState('');
  const [taskCompleted, setTaskCompleted] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isVisible) return null;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDismiss = () => {
    setIsExpanded(false);
    if (onDismiss) onDismiss();
  };

  const handleSubmit = () => {
    if (submitting) return;

    setSubmitting(true);
    
    const feedbackData: FeedbackData = {
      pageId,
      componentId,
      rating,
      difficulty,
      comments,
      email: email || undefined,
      timestamp: Date.now(),
      taskCompleted,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    if (onSubmit) {
      onSubmit(feedbackData);
    } else {
      // Default behavior: log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Feedback submitted:', feedbackData);
      }
      
      // In a real implementation, you would send this to your analytics service
      // or a dedicated feedback API endpoint
    }

    setSubmitted(true);
    setSubmitting(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setRating(null);
      setDifficulty(null);
      setComments('');
      setEmail('');
      setTaskCompleted(true);
      setIsExpanded(false);
    }, 3000);
  };

  return (
    <div 
      className={`
        usability-feedback 
        usability-feedback--${position} 
        usability-feedback--${theme}
        ${isExpanded ? 'usability-feedback--expanded' : ''}
      `}
    >
      {!isExpanded ? (
        <button 
          className="usability-feedback__toggle"
          onClick={handleToggleExpand}
          aria-label="Provide feedback"
        >
          <span className="usability-feedback__toggle-icon">💬</span>
          <span className="usability-feedback__toggle-text">Feedback</span>
        </button>
      ) : (
        <div className="usability-feedback__panel">
          <div className="usability-feedback__header">
            <h3>Help Us Improve</h3>
            <button 
              className="usability-feedback__close"
              onClick={handleDismiss}
              aria-label="Close feedback form"
            >
              ✕
            </button>
          </div>

          {!submitted ? (
            <div className="usability-feedback__content">
              <div className="usability-feedback__field">
                <label>How would you rate this experience?</label>
                <div className="usability-feedback__rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className={`usability-feedback__star ${rating === value ? 'active' : ''}`}
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} out of 5`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="usability-feedback__field">
                <label>How difficult was this task?</label>
                <div className="usability-feedback__difficulty">
                  <button
                    className={`usability-feedback__difficulty-btn ${difficulty === 1 ? 'active' : ''}`}
                    onClick={() => setDifficulty(1)}
                  >
                    Easy
                  </button>
                  <button
                    className={`usability-feedback__difficulty-btn ${difficulty === 2 ? 'active' : ''}`}
                    onClick={() => setDifficulty(2)}
                  >
                    Medium
                  </button>
                  <button
                    className={`usability-feedback__difficulty-btn ${difficulty === 3 ? 'active' : ''}`}
                    onClick={() => setDifficulty(3)}
                  >
                    Hard
                  </button>
                </div>
              </div>

              <div className="usability-feedback__field">
                <label>Were you able to complete the task?</label>
                <div className="usability-feedback__task-completed">
                  <label>
                    <input
                      type="radio"
                      checked={taskCompleted}
                      onChange={() => setTaskCompleted(true)}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!taskCompleted}
                      onChange={() => setTaskCompleted(false)}
                    />
                    No
                  </label>
                </div>
              </div>

              <div className="usability-feedback__field">
                <label>Comments (optional)</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="What worked well? What could be improved?"
                ></textarea>
              </div>

              <div className="usability-feedback__field">
                <label>Email (optional, for follow-up)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <button
                className="usability-feedback__submit"
                onClick={handleSubmit}
                disabled={rating === null}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          ) : (
            <div className="usability-feedback__thank-you">
              <div className="usability-feedback__thank-you-icon">✓</div>
              <p>Thank you for your feedback!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsabilityFeedback; 