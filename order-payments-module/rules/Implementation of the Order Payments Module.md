# Implementation of the Order Payments Module

## Current Integration Status

1. **Basic Integration**:
   - The module is referenced in the client's package.json as a local dependency
   - The OrdersRouter component is imported and used in the main App.js
   - An OrdersContext is implemented in the application for managing order data
   - The core components (OrderDetailCard, OrderTimeline) are defined and working

2. **What's Working**:
   - Basic order listing UI with mock data when the server is offline
   - Error handling for when the API is unavailable
   - Server health checks to detect connectivity issues
   - Core navigation between order list and order details
   - Cross-environment API connection (development and production)
   - Fallback to mock data when API is unavailable
   - Fixed issues with HTML responses by using correct API paths and explicit JSON Content-Type headers
   - API endpoints now use real Firebase data with proper fallback to mock data
   - Stripe payment processing integration with payment intents and webhooks
   - Order creation from service ads is implemented
   - Order status updates are now functional
   - Offer acceptance/rejection with conversion to orders
   - Integration between offers, orders, and messaging
   - Complete checkout flow UI with Stripe Elements integration
   - Payment status confirmation pages
   - Comprehensive OrdersContext with payment processing functions
   - Seller order delivery system with file uploads
   - Buyer order review and approval workflow
   - Revision request and management system
   - Order messaging system between buyers and sellers
   - OrdersContext integration with comprehensive order management features

3. **What's Missing**:
   - Review submission for completed orders
   - Order fulfillment features
   - File upload functionality for deliverables
   - Admin features for order management

## Integration Plan

### Phase 1: Data Integration (First Priority)

1. **Fix HTML response handling for all environments**:
   - Update callApi to handle both development and production environments
   - Update OrdersContext to detect and adapt to different deployment modes
   - Enable fallback to direct Firebase access when API is unavailable
   - Implement multi-URL attempt strategy to find working API endpoint
   - **Status**: Completed (Enhanced with XMLHttpRequest)
   - **Completed On**: Current date
   - **Notes**: 
     - Initial fix implemented a multi-URL attempt strategy to find a working API endpoint
     - Enhanced fix added improved detection of the environment (built app vs dev server)
     - Final solution replaced fetch with XMLHttpRequest for better control over the request/response handling
     - Added direct fallback to localhost:5002 when HTML is received
     - Implemented a mock data generator for graceful degradation when API is unavailable
     - Added custom header to identify direct API calls
     - Fixed API path inconsistencies by ensuring all endpoints use the /api prefix
     - Resolved issues with multiple server files (main index.js vs service-marketplace/server/index.js)

2. **Connect Firebase Data to Orders API**:
   - Create/modify backend routes to query Firebase for real order data
   - Implement proper filtering by userId for buyer/seller roles
   - Ensure proper data transformation between Firebase and API
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**: 
     - Updated orderRoutes.js to use Firebase Firestore instead of mock data
     - Implemented filtering by userId for both buyer and seller roles
     - Added error handling with fallback to mock data for graceful degradation
     - Separated orders by role (buyer/seller) in the API response
     - Added proper authentication checks for individual order access

3. **Synchronize OrdersContext with the API**:
   - Modify OrdersContext to fetch data from the API instead of directly from Firebase
   - Add support for order creation, updates, and status changes
   - Implement proper caching to reduce API calls
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**: 
     - OrdersContext now has methods for creating orders from service ads
     - Added functions for updating order status
     - Implemented fetchOrderById for retrieving individual orders
     - Maintained fallback mechanism for API unavailability
     - Added proper error handling and loading states

4. **Add Stripe Integration for Payments**:
   - Create payment intent API endpoints
   - Implement Stripe webhook handling for payment events
   - Connect payment status to order status
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**:
     - Added createPaymentIntent endpoint in orderRoutes.js
     - Implemented webhook handler for Stripe events
     - Created helper functions for handling payment success and failure
     - Updated OrdersContext with payment processing functions
     - Connected payment status to order status in Firebase

### Phase 2: Checkout Flow Integration

