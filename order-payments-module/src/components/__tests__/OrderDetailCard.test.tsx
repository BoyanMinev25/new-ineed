import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderDetailCard from '../../components/OrderDetailCard';

const mockOrder = {
  id: 'order-123',
  status: 'pending',
  amount: 150,
  description: 'Test order description',
  createdAt: new Date().toISOString(),
  buyerId: 'buyer-123',
  sellerId: 'seller-456',
  serviceType: 'Web Development',
  buyerName: 'John Doe',
  sellerName: 'Jane Smith',
  role: 'buyer' as const
};

const mockOnActionClick = jest.fn();

describe('OrderDetailCard', () => {
  it('displays order information correctly', () => {
    render(<OrderDetailCard order={mockOrder} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText(mockOrder.serviceType)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.description)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.status)).toBeInTheDocument();
    expect(screen.getByText(`Seller: ${mockOrder.sellerName}`)).toBeInTheDocument();
  });
}); 