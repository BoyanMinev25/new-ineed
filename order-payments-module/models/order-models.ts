/**
 * TypeScript interfaces for the Order Payments Module
 * These define the structure of our Firestore documents
 */

export enum OrderStatus {
  CREATED = 'CREATED',           // Initial state when order is placed
  CONFIRMED = 'CONFIRMED',       // Provider has accepted the order
  IN_PROGRESS = 'IN_PROGRESS',   // Work has started
  DELIVERED = 'DELIVERED',       // Provider has marked as delivered
  COMPLETED = 'COMPLETED',       // Client has accepted the delivery
  CANCELLED = 'CANCELLED',       // Order was cancelled
  DISPUTED = 'DISPUTED'          // Order is under dispute
}

export enum PaymentStatus {
  PENDING = 'PENDING',           // Payment intent created, not captured
  HELD = 'HELD',                 // Payment captured but held in escrow
  PARTIALLY_RELEASED = 'PARTIALLY_RELEASED', // Some funds released to provider
  RELEASED = 'RELEASED',         // All funds released to provider
  REFUNDED = 'REFUNDED',         // Refunded to client
  FAILED = 'FAILED'              // Payment failed
}

export interface Order {
  id: string;                    // Unique order ID
  clientId: string;              // Client user ID
  providerId: string;            // Service provider user ID
  serviceId: string;             // ID of the ordered service
  title: string;                 // Title of the ordered service
  description: string;           // Description of what was ordered
  status: OrderStatus;           // Current order status
  createdAt: Date;               // When the order was created
  updatedAt: Date;               // Last update timestamp
  deadline: Date;                // Expected delivery date
  price: {
    subtotal: number;            // Base price
    fees: number;                // Platform fees
    taxes: number;               // Any applicable taxes
    total: number;               // Total amount
    currency: string;            // Currency code (e.g., 'USD')
  };
  paymentStatus: PaymentStatus;  // Current payment status
  paymentIntent?: string;        // Stripe payment intent ID
}

export interface OrderEvent {
  id: string;                    // Event ID
  orderId: string;               // Reference to order
  type: string;                  // Event type (status change, message, etc.)
  description: string;           // Human-readable description
  createdAt: Date;               // When the event occurred
  createdBy: string;             // User ID who triggered the event
  metadata: Record<string, any>; // Additional data relevant to the event
}

export interface OrderDelivery {
  id: string;                    // Delivery ID
  orderId: string;               // Reference to order
  description: string;           // Description of delivery
  files: {                       // Uploaded files
    fileName: string;            // Original file name
    fileType: string;            // MIME type
    fileUrl: string;             // Storage URL
    uploadedAt: Date;            // Upload timestamp
  }[];
  deliveredAt: Date;             // When marked as delivered
  notes: string;                 // Additional notes
}

export interface OrderDispute {
  id: string;                    // Dispute ID
  orderId: string;               // Reference to order
  reason: string;                // Reason for dispute
  description: string;           // Detailed description
  status: 'OPEN' | 'RESOLVED';   // Dispute status
  createdAt: Date;               // When dispute was created
  createdBy: string;             // Who created the dispute
  resolvedAt?: Date;             // When dispute was resolved (if applicable)
  resolution?: string;           // Resolution details
}

export interface OrderReview {
  id: string;                    // Review ID
  orderId: string;               // Reference to order
  reviewerId: string;            // User ID giving review
  recipientId: string;           // User ID receiving review
  rating: number;                // Numerical rating (e.g., 1-5)
  comment: string;               // Text review
  createdAt: Date;               // When review was submitted
} 