1. **Implement Checkout Component**:
   - Create CheckoutPage component with Stripe Elements
   - Add form validation and error handling
   - Implement payment method saving for returning customers
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**: 
     - Created a comprehensive CheckoutPage component
     - Implemented multi-step checkout flow (details, payment, processing)
     - Added form validation for required fields
     - Integrated Stripe Elements for secure payment processing
     - Implemented error handling and loading states
     - Added responsive design for both mobile and desktop

2. **Connect Ad Detail to Checkout**:
   - Add "Buy Now" or "Hire" buttons on service ads
   - Create the flow from ad to checkout
   - Implement order creation from ad data
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**: 
     - API endpoint for creating orders from ads has been implemented
     - OrdersContext has been updated with createOrderFromAd function
     - Added createOrderFromOffer function in OrdersContext
     - Implemented offer acceptance flow with conversion to orders
     - Added user interface for accepting/rejecting offers in the OfferList component
     - Integrated with notification system for offer acceptance/rejection

3. **Payment Status and Confirmation**:
   - Create payment confirmation page
   - Implement success/failure status handling
   - Add email notifications for payment events
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**: 
     - Created PaymentStatusPage component with three states (success, cancel, processing)
     - Implemented dynamic content based on payment status
     - Added order detail display for confirmed orders
     - Created navigation paths for payment outcomes
     - Integrated with OrdersContext for payment confirmation
     - Connected with the webhook system for status updates

### Phase 3: Order Management Features

1. **Seller Order Fulfillment**:
   - Added delivery/fulfillment features for sellers
   - Implemented file uploads for deliverables
   - Created messaging system for buyer-seller communication
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**:
     - Implemented OrderDeliveryPanel component for delivery management
     - Added file upload functionality with DeliveryFileUploader
     - Created delivery approval/rejection workflow
     - Implemented revision request system with history tracking
     - Integrated with OrdersContext for state management

2. **Buyer Order Management**:
   - Added ability to accept/reject deliveries
   - Implemented revision request workflow
   - Created review submission after completion
   - **Status**: Completed
   - **Completed On**: Current date
   - **Notes**:
     - Added delivery approval/rejection UI in OrderDeliveryPanel
     - Implemented revision request dialog with reason input
     - Connected review submission to order completion
     - Enhanced OrdersContext with order approval methods
     - Created OrderMessagePanel for buyer-seller communication

3. **Admin Features**:
   - Create order management dashboard for admins
   - Implement order metrics and reporting
   - Add moderation tools for disputes
   - **Status**: Not Started
   - **Completed On**: 
   - **Notes**:

### Phase 4: Testing and Optimization

1. **End-to-End Testing**:
   - Create test cases for complete order flow
   - Test payment processing in test mode
   - Verify all status transitions and edge cases
   - **Status**: Not Started
   - **Completed On**: 
   - **Notes**:

2. **Performance Optimization**:
   - Implement proper loading states and progressive loading
   - Add caching for frequently accessed data
   - Optimize API calls and reduce unnecessary renders
   - **Status**: Not Started
   - **Completed On**: 
   - **Notes**:

3. **UI/UX Improvements**:
   - Add animations for status changes
   - Improve mobile responsiveness
   - Implement real-time updates for order status
   - **Status**: Not Started
   - **Completed On**: 
   - **Notes**:

## Detailed Implementation Steps

### 1. Connect Firebase Data to Orders API (COMPLETED)

#### Implementation Details
- Updated the orderRoutes.js file to fetch real data from Firebase instead of using mock data
- Added proper authentication checks to ensure users can only access their own orders
- Implemented query parameters for filtering by status, date range, etc.
- Created proper error handling for Firebase query failures with fallback to mock data
- Added role identification (buyer/seller) for users viewing orders

#### Acceptance Criteria
- API returns real order data from Firebase
- Orders are filtered by user ID (as buyer or seller)
- Error handling is robust with fallback to mock data
- API includes proper authentication checks

#### Current Status
The Orders API now returns real data from Firebase when available, with a graceful fallback to mock data when needed. The system properly handles different roles (buyer/seller) and provides appropriate error handling.

### 2. Synchronize OrdersContext with the API (COMPLETED)

#### Implementation Details
- Updated OrdersContext to use the API endpoints with the correct paths (/api/orders)
- Added functions for order creation from service ads
- Implemented functions for updating order status
- Added proper error handling and loading states
- Maintained fallback mechanisms for when API is unavailable

