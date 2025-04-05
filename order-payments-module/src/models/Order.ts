export interface Order {
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
  review?: {
    rating: number;
    comment: string;
  };
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentDetails {
  details: Array<{
    label: string;
    amount: number;
    isTotal?: boolean;
  }>;
  currency?: string;
}

export interface ReviewFormData {
  orderId: string;
  sellerName: string;
  onSubmitReview: (rating: number, comment: string) => void;
  isSubmitting?: boolean;
  rating?: number;
  comment?: string;
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadDate?: string | Date;
}

export type OrderStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled'
  | 'disputed';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export default Order; 