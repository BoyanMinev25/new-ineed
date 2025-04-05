# Security Rules Documentation

This document provides the security rules for Firestore collections and Firebase Storage used in the Order Payments Module.

## Firestore Security Rules

These rules should be added to your Firebase project's Firestore security rules:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Order collection rules
    match /orders/{orderId} {
      // Allow read access to users who are the client or provider for the order
      function isInvolvedParty() {
        let order = resource.data;
        return isSignedIn() && (
          request.auth.uid == order.clientId || 
          request.auth.uid == order.providerId
        );
      }
      
      // Only allow admins to delete orders
      allow delete: if isAdmin();
      
      // Allow read if user is client, provider, or admin
      allow read: if isInvolvedParty() || isAdmin();
      
      // Allow create if user is signed in and they're setting themselves as the client
      allow create: if isSignedIn() && 
                     request.resource.data.clientId == request.auth.uid && 
                     request.resource.data.status == 'CREATED';
      
      // Allow updates with specific validations
      allow update: if (isInvolvedParty() || isAdmin()) && 
                     // Only allow certain fields to be updated by clients
                     (isOwner(resource.data.clientId) ? (
                        // Clients can only update specific fields
                        request.resource.data.diff(resource.data).affectedKeys()
                          .hasOnly(['status', 'updatedAt']) &&
                        // Clients can only set certain status values
                        (request.resource.data.status in ['CANCELLED', 'COMPLETED'])
                     ) : (
                        // Providers can update more fields
                        isOwner(resource.data.providerId) ? (
                          request.resource.data.diff(resource.data).affectedKeys()
                            .hasOnly(['status', 'updatedAt']) &&
                          (request.resource.data.status in ['CONFIRMED', 'IN_PROGRESS', 'DELIVERED'])
                        ) : (
                          // Admin can update any fields
                          isAdmin()
                        )
                     ));
      
      // Order events subcollection
      match /events/{eventId} {
        allow read: if isInvolvedParty() || isAdmin();
        allow create: if isSignedIn() && 
                       request.resource.data.createdBy == request.auth.uid &&
                       (isInvolvedParty() || isAdmin());
        allow update, delete: if isAdmin();
      }
      
      // Order delivery subcollection
      match /deliveries/{deliveryId} {
        allow read: if isInvolvedParty() || isAdmin();
        allow create: if isSignedIn() && isOwner(resource.data.providerId);
        allow update: if isAdmin();
        allow delete: if isAdmin();
      }
      
      // Order dispute subcollection
      match /disputes/{disputeId} {
        allow read: if isInvolvedParty() || isAdmin();
        allow create: if isSignedIn() && isInvolvedParty();
        allow update: if isAdmin();
        allow delete: if isAdmin();
      }
      
      // Order review subcollection
      match /reviews/{reviewId} {
        allow read: if true; // Reviews are public
        allow create: if isSignedIn() && 
                       request.resource.data.reviewerId == request.auth.uid &&
                       isInvolvedParty();
        allow update, delete: if isAdmin();
      }
    }
    
    // Payment intents collection (for storing Stripe payment information)
    match /paymentIntents/{intentId} {
      function isPaymentOwner() {
        let payment = resource.data;
        return isSignedIn() && payment.clientId == request.auth.uid;
      }
      
      allow read: if isPaymentOwner() || isAdmin();
      allow create: if isSignedIn() && request.resource.data.clientId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

## Firebase Storage Security Rules

These rules should be added to your Firebase project's Storage security rules:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }
    
    // Order deliveries path
    match /orders/{orderId}/deliveries/{fileName} {
      // Get the order document to check if user is involved
      function getOrder() {
        return firestore.get(/databases/(default)/documents/orders/$(orderId)).data;
      }
      
      function isInvolvedParty() {
        let order = getOrder();
        return isSignedIn() && (
          request.auth.uid == order.clientId || 
          request.auth.uid == order.providerId
        );
      }
      
      // Providers can upload delivery files
      allow create: if isSignedIn() && 
                     getOrder().providerId == request.auth.uid &&
                     request.resource.size < 50 * 1024 * 1024 && // 50MB max
                     request.resource.contentType.matches('image/.*|application/pdf|text/plain|application/zip');
      
      // Both client and provider can read files
      allow read: if isInvolvedParty() || isAdmin();
      
      // Only admin can update or delete files
      allow update, delete: if isAdmin();
    }
    
    // Dispute evidence path
    match /orders/{orderId}/disputes/{fileName} {
      function getOrder() {
        return firestore.get(/databases/(default)/documents/orders/$(orderId)).data;
      }
      
      function isInvolvedParty() {
        let order = getOrder();
        return isSignedIn() && (
          request.auth.uid == order.clientId || 
          request.auth.uid == order.providerId
        );
      }
      
      // Both client and provider can upload dispute evidence 
      allow create: if isInvolvedParty() &&
                     request.resource.size < 20 * 1024 * 1024 && // 20MB max
                     request.resource.contentType.matches('image/.*|application/pdf|text/plain');
      
      // Both client and provider can read dispute evidence
      allow read: if isInvolvedParty() || isAdmin();
      
      // Only admin can update or delete files
      allow update, delete: if isAdmin();
    }
  }
}
```

## Security Considerations

1. **Authentication Required**: Most operations require users to be authenticated.
2. **Authorization Checks**: Access is restricted based on user roles (client, provider, admin).
3. **Data Validation**: Strict rules about what fields can be updated by which users.
4. **Status Transitions**: Order status can only be changed to valid next states by authorized users.
5. **File Upload Restrictions**:
   - Size limits (50MB for deliveries, 20MB for dispute evidence)
   - Content type restrictions to prevent malicious file uploads
   - Only relevant parties can upload files to specific locations

## Implementation Notes

1. To apply these rules, navigate to your Firebase Console:
   - For Firestore: Go to Firestore Database > Rules and paste the Firestore rules
   - For Storage: Go to Storage > Rules and paste the Storage rules

2. Create an "admins" collection in Firestore with documents representing admin user IDs.

3. Test rules thoroughly after implementation to ensure they work as expected but don't accidentally block legitimate actions.

4. Monitor security rule performance - complex rules can increase latency if not optimized. 