#### Acceptance Criteria
- OrdersContext uses the API for all data operations
- UI updates immediately with optimistic updates
- Error states are properly handled with user feedback
- Functions exist for all necessary order operations

#### Current Status
The OrdersContext now properly uses the API endpoints and provides comprehensive functions for working with orders, including creating orders from ads, updating status, and fetching order details. It maintains robust error handling and fallback mechanisms.

### 3. Add Stripe Integration for Payments (COMPLETED)

#### Implementation Details
- Created payment intent endpoints in the backend
- Implemented webhook handling for Stripe payment events
- Connected payment status to order status in Firebase
- Added notifications for payment success/failure
- Integrated payment processing functions in OrdersContext

#### Acceptance Criteria
- Users can create payment intents for orders
- Payment events update order status automatically
- Failed payments are properly handled with user feedback
- Payment history is tracked in the order data

#### Current Status
The Stripe integration is now complete on the backend with proper payment intent creation, webhook handling, and status updates. The OrdersContext provides functions for creating payment intents and processing payments.

### 4. Connect Offers to Orders (COMPLETED)

#### Implementation Details
- Created API endpoint for converting offers to orders
- Implemented createOrderFromOffer function in OrdersContext
- Added acceptOffer and rejectOffer functions to BiddingContext
- Updated OfferList component with UI for accepting/rejecting offers
- Integrated with notification system for offer events
- Added error handling and fallbacks for messaging context availability

#### Acceptance Criteria
- Users can accept or reject offers through the UI
- Accepted offers automatically create orders
- Rejected offers are properly marked and notifications sent
- The flow from offers to orders is seamless

#### Current Status
The integration between offers and orders is now complete. Ad owners can accept or reject offers from the OfferList component, with accepted offers automatically creating orders and rejected offers being properly marked. The system includes proper error handling and notifications.

### 5. Implement Checkout Flow (COMPLETED)

#### Implementation Details
- Created CheckoutPage component with multi-step checkout flow
- Implemented form validation for customer details
- Integrated Stripe Elements for payment processing
- Added loading states and error handling
- Connected with OrdersContext for order creation
- Implemented responsive design for mobile and desktop

#### Acceptance Criteria
- Users can enter delivery instructions and contact details
- Payment processing is secure and seamless
- Error states are properly handled with user feedback
- Successful payments create orders and redirect to confirmation

#### Current Status
The checkout flow is now complete with a comprehensive UI that guides users through the order process. The system collects necessary order details, processes payments securely with Stripe, and handles both success and failure cases appropriately.

### 6. Implement Payment Status Pages (COMPLETED)

#### Implementation Details
- Created PaymentStatusPage component that handles three states (success, cancel, processing)
- Added dynamic content based on payment status
- Implemented order detail display for confirmed payments
- Created clear navigation paths for different outcomes
- Connected with OrdersRouter for proper routing

#### Acceptance Criteria
- Users receive clear confirmation of payment status
- Order details are displayed for successful payments
- Clear navigation options are provided for next steps
- Error states are properly handled with user feedback

#### Current Status
The payment status pages are now complete, providing users with clear feedback about their payment status. The system displays relevant order information for successful payments and provides appropriate navigation options for different outcomes.

### 7. Implement OrdersContext Enhancement

#### Implementation Details
- Implemented comprehensive OrdersContext with payment integration
- Added functions for payment processing and confirmation
- Created proper error handling for payment operations
- Implemented navigation integration with payment status pages
- Added fallback mechanisms for API unavailability

#### Acceptance Criteria
- OrdersContext provides comprehensive payment integration
- Error handling is robust for payment operations
- Navigation is seamless with payment status pages
- Fallback mechanisms are in place for API unavailability

#### Current Status
The OrdersContext now provides comprehensive payment integration, error handling, and navigation with payment status pages. It maintains robust fallback mechanisms for API unavailability.

### Order Communication System (Completed)

- **Completed On**: Current date
- **Changes Made**:
  - Developed real-time messaging between buyers and sellers
  - Added OrderMessagePanel component with file attachment support
  - Implemented unread message indicators and notifications
  - Created message history with timestamps and sender information
  - Integrated with OrdersContext for centralized management
  - Connected OrderMessagePanel to OfferList component for pre-order communication
  - Implemented in-context messaging from offer details before order creation
  - Added support for transitioning from offer discussion to order communication

