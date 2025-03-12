# Change Log

All notable changes to the Service Marketplace project will be documented in this file.

## [Unreleased]

### Added
- Real-Time Notifications & Messaging System
  - Firebase Cloud Messaging integration for push notifications
  - Comprehensive notification service with Firestore storage
  - NotificationContext for global state management
  - NotificationCenter component with real-time updates
  - Notification permission handling and token management
  - Notification filtering by read/unread status
  - Dedicated NotificationsPage with tabs for organizing notifications
  - In-app messaging system with real-time updates
  - Conversation management with unread message tracking
  - MessagingContext for centralized messaging state
  - Integration with user profiles and bidding system
  - Complete Firebase Firestore integration for persistence
  - Real-time message delivery and read receipts
  - Unread message count tracking across the application
- Review System with full Firebase integration
  - Added `ReviewForm` component for creating and editing reviews
  - Created `ReviewItem` component for displaying reviews with ratings, comments, and photos
  - Implemented provider rating visualization with star ratings and progress bars
  - Added review filtering by rating and sorting options (newest, highest rating, most helpful)
  - Created `ReviewContext` for centralized state management
  - Built comprehensive review service with Firestore integration
  - Implemented photo attachment functionality with storage integration
  - Added "helpful" voting system for reviews
  - Created dedicated provider reviews page with detailed stats
  - Connected review system with the social feed
- Initial project structure setup
- React frontend with directory structure
- Node.js backend with Express server
- Firebase configuration for authentication, database, and storage
- Design system documentation with UI guidelines
- OpenAI service integration for AI Question Handler System
- API routes for authentication
- API routes for AI-powered question generation and category determination
- Project README with setup instructions and overall architecture
- Environment configuration files for secure API key storage
- Basic React application setup with Material UI theming
- Centralized theme configuration based on design system
- Bottom navigation component with "I NEED" button
- Basic routing structure for main application pages
- Frontend-backend integration for seamless user experience
  - Express server configured to serve React frontend static files
  - React application build process setup
  - API endpoints properly mapped for client-side access
- Core UI Components Implementation
  - Material UI integration with custom theme
  - Responsive layout with mobile-first approach
  - Central "I NEED" button in bottom navigation
  - User profile page with activity feed, offers, and reviews tabs
  - Ad creation multi-step workflow
  - Component-based architecture for reusability
- Map Interface implementation using Leaflet.js
  - Dynamic map display as the primary UI
  - Geolocation services to display user position
  - Custom map markers for different service categories
  - Marker clustering for improved map readability
  - Interactive popups with service details
  - "Locate Me" functionality
- Ad Posting Module with step-based workflow
  - Multi-step form interface with Material UI Stepper
  - Basic information collection (title, description, price range)
  - Photo upload with drag-and-drop functionality and previews
  - Location selection using interactive map
  - Review screen with edit capabilities
  - Integration with Firebase for storing ad data and images
  - Comprehensive submission flow with success notifications
- AI Question Handler System integration
  - Dynamic question generation based on ad content
  - Follow-up questions based on previous answers
  - Automatic category determination
  - AI-generated ad summary for better clarity
  - Support for various question types (text, number, choice, etc.)
  - Seamless integration with the ad creation workflow
- Bidding System Module implementation
  - Created OfferForm component for submitting bids with validation
  - Implemented OfferList component to display existing offers
  - Added AdDetailPage component to view ad details and place offers
  - Integrated with map markers for easy access to bidding
  - Created bidding service with localStorage persistence
  - Implemented BiddingContext for state management
  - Added "Place Offer" functionality to the map interface
- Social Feed Module implementation
  - Activity feed service with Firestore integration
  - Feed context for state management and filtering
  - Dynamic feed items for different activity types
  - Support for various activity types (new ads, offers, completed jobs, reviews)
  - Interactive feed items with links to related resources
  - Filtering system to sort activities by type
  - Responsive feed UI with Material UI components
  - User-centric feed views based on relationships
