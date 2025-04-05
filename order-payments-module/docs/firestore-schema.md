# Firestore Schema Documentation

This document outlines the schema and relationships for the Firestore database collections used in the Order Payments Module.

## Collections Overview

```
orders/
  ├── {orderId}/                 # Order document
  │    ├── events/               # Subcollection of order events
  │    │    └── {eventId}
  │    ├── deliveries/           # Subcollection of deliveries
  │    │    └── {deliveryId}
  │    ├── disputes/             # Subcollection of disputes
  │    │    └── {disputeId}
  │    └── reviews/              # Subcollection of reviews
  │         └── {reviewId}
  │
paymentIntents/                  # Payment intent records
  └── {paymentIntentId}          # Maps to Stripe payment intents
```

## Document Schemas

### Order Document (`orders/{orderId}`)

```typescript
{
  id: string;                    // Unique order ID (same as document ID)
  clientId: string;              // Client user ID
  providerId: string;            // Service provider user ID
  serviceId: string;             // ID of the ordered service
  title: string;                 // Title of the ordered service
  description: string;           // Description of what was ordered
  status: string;                // Current order status (CREATED, CONFIRMED, etc.)
  createdAt: timestamp;          // When the order was created
  updatedAt: timestamp;          // Last update timestamp
  deadline: timestamp;           // Expected delivery date
  price: {
    subtotal: number;            // Base price
    fees: number;                // Platform fees
    taxes: number;               // Any applicable taxes
    total: number;               // Total amount
    currency: string;            // Currency code (e.g., 'USD')
  };
  paymentStatus: string;         // Current payment status (PENDING, HELD, etc.)
  paymentIntent?: string;        // Stripe payment intent ID
}
```

### Order Event Document (`orders/{orderId}/events/{eventId}`)

```typescript
{
  id: string;                    // Event ID (same as document ID)
  orderId: string;               // Reference to parent order
  type: string;                  // Event type (status_change, message, etc.)
  description: string;           // Human-readable description
  createdAt: timestamp;          // When the event occurred
  createdBy: string;             // User ID who triggered the event
  metadata: {                    // Additional data relevant to the event
    [key: string]: any;          // Varies depending on event type
  }
}
```

### Order Delivery Document (`orders/{orderId}/deliveries/{deliveryId}`)

```typescript
{
  id: string;                    // Delivery ID (same as document ID)
  orderId: string;               // Reference to parent order
  description: string;           // Description of delivery
  files: [                       // Array of uploaded files
    {
      fileName: string;          // Original file name
      fileType: string;          // MIME type
      fileUrl: string;           // Storage URL
      uploadedAt: timestamp;     // Upload timestamp
    }
  ];
  deliveredAt: timestamp;        // When marked as delivered
  notes: string;                 // Additional notes
}
```

### Order Dispute Document (`orders/{orderId}/disputes/{disputeId}`)

```typescript
{
  id: string;                    // Dispute ID (same as document ID)
  orderId: string;               // Reference to parent order
  reason: string;                // Reason for dispute
  description: string;           // Detailed description
  status: string;                // 'OPEN' or 'RESOLVED'
  createdAt: timestamp;          // When dispute was created
  createdBy: string;             // Who created the dispute (client or provider ID)
  resolvedAt?: timestamp;        // When dispute was resolved (if applicable)
  resolution?: string;           // Resolution details
}
```

### Order Review Document (`orders/{orderId}/reviews/{reviewId}`)

```typescript
{
  id: string;                    // Review ID (same as document ID)
  orderId: string;               // Reference to parent order
  reviewerId: string;            // User ID giving review (client or provider)
  recipientId: string;           // User ID receiving review (client or provider)
  rating: number;                // Numerical rating (e.g., 1-5)
  comment: string;               // Text review
  createdAt: timestamp;          // When review was submitted
}
```

### Payment Intent Document (`paymentIntents/{paymentIntentId}`)

```typescript
{
  id: string;                    // Payment intent ID (same as document ID)
  stripePaymentIntentId: string; // Stripe payment intent ID
  orderId: string;               // Related order ID
  clientId: string;              // Client who made the payment
  amount: number;                // Payment amount (in smallest currency unit, e.g., cents)
  currency: string;              // Currency code (e.g., 'USD')
  status: string;                // Payment status (from Stripe)
  createdAt: timestamp;          // When created
  updatedAt: timestamp;          // Last updated
  metadata: {                    // Additional payment data
    [key: string]: any;
  }
}
```

## Key Relationships

- **Order → Client/Provider**: Orders reference users through `clientId` and `providerId` fields
- **Order → Events/Deliveries/Disputes/Reviews**: These are subcollections of an order, accessed by orderId
- **Order → Payment Intent**: Orders reference payment intents via the `paymentIntent` field
- **Payment Intent → Order**: Each payment intent references back to the associated order via the `orderId` field

## Indexing Considerations

For optimal query performance, consider creating the following indexes:

1. **Orders Collection**:
   - Compound index on `clientId` ASC, `createdAt` DESC (for client order history)
   - Compound index on `providerId` ASC, `createdAt` DESC (for provider order history)
   - Compound index on `status` ASC, `createdAt` DESC (for filtering orders by status)

2. **Order Events Subcollection**:
   - Compound index on `type` ASC, `createdAt` DESC (for filtering events by type)

3. **Payment Intents Collection**:
   - Compound index on `clientId` ASC, `createdAt` DESC (for client payment history)
   - Compound index on `status` ASC, `createdAt` DESC (for monitoring payment statuses)

## State Transitions

### Order Status Transitions

The `status` field in Order documents follows these valid transitions:

```
CREATED → CONFIRMED → IN_PROGRESS → DELIVERED → COMPLETED
      ↘                                       ↗
        CANCELLED ←--------------------------┘
              ↖                             ↙
                ---------→ DISPUTED ←-------
```

### Payment Status Transitions

The `paymentStatus` field in Order documents follows these transitions:

```
PENDING → HELD → PARTIALLY_RELEASED → RELEASED
      ↘                             ↗
        ---------→ REFUNDED ←-------
              ↖         ↑         ↙
                ---→ FAILED ←----
```

## Query Patterns

Common query patterns for this schema:

1. Get all orders for a specific client:
   ```javascript
   db.collection('orders').where('clientId', '==', userId).orderBy('createdAt', 'desc')
   ```

2. Get all orders for a specific provider:
   ```javascript
   db.collection('orders').where('providerId', '==', userId).orderBy('createdAt', 'desc')
   ```

3. Get all events for a specific order:
   ```javascript
   db.collection('orders').doc(orderId).collection('events').orderBy('createdAt', 'desc')
   ```

4. Get payment intent details for an order:
   ```javascript
   db.collection('paymentIntents').where('orderId', '==', orderId).limit(1)
   ```

5. Get all open disputes:
   ```javascript
   db.collectionGroup('disputes').where('status', '==', 'OPEN')
   ```

## Implementation Notes

1. Use Firestore Transactions for operations that need to update multiple documents atomically (e.g., changing order status and creating an event record).

2. For large collections, consider implementing pagination using the `startAfter()` method with `createdAt` timestamps as cursors.

3. Use Cloud Functions to maintain referential integrity and enforce business rules that cannot be handled by security rules alone. 