## Next Steps

1. ~~Implement file upload functionality for order deliverables~~ (Completed)
2. ~~Create order fulfillment workflow for sellers~~ (Completed)
3. ~~Implement buyer acceptance flow for deliveries~~ (Completed)
4. ~~Add review submission functionality for completed orders~~ (Completed)
5. Build admin dashboards for order management
6. Enhance pre-order communication by integrating real messaging API
7. Implement message persistence between pre-order conversations and order communications

## Recent Updates

### Typing Indicator Removal

- **Completed On**: Current date
- **Changes Made**:
  - Completely removed the typing indicator functionality to simplify the messaging system
  - Removed from MessagingContext:
    - `typingUsers` state and setter
    - `typingTimeoutRef` and `isTypingRef` refs
    - `updateTypingStatus` function
    - Typing status subscriptions and cleanup in useEffect hooks
  - Removed from messagingService.js:
    - `setTypingStatus` function that updated Firestore with typing status
    - `getTypingStatus` function that subscribed to typing status changes
  - Updated UI components:
    - Removed typing status update from input field onChange handlers
    - Removed any UI elements that displayed typing indicators
    - Updated the MessageContext value object to remove typing-related properties and methods
  - Benefits:
    - Reduced number of Firestore writes (no constant typing status updates)
    - Fewer real-time subscriptions leading to better performance
    - Simplified codebase with fewer potential points of failure
    - More straightforward messaging experience for users

### Messaging System Enhancements and Fixes

- **Completed On**: Current date
- **Changes Made**:
  - Fixed timestamp handling issues in messaging components to support multiple Firestore timestamp formats
  - Added comprehensive debug information to troubleshoot user identification in conversations
  - Enhanced error handling for message sending and conversation creation
  - Fixed infinite loop issue in conversation dialog opening logic
  - Improved user identification in chat interface with better sender display
  - Added fallback mechanisms for failed conversation fetching
  - Fixed "Start Chat" button to reliably open conversations with proper user identification
  - Implemented robust timestamp formatting to prevent "getTime is not a function" errors
  - Added conversationOpenedRef to prevent redundant conversation opening attempts
  - Enhanced the ProfilePage component to properly handle conversation state from navigation

### Firebase Data Connection Fix

- **Completed On**: Current date
- **Changes Made**:
  - Updated orderRoutes.js to use Firebase Firestore instead of mock data
  - Added proper filtering by userId for both buyer and seller roles
  - Implemented fallback to mock data for API resilience

### Stripe Payment Processing Integration

- **Completed On**: Current date
- **Changes Made**:
  - Added payment intent creation endpoint
  - Implemented Stripe webhook handler
  - Connected payment status to order status updates
  - Created notification system for payment events

### Offer to Order Integration

- **Completed On**: Current date
- **Changes Made**:
  - Created API endpoint for converting offers to orders
  - Added createOrderFromOffer function to OrdersContext
  - Implemented UI for accepting/rejecting offers
  - Connected offers to orders flow with notifications
  - Added error handling for messaging context availability 

### OfferList Component Fix

- **Completed On**: Current date
- **Changes Made**:
  - Fixed UI issues with the pending offer menu icon
  - Improved handling of ownership checks in AdDetailPage
  - Updated the menu display for pending offers
  - Ensured proper authentication state management between components
  - Fixed issues with user identification and ad ownership verification

### Checkout Flow Implementation

- **Completed On**: Current date
- **Changes Made**:
  - Created CheckoutPage component with a multi-step flow
  - Implemented form validation for customer details
  - Integrated Stripe Elements for secure payment processing
  - Added responsive design for mobile and desktop
  - Connected with OrdersContext for order creation
  - Implemented loading states and error handling

### Payment Status Pages Implementation

- **Completed On**: Current date
- **Changes Made**:
  - Created PaymentStatusPage component for all payment states
  - Implemented success, cancel, and processing states
  - Added order detail display for confirmed payments
  - Created clear navigation paths for different outcomes
  - Connected with OrdersRouter for proper routing

### OrdersContext Enhancement

