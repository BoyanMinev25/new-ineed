# Order Payments Module

A React module for handling orders and payments in a service marketplace application.

## Features

- Order management
- Payment processing with Stripe
- File uploads for service delivery
- Order status tracking
- Review and rating system
- Responsive design
- TypeScript support

## Installation

```bash
npm install order-payments-module
```

## Quick Start

1. Import the module in your main application:

```typescript
import { OrderPaymentsModule } from 'order-payments-module';
```

2. Configure routes:

```typescript
import { routes } from 'order-payments-module';

const appRoutes = [
  ...OrderPaymentsModule.routes,
  // ... your other routes
];
```

3. Set up environment variables:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Components

### OrderDetailCard
Displays a summary of an order in a card format.

```typescript
import { OrderDetailCard } from 'order-payments-module';

<OrderDetailCard
  order={order}
  onActionClick={handleOrderClick}
/>
```

### OrderTimeline
Shows the timeline of an order's progress.

```typescript
import { OrderTimeline } from 'order-payments-module';

<OrderTimeline order={order} />
```

### PaymentSummary
Displays payment information and status.

```typescript
import { PaymentSummary } from 'order-payments-module';

<PaymentSummary order={order} />
```

### DeliveryFileUploader
Handles file uploads for service delivery.

```typescript
import { DeliveryFileUploader } from 'order-payments-module';

<DeliveryFileUploader
  files={files}
  onUpload={handleFileUpload}
/>
```

### ReviewForm
Collects user reviews and ratings.

```typescript
import { ReviewForm } from 'order-payments-module';

<ReviewForm
  rating={rating}
  comment={comment}
  onSubmit={handleReviewSubmit}
/>
```

## Pages

### OrdersListPage
Lists all orders for the current user.

```typescript
import { OrdersListPage } from 'order-payments-module';

<OrdersListPage />
```

### OrderDetailPage
Shows detailed information about a specific order.

```typescript
import { OrderDetailPage } from 'order-payments-module';

<OrderDetailPage />
```

## Types

```typescript
interface Order {
  id: string;
  status: string;
  createdAt: string | Date;
  amount: number;
  buyerId: string;
  sellerId: string;
  description?: string;
  serviceType: string;
  buyerName: string;
  sellerName: string;
  role: 'buyer' | 'seller';
  deliveryFiles?: string[];
  review?: {
    rating: number;
    comment: string;
  };
}
```

## Routes

The module provides the following routes:

- `/orders` - List of orders
- `/orders/:orderId` - Order details
- `/checkout/:adId` - Checkout process
- `/payment/success` - Payment success page
- `/payment/cancel` - Payment cancellation page
- `/payment/processing` - Payment processing page

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the repository or contact the development team. 