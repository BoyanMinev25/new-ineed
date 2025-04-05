# Service Marketplace Design System

This document outlines the design patterns, principles, and components used in the Service Marketplace application to ensure visual consistency and a modern user experience.

## Design Principles

Our design follows these core principles:

1. **Modern Minimalism** - Clean layouts with ample whitespace and focused content
2. **Transparency** - Clear communication of service details, pricing, and provider information
3. **Trust Indicators** - Visual elements that convey reputation and reliability
4. **Accessibility** - Inclusive design that works for all users
5. **Responsive Layout** - Adaptable interface that works across devices

## Color Palette

Our application uses a carefully selected color palette:

| Usage | Color | Hex Code |
|-------|-------|----------|
| Primary | Blue | #1976d2 |
| Secondary | Purple | #9c27b0 |
| Success | Green | #4caf50 |
| Warning | Amber | #ff9800 |
| Error | Red | #f44336 |
| Info | Light Blue | #03a9f4 |
| Background | White/Light Gray | #ffffff / #f5f5f5 |
| Text (Primary) | Dark Gray | #212121 |
| Text (Secondary) | Medium Gray | #757575 |

## Typography

We use the Roboto font family for all text elements:

- **Headers**: Roboto, 500 weight (semi-bold)
- **Body Text**: Roboto, 400 weight (regular)
- **Captions/Small Text**: Roboto, 400 weight (regular)

Font sizes:
- H1: 2.125rem (34px)
- H2: 1.875rem (30px)
- H3: 1.5rem (24px)
- H4: 1.25rem (20px)
- H5: 1.125rem (18px)
- H6: 1rem (16px)
- Body: 0.875rem (14px)
- Caption: 0.75rem (12px)

## Component Patterns

### User Profile Displays

We use two types of user profile displays:

#### 1. Minimal User Badge

Located directly under ad titles, this compact display includes:
- User's first name in a chip format with avatar
- Completion count badge (if user has completed jobs)
- Star rating with review count
- Info button for accessing detailed activity

This design provides essential trust signals without overwhelming the primary ad content.

```jsx
<UserInfoBadge userId={userId} minimal={true} onViewDetails={handleOpenDetails} />
```

#### 2. Detailed User Card

Used in profile pages and activity modals, this format includes:
- Large user avatar
- Full name and verification status
- Membership duration
- Detailed rating with review count
- Activity statistics in a horizontal layout
- Recent activity timeline

```jsx
<UserActivityModal userId={userId} open={isOpen} onClose={handleClose} />
```

### Activity Timeline

The activity timeline provides a chronological view of user activity:
- Icon-based activity types (completed jobs, offers, requests, reviews)
- Color-coded status indicators
- Consistent date formatting
- Rating display for review activities

### Ad Detail Layout

Ad details follow a consistent vertical layout:
1. Title (large, prominent)
2. User information (minimal badge format)
3. Category
4. Description
5. Price range
6. Location details
7. AI price estimation
8. Action buttons

This hierarchy ensures the most important information is presented first, with secondary details and actions following.

## Interaction Patterns

### Loading States

We use skeleton loaders for content that's loading, maintaining the layout structure to prevent layout shifts.

### Error Handling

Error states include:
- Clear error messages
- Retry options where appropriate
- Fallback UI when data cannot be loaded

### Responsive Behavior

The UI adapts to different screen sizes:
- Single-column layout on mobile devices
- Two-column layout on tablets
- Extended information displays on desktop

## UI Component Examples

### User Profile Badge (Minimal)

```jsx
<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
  <Chip
    avatar={<Avatar src={userPhotoURL} />}
    label={firstName}
    size="small"
    variant="outlined"
    color="primary"
  />
  
  <Chip
    icon={<HistoryIcon fontSize="small" />}
    label={`${completedJobs} jobs`}
    size="small"
    variant="outlined"
  />
  
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Rating value={averageRating} precision={0.5} size="small" readOnly />
    <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
      ({reviewCount})
    </Typography>
  </Box>
  
  <IconButton size="small" color="primary">
    <InfoIcon fontSize="small" />
  </IconButton>
</Box>
```

### Activity Item

```jsx
<ListItem alignItems="flex-start" divider>
  <ListItemAvatar>
    <Avatar sx={{ bgcolor: 'background.paper' }}>
      <ActivityTypeIcon />
    </Avatar>
  </ListItemAvatar>
  <ListItemText
    primary={<Typography variant="subtitle2">{activity.title}</Typography>}
    secondary={
      <>
        <Typography variant="body2" color="text.primary">
          {activity.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formattedDate}
        </Typography>
      </>
    }
  />
</ListItem>
```

## Best Practices

1. **Consistency** - Use the established patterns consistently throughout the application
2. **Progressive Disclosure** - Show essential information first, with details available on demand
3. **Feedback** - Provide clear feedback for all user actions
4. **Performance** - Optimize for fast loading and rendering
5. **Accessibility** - Ensure all components are accessible with proper ARIA attributes and keyboard navigation

## Implementation Guidelines

When implementing new UI components:

1. Use Material UI components as the foundation
2. Follow the established color palette and typography
3. Maintain consistent spacing and layout patterns
4. Ensure responsive behavior across devices
5. Add proper loading and error states
6. Implement accessibility features