- User Management & Profiles Module implementation
  - User authentication service with Firebase Authentication
  - User registration with email/password and social sign-in options
  - Login system with form validation and error handling
  - Profile page with detailed user information display
  - Profile editing capabilities with image upload
  - Role-based UI with differentiation between service providers and seekers
  - Provider skills and certifications management
  - Portfolio showcase for service providers
  - User reputation system based on reviews and completed jobs
  - Integration with the Review System for displaying ratings
  - Secure routes and conditional rendering based on authentication status
- Authentication Integration
  - Created AuthContext for centralized authentication state management
  - Implemented ProtectedRoute component to guard routes requiring authentication
  - Added LoadingScreen component for authentication loading states
  - Created WelcomePage as an entry point for new users
  - Updated App.js to protect routes and include AuthProvider
  - Enhanced LoginPage with redirection to originally requested routes
  - Added RegisterPage with user type selection
  - Updated index.js to check for first-time visitors and redirect to welcome page
  - Integrated Firebase Authentication throughout the application
- Enhanced real-time messaging features:
  - User typing indicators that show when someone is currently typing
  - File attachments support for messages with upload progress and previews
  - Image attachments with preview and fullscreen view capabilities
  - Message reactions with emoji support (👍, ❤️, 😂, 😮, 😢, 🎉)
  - File storage service for managing file uploads and downloads
  
- AI-Powered Features with Vercel AI SDK Integration:
  - Integrated Vercel AI SDK for enhanced AI capabilities
  - Created AIContext for centralized AI feature management
  - Implemented AI-powered question assistance for service requests
  - Added smart service categorization with primary and secondary categories
  - Built AI-powered price estimation with detailed cost breakdowns
  - Developed AI chatbot for user support with real-time conversation
  - Created AI-generated service provider recommendations
  - Designed reusable AI components for seamless integration
  - Implemented server-side API routes compatible with Vercel AI SDK
  - Added comprehensive error handling and fallback responses
  - Integrated AI chatbot into main application layout
- UI and UX improvements for Map Application
  - Enhanced geolocation functionality to handle permission denials properly
  - Implemented browser-specific instructions for enabling location services
  - Redesigned zoom controls with improved styling matching locate button
  - Adjusted map container to use full viewport height
  - Repositioned "add" button within the bottom navigation with floating appearance
  - Repositioned AI chat button to avoid overlap with other elements
  - Consistent styling across UI controls for better visual coherence
  - Fine-tuned zoom controls positioning to align with Locate Me button
  - Improved "I NEED" button placement showing 1/3 above the bottom navigation
  - Adjusted map attribution to be hidden beneath the bottom navigation
  - Refined AI chatbot position to the bottom right corner
  - Replaced browser alerts with user-friendly permission dialog with actionable buttons
  - Enhanced visibility of AI chat button by correcting z-index and positioning
  - Properly aligned "I NEED" button with bottom navigation controls
  - Fixed AI chatbot position to remain in bottom right corner during browser resizing
  - Created comprehensive device-specific location permission guidance with direct settings links
  - Added tabbed interface for location permissions with separate request and settings sections
  - Resolved positioning conflicts between component and container styles
  - Ensured consistent styling approach across components
  - Fixed button alignment issues for visual consistency across the interface
  - Improved "I NEED" button overlap with bottom navigation for modern floating appearance
- Integration improvements for Map, Feed, and Bidding systems
  - Updated MapInterface to load real ads from Firestore instead of sample data
  - Improved ad marker display with category-specific icons
  - Added proper error handling and loading states for map data
  - Connected AdDetailPage with real Firestore data for both ads and offers
  - Integrated bidding system with feed activities for real-time updates
  - Added success notifications for offer submissions
  - Improved navigation flow between map markers and ad details
  - Enhanced error handling and empty state displays
- AI-powered bidding features integration
  - Integrated AIPriceEstimation component into the bidding workflow
  - Added intelligent price suggestions based on service descriptions
  - Implemented automatic price extraction and form population
  - Created collapsible AI suggestion panel in the offer form
  - Added standalone price estimation in ad details view

