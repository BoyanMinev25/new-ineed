# Design Rules for Social Media Features

This document outlines the design guidelines for the social media-like features implemented in the Service Marketplace application, specifically for the offers section.

## Offer Comments

### Component Structure
- `OfferComments`: Main container component that displays a collapsible list of comments for an offer
- `CommentItem`: Individual comment display with user avatar, content, and metadata
- `OfferCommentReactions`: Component for displaying and managing reactions on comments

### Visual Design
- Comments are displayed in a chat-like interface with left/right alignment based on ownership
- User avatars are displayed with the first letter of the username
- Comment bubbles use rounded corners with different styling for own vs. others' comments
- Own comments: Right-aligned, primary color background (primary.50)
- Others' comments: Left-aligned, paper background
- Timestamps are displayed in relative format (e.g., "2 hours ago")
- Collapsible interface with comment count and expand/collapse icon

### Interaction Design
- Click on the comment header to expand/collapse the comment section
- Comment form appears at the bottom of the expanded section
- Send button is disabled until comment text is entered
- Loading indicator appears during comment submission
- Real-time updates when new comments are added

## Offer Reactions

### Component Structure
- `OfferReactions`: Main component for displaying and managing reactions on offers
- `ReactionBadge`: Individual reaction display with count and interactive behavior

### Visual Design
- Reactions are displayed as emoji badges with count indicators
- Active reactions (user's own) have primary color badges
- Inactive reactions have grey badges
- Reaction picker displays all available reactions in a popover
- Add reaction button is smaller and more subtle than main action buttons

### Interaction Design
- Click on a reaction to toggle it (add/remove)
- Click on the add reaction button to open the reaction picker
- Hover effects on reactions for better feedback
- Reactions update in real-time when toggled

## Comment Reactions

### Component Structure
- `OfferCommentReactions`: Component for displaying and managing reactions on comments
- `CommentReactionBadge`: Smaller version of reaction badges for comments

### Visual Design
- Similar to offer reactions but with smaller size to fit the comment layout
- Smaller font size and padding for emoji and badges
- Positioned next to the comment timestamp

### Interaction Design
- Same as offer reactions but adapted for the comment context
- Click to toggle, click add button to open picker
- Real-time updates when reactions change

## Color Scheme
- Primary color for active elements and own content
- Grey for inactive elements
- Paper background for others' content
- Consistent with the overall application theme

## Typography
- Comment author: subtitle2
- Comment content: body2
- Timestamps and metadata: caption
- Reaction counts: small badges with minimal text

## Spacing and Layout
- Consistent padding and margins throughout components
- Proper spacing between comments (mb: 2)
- Compact but readable layout for reactions
- Responsive design that works on mobile and desktop

## Accessibility
- All interactive elements have proper focus states
- Color contrast meets WCAG standards
- Tooltips provide additional context for reactions
- Keyboard navigation support for all interactive elements 