- **Completed On**: Current date
- **Changes Made**: 
  - Implemented comprehensive OrdersContext with payment integration
  - Added functions for payment processing and confirmation
  - Created proper error handling for payment operations
  - Implemented navigation integration with payment status pages
  - Added fallback mechanisms for API unavailability

### Order Fulfillment Features (Completed)

- **Completed On**: Current date
- **Changes Made**:
  - Implemented comprehensive file upload system for order deliveries
  - Created OrderDeliveryPanel component for delivery management
  - Added revision request workflow for order refinement
  - Integrated with existing DeliveryFileUploader component
  - Enhanced OrdersContext with delivery and revision methods

### Order Communication System (Completed)

- **Completed On**: Current date
- **Changes Made**:
  - Developed real-time messaging between buyers and sellers
  - Added OrderMessagePanel component with file attachment support
  - Implemented unread message indicators and notifications
  - Created message history with timestamps and sender information
  - Integrated with OrdersContext for centralized management
  - Connected OrderMessagePanel to OfferList component for pre-order communication
  - Implemented in-context messaging from offer details before order creation
  - Added support for transitioning from offer discussion to order communication

### Order Timeline Enhancement (Completed)

- **Completed On**: Current date
- **Changes Made**:
  - Improved order progress tracking with detailed status history
  - Added visual indicators for completed order steps
  - Implemented revision history tracking within order timeline
  - Connected delivery status to order timeline updates

### Pre-Order Communication System (Completed)

- **Completed On**: Current date
- **Changes Made**:
  - Added support for chat communications between buyers and sellers before order creation
  - Integrated OrderMessagePanel within the Offer interface for direct communication
  - Implemented special UI mode for pre-order conversations
  - Created JavaScript version of OrderMessagePanel for the service-marketplace client
  - Added dialog-based interface for pre-order discussions from the OfferList
  - Implemented mock messaging functions for pre-offer conversations
  - Added clear visual indicators to distinguish pre-order chats from order communications

### Development Notes
- The OrderMessagePanel component now supports both order communications and pre-order discussions
- The OfferList component integrates with OrderMessagePanel to allow chatting before accepting an offer
- For the React client application, a JavaScript version of OrderMessagePanel has been created in the service-marketplace client
- The pre-order communication system helps buyers and sellers clarify details before finalizing orders

## Order Payment Workflow

### Overview

The order payment system implements a secure workflow for managing payments between buyers and sellers, with integrated status tracking and comprehensive error handling.

### Payment Flow

1. **Order Creation**:
   - Order can be created from service ads or accepted offers
   - System captures essential details (price, service details, buyer/seller)
   - Initial status is set to "pending" with payment status "pending"

2. **Checkout Process**:
   - User provides delivery information and contact details
   - System creates a payment intent with Stripe
   - Secure payment processing with Stripe Elements
   - Real-time validation and error handling

3. **Payment Processing**:
   - Stripe processes the payment securely
   - Webhook events update order status
   - System handles success and failure cases
   - Order status is updated based on payment outcome

4. **Status Confirmation**:
   - User is redirected to appropriate status page
   - Success page shows order details and next steps
   - Processing page indicates payment is being processed
   - Cancel page provides options to retry or contact support

### Security Measures

1. **Payment Security**:
   - Stripe Elements provide PCI-compliant payment processing
   - Payment details never pass through our servers
   - Webhook signature verification prevents tampering
   - Double validation occurs in both frontend and backend

2. **Order Validation**:
   - System verifies buyer and seller identities
   - Order details are validated before payment processing
   - Payment amount is verified against order total
   - Duplicate payments are prevented

3. **Error Handling**:
   - Graceful degradation for API unavailability
   - Clear error messages for payment issues
   - Fallback mechanisms for network failures
   - Comprehensive logging for troubleshooting

This comprehensive payment flow ensures secure, reliable payment processing while providing a seamless user experience throughout the checkout process.

## Order Communication System Bug Fixes

The order communication system has been enhanced with several critical bug fixes to ensure reliable message delivery and proper user identification:

### 1. Timestamp Handling

**Issue**: Messages failed to display properly due to incompatible timestamp formats from Firestore.  
**Solution**: 
- Implemented a robust timestamp formatting function that handles multiple data types:
  - JavaScript Date objects
  - ISO string timestamps
  - Firestore Timestamp objects with seconds/nanoseconds
  - Firestore Timestamp objects with toDate() method
  - Unix timestamp numbers