### Fixed
- Resolved feed component import error by fixing case sensitivity in import paths
- Fixed ESLint warnings related to unused imports in multiple components
- Implemented missing feed components
- Resolved authentication-related issues with context references
- Fixed redirection after login to maintain user's intended navigation
- Fixed geolocation error handling to provide better user feedback when permissions are denied
- Corrected zoom button positioning to avoid overlap with navigation elements
- Resolved chat button visibility issue by repositioning it to avoid being hidden
- Identified integration gap between newer AI SDK components and the ad creation process
  - Discovered that newer AI components (AIQuestionSuggestions, AICategoryPrediction, AIPriceEstimation) 
    in service-marketplace/client/src/components/ai/ are not fully integrated with the AdAIQuestions step
  - Found that AIContext is using standard API approach instead of Vercel AI SDK as noted in the component

### Changed
- Updated FeedScreen component to improve loading and refresh experience
- Enhanced the ReviewContext to properly integrate with the FeedContext for activity feeds
- Improved user experience with authentication flow
- Enhanced security by protecting routes that require authentication
- Updated navigation to handle authenticated and unauthenticated states
- Improved message input UI with attachment buttons
- Enhanced message bubble design to display attachments and reactions
- Updated MessagingContext to support new features 
- Refactored AI integration to use Vercel AI SDK for improved performance and capabilities
- Simplified the ad creation process in the AdAIQuestions component:
  - Converted "Add Your Own Question" to a simple "Additional details" field
  - Improved UX by removing the separate question adding flow
  - Enhanced the input field with multiline support for more detailed information
  - Streamlined the user experience by removing unnecessary UI elements
  - Combined Smart Recommendations with Additional details for a more compact and user-friendly interface
  - Added pro tips directly in the Additional details section to guide users

### Project Checklist Status

#### Project Overview & Architecture
- [x] Define System Architecture
- [x] Create a high-level diagram showing all modules and their interactions
- [x] Outline communication channels and data flows between components

#### Core Modules & Components
- [x] Map Interface Module
  - [x] Design and implement a dynamic map display as the primary UI
  - [x] Integrate geolocation services to display user position
  - [x] Add interactive ad markers (with clustering as needed)
  - [ ] Correlation: Connect with the Ad Posting module to display newly created ads and with the Bidding module to update offers in real time
- [x] Ad Posting Module ("I NEED" Button)
  - [x] Basic UI component for the "I NEED" button in bottom navigation
  - [x] Develop the ad creation screen for photo uploads and service details
  - [x] Enable a review screen for users to verify ad details before posting
  - [x] Correlation: Integrate tightly with the AI Question Handler System to enrich ad details
- [x] AI Question Handler System
  - [x] Backend service for generating follow-up questions
  - [x] API endpoints for question generation and category determination
  - [x] Frontend integration with ad creation flow
  - [x] Example Scenario implementation for various service types
  - [x] Automatic category determination from ad content
- [x] Bidding System Module
  - [x] User interface for service providers to view and submit offers
  - [x] Real-time bidding updates and status management
  - [x] Detailed offer submissions with price, timeline, and service details
  - [x] Integration with user profiles and navigation system
- [x] Social Feed Module
  - [x] Dynamic feed displaying new ads, offers, completed jobs, and reviews
  - [x] Connectivity features showing user interactions and relationships
  - [x] Integration with Ad Posting, Bidding, and Review modules
- [x] Review & Rating System
  - [x] User interface for rating and reviewing service providers
  - [x] Photo and comment attachments for detailed reviews
  - [x] Feedback system for informing future provider selection
  - [x] Integration with user profiles and the Social Feed module
- [x] User Management & Profiles
  - [x] Secure user registration, authentication, and profile management
  - [x] Role differentiation between service seekers and providers
  - [x] User reputation management based on reviews and completed jobs
  - [x] Cross-module integration for user data and interactions

