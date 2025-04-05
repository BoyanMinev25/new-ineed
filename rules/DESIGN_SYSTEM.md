# Design System Documentation

This document outlines the design system for the Service Marketplace application. All UI and visual development must adhere to these guidelines to maintain consistency across the application.

## Design Philosophy

The Service Marketplace follows a minimalist, clean, and modern design philosophy that emphasizes:

- **Whitespace**: Generous spacing to create an uncluttered appearance
- **Clear visual hierarchy**: Organized information to guide users' attention
- **Emotional engagement**: Subtle animations to create moments of delight
- **Trust-building**: Visual elements that reinforce security and reliability

## Color Palette

### Primary Colors

- **Primary Blue**: `hsl(195, 100%, 40%)`
  - Used for primary actions, key UI elements, and branding
  - Signals trustworthiness and professionalism

### Secondary Colors

- **Light Gray**: `hsl(210, 40%, 96.1%)`
  - Used for backgrounds, cards, and secondary UI elements
  - Creates a clean, modern feel

### Accent Colors

- **Warm Coral**: `hsl(16, 100%, 68%)`
  - Used for highlights, calls-to-action, and important elements
  - Evokes friendliness and energy

### Semantic Colors

- **Success**: `hsl(142, 72%, 29%)`
- **Warning**: `hsl(35, 100%, 50%)`
- **Error**: `hsl(0, 84%, 60%)`
- **Info**: `hsl(210, 100%, 52%)`

## Typography

### Font Family

- **Primary Font**: 'Poppins', sans-serif
  - Used for all text in the application
  - Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Font Sizes

- **Headings**:
  - H1: 2.5rem, Weight: 600
  - H2: 2rem, Weight: 600
  - H3: 1.5rem, Weight: 500
  - H4: 1.25rem, Weight: 500
- **Body**:
  - Body: 1rem, Weight: 400
  - Small: 0.875rem, Weight: 400
  - XSmall: 0.75rem, Weight: 400

## Spacing

Consistent spacing is used throughout the application to create a balanced and harmonious layout.

- **Base unit**: 4px
- **Common spacing values**:
  - xs: 4px (0.25rem)
  - sm: 8px (0.5rem)
  - md: 16px (1rem)
  - lg: 24px (1.5rem)
  - xl: 32px (2rem)
  - 2xl: 48px (3rem)

## UI Components

### Cards

All cards in the application follow these design guidelines:

- **Border radius**: 16px (1rem)
- **Shadow**: `0 4px 20px rgba(0, 0, 0, 0.1)`
- **Hover shadow**: `0 10px 25px rgba(0, 0, 0, 0.15)`
- **Animation**: Scale up to 1.05 on hover
- **Padding**: 16px (1rem)

### Buttons

- **Border radius**: 8px (0.5rem)
- **Height**: 40px (2.5rem) for default size
- **Padding**: 16px (1rem) horizontal
- **Animation**: Slight scale effect on hover and tap
- **Variants**:
  - Primary: Primary color background
  - Secondary: Light gray background
  - Outline: Transparent with border
  - Ghost: No background until hover
  - Accent: Accent color background

### Icons

- **Library**: lucide-react
- **Sizes**:
  - Small: 16px
  - Medium: 20px
  - Large: 24px
- **Colors**: Match text color or use primary/accent for emphasis

## Animations and Transitions

Animations are a key part of the user experience, creating moments of delight and reinforcing interactions.

### Page Transitions

- **Enter animation**: Fade in and slide up
- **Exit animation**: Fade out and slide up
- **Duration**: 300ms
- **Easing**: Spring (for natural feel)

### Component Animations

- **Card hover**: Scale to 1.05 with shadow deepening
- **Button hover**: Slight scale up (1.05)
- **Button press**: Scale down slightly (0.95)
- **Form elements**: Subtle highlight on focus
- **Rating stars**: Soft bounce when animated
- **Trust badges**: Subtle pulse effect

### Animation Principles

1. **Subtle**: Animations should never distract from content
2. **Purposeful**: Each animation should communicate meaning
3. **Consistent**: Similar elements should animate similarly
4. **Performance**: Animations should remain smooth across devices

## Responsive Design

The application is designed with a mobile-first approach:

- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

- **Layout adjustments**:
  - Stack elements vertically on mobile
  - Use grid layouts on larger screens
  - Adjust font sizes and spacing proportionally
  - Hide less important elements on smaller screens

## Accessibility

The design system prioritizes accessibility:

- **Color contrast**: All text meets WCAG AA standards
- **Focus states**: Clearly visible focus outlines
- **Text sizes**: Minimum 16px for body text
- **Touch targets**: Minimum 44px × 44px for interactive elements
- **Animations**: Respect user preferences for reduced motion

## Implementation Notes

The design system is implemented using:

- **Tailwind CSS**: For consistent styling
- **Framer Motion**: For animations and transitions
- **shadcn/ui**: For base component styles
- **CSS Variables**: For theme values (in `:root`)

All components should utilize the utility functions:
- `cn()`: For merging Tailwind classes
- Animation variants from `motion.js` utilities 