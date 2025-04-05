import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Divider,
  Stack,
  Chip,
  Alert
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Send as SendIcon
} from '@mui/icons-material';

interface ReviewFormProps {
  orderId: string;
  sellerName?: string;
  onSubmitReview: (review: {
    rating: number;
    comment: string;
    orderId: string;
    tags: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string;
  successMessage?: string;
}

const SUGGESTED_TAGS = [
  'Fast Delivery',
  'High Quality',
  'Communication',
  'Professional',
  'Expertise',
  'Value',
  'Recommended',
  'Responsive'
];

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  sellerName = 'the seller',
  onSubmitReview,
  isSubmitting = false,
  error,
  successMessage
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hover, setHover] = useState<number>(-1);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation
    if (rating === 0) {
      setFormError('Please provide a rating');
      return;
    }
    
    if (comment.trim().length < 5) {
      setFormError('Please provide a more detailed review');
      return;
    }
    
    try {
      await onSubmitReview({
        rating,
        comment: comment.trim(),
        orderId,
        tags: selectedTags
      });
      
      setSubmitted(true);
    } catch (err) {
      setFormError('Failed to submit review. Please try again.');
    }
  };

  // If the review has been successfully submitted
  if (submitted || successMessage) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage || 'Your review has been submitted successfully!'}
        </Alert>
        <Typography variant="body1">
          Thank you for your feedback. Your review helps other users make informed decisions.
        </Typography>
      </Paper>
    );
  }

  const labels: { [index: string]: string } = {
    0: 'No rating given',
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Review Your Experience
      </Typography>
      
      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || formError}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Rate the Service
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Rating
                value={rating}
                precision={1}
                onChange={(_, newValue) => {
                  setRating(newValue || 0);
                }}
                onChangeActive={(_, newHover) => {
                  setHover(newHover);
                }}
                emptyIcon={<StarBorderIcon sx={{ opacity: 0.55 }} fontSize="inherit" />}
                icon={<StarIcon fontSize="inherit" />}
                size="large"
              />
              {rating !== null && (
                <Box sx={{ width: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    {labels[hover !== -1 ? hover : rating]}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Your Review
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Minimum 5 characters
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select tags that describe your experience
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SUGGESTED_TAGS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => handleTagToggle(tag)}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              startIcon={<SendIcon />}
            >
              Submit Review
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};

export default ReviewForm; 