#### Backend & Data Infrastructure
- [x] Data Models & Database Schema (Initial setup)
  - [x] Implementation of ad service for creating and updating ads
  - [x] Firebase Storage integration for ad images
  - [x] Bidding service with offer management functionality
  - [x] Feed service for activity tracking and display
  - [x] Review service with rating and feedback capabilities
  - [x] User service with authentication and profile management
- [ ] Real-Time Notifications & Messaging

#### Security, Privacy, & Moderation
- [x] Security & User Verification (Initial setup)
- [ ] Content Moderation & Privacy Compliance

#### Testing, Deployment & Documentation
- [x] Documentation & Collaboration
  - [x] Project README
  - [x] Design System Documentation
  - [x] Change Log
- [ ] Testing & Quality Assurance
- [ ] Deployment & Scaling Strategy

## Next Steps
- Implement real-time notifications and messaging between users
- Connect the Ad Posting module with the Map Interface for real-time updates
- Add content moderation tools for user-generated content
- Implement comprehensive testing (unit, integration, and UI tests)
- Set up CI/CD pipeline for automated deployment

## Recently Completed

### Added
- AI SDK Integration with Ad Creation Process
  - Integrated the newer AI components (AIQuestionSuggestions, AICategoryPrediction, AIPriceEstimation) with the ad creation workflow
  - Updated the AIContext to properly support the Vercel AI SDK approach
  - Created a more user-friendly question interface with clickable AI-suggested questions
  - Added AI-powered price estimation to automatically suggest price ranges
  - Enhanced the categorization feature with primary and secondary category suggestions
  - Improved the overall UX of the "Specific Details" step in ad creation with modern UI components
  - Fixed integration issues between the AI SDK and the ad creation process

### Changed
- Refactored AdAIQuestions component to utilize the more powerful AI components
- Updated the App component to include the AIProvider
- Migrated AI functionality from service-specific implementations to a unified approach
- Improved the ad creation experience with more intuitive AI-powered assistance
- Modernized the interface for adding custom questions during ad creation
- Updated server configuration to serve the correct files with the new AI components

### Removed
- Obsolete question rendering logic in the AdAIQuestions component
- Hard-coded question types in favor of a more dynamic approach
- Unnecessary API calls by leveraging the AIContext more efficiently
- Duplicate code and files to maintain a cleaner codebase
- Outdated `/src/` directory to eliminate codebase duplication and confusion

## Planned Features (From Documentation)

### - Real-time Features & Content Moderation

#### Planned Additions
- Real-time notifications system using Firebase Cloud Messaging
- In-app messaging for direct communication between users
- Content moderation tools for user-generated content
  - OpenAI-based text moderation
  - Image moderation infrastructure
  - Flagged content review system for administrators
- Privacy compliance features in line with GDPR and CCPA
  - Content removal functionality
  - User data protection mechanisms
- Admin middleware for protected routes
- Notification context for client-side notification management

## [Unreleased]

### Added
- Enhanced real-time messaging features:
  - User typing indicators that show when someone is currently typing
  - File attachments support for messages with upload progress and previews
  - Image attachments with preview and fullscreen view capabilities
  - Message reactions with emoji support (👍, ❤️, 😂, 😮, 😢, 🎉)
  - File storage service for managing file uploads and downloads
  
- AI-Powered Features with Vercel AI SDK Integration:
  - Integrated Vercel AI SDK for enhanced AI capabilities
  - Created AIContext for centralized AI feature management
  - Implemented AI-powered question assistance for service requests
  - Added smart service categorization with primary and secondary categories
  - Built AI-powered price estimation with detailed cost breakdowns
  - Developed AI chatbot for user support with real-time conversation
  - Created AI-generated service provider recommendations
  - Designed reusable AI components for seamless integration
  - Implemented server-side API routes compatible with Vercel AI SDK
  - Added comprehensive error handling and fallback responses
  - Integrated AI chatbot into main application layout
  
### Changed
- Improved message input UI with attachment buttons
- Enhanced message bubble design to display attachments and reactions
- Updated MessagingContext to support new features 
- Refactored AI integration to use Vercel AI SDK for improved performance and capabilities 