- Added comprehensive error handling to prevent "TypeError: t.getTime is not a function" errors
- Included fallback text for invalid or missing timestamps

### 2. Conversation Opening Logic

**Issue**: Opening a conversation from the "Start Chat" button caused an infinite loop of API calls and UI updates.  
**Solution**:
- Added a conversation tracking reference to prevent multiple opening attempts for the same conversation
- Implemented a cleaner conversation fetching mechanism that checks first in context, then in Firestore
- Removed the inefficient polling mechanism that contributed to the infinite loop
- Added proper cleanup functions to prevent memory leaks when navigating away

### 3. User Identification

**Issue**: Users appeared as "anonymous" in offers and conversations were not properly linked to the correct participants.  
**Solution**:
- Added debug information panels to diagnose authentication and user data issues
- Enhanced sender information display in messages with IDs for easier troubleshooting
- Improved the auth context integration to ensure consistent user identification across components
- Added checks for userIds in conversation participants to verify proper linkage

### 4. Error Handling

**Issue**: Messages failed silently when errors occurred, providing poor user feedback.  
**Solution**:
- Improved error handling in the message sending process
- Added clear error messages for common failure cases
- Implemented a unified error display system in the message panel
- Added console.log statements for detailed error information during debugging

### 5. Typing Indicator Removal

**Issue**: The real-time typing indicator feature was causing bugs and performance issues in the messaging system.  
**Solution**:
- Completely removed the typing indicator functionality to simplify the messaging system
- Removed from MessagingContext:
  - `typingUsers` state and setter
  - `typingTimeoutRef` and `isTypingRef` refs
  - `updateTypingStatus` function
  - Typing status subscriptions and cleanup in useEffect hooks
- Removed from messagingService.js:
  - `setTypingStatus` function that updated Firestore with typing status
  - `getTypingStatus` function that subscribed to typing status changes
- Updated UI components:
  - Removed typing status update from input field onChange handlers
  - Removed any UI elements that displayed typing indicators
  - Updated the MessageContext value object to remove typing-related properties and methods
- Benefits:
  - Reduced number of Firestore writes (no constant typing status updates)
  - Fewer real-time subscriptions leading to better performance
  - Simplified codebase with fewer potential points of failure
  - More straightforward messaging experience for users

These fixes ensure that the messaging system now reliably handles conversations between users, properly displays timestamps, and provides clear feedback when issues occur.

## Debug and Development Utilities

To facilitate ongoing development and troubleshooting, several debug utilities have been added to the messaging components:

### In-App Debugging Panel

A comprehensive debugging panel has been added to the OrderMessagePanel component, providing:

1. **Current User Information**:
   - User ID
   - Display name
   - Email address
   - Authentication state

2. **Messaging Context Status**:
   - Context availability
   - Current conversation details
   - Message count
   - Loading states

3. **Raw Message Data**:
   - Toggle for viewing complete message objects
   - Full JSON representation of message data
   - Timestamp and user ID debugging

4. **Component Props**:
   - Order ID
   - User role
   - User names
   - Chat mode (pre-order or order communication)

The debug panel is automatically enabled in development mode and can be toggled on/off with a button. This provides developers with immediate access to crucial debugging information without needing to use browser developer tools.

### Enhanced Message Display

1. **Message metadata**:
   - Added display of message IDs (abbreviated)
   - Added sender ID information for verifying message ownership
   - Added timestamp format information to diagnose date parsing issues

2. **Console Logging**:
   - Added detailed console logging for message rendering
   - Timestamp value and type logging for format debugging
   - Error logging for failed timestamp parsing
   - Conversation tracking and opening sequence logging

### OfferList Debugging

The OfferList component has been enhanced with:

1. **Debug Information Panel**:
   - MessagingContext availability
   - Current user details
   - Other user ID verification

2. **Conversation Creation Logging**:
   - Detailed logging of conversation creation process
   - User ID verification during chat initiation
   - Error tracking for failed conversation creation

These development utilities are automatically enabled in development environments and hidden in production, providing developers with powerful tools for diagnosing messaging issues without affecting the end-user experience. 