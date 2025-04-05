import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderDetailCard from '../../components/OrderDetailCard';
import { Order, OrderStatus, PaymentStatus } from '../../models/order-models';

// Mock order data for testing
const mockOrder: Order = {
  id: 'order-123456789',
  clientId: 'client-123',
  providerId: 'provider-456',
  serviceId: 'service-789',
  title: 'Test Order',
  description: 'This is a test order description.',
  status: OrderStatus.CONFIRMED,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  deadline: new Date('2023-02-01'),
  price: {
    subtotal: 100,
    fees: 10,
    taxes: 5,
    total: 115,
    currency: 'USD'
  },
  paymentStatus: PaymentStatus.HELD
};

describe('OrderDetailCard Component', () => {
  test('renders in compact mode correctly', () => {
    render(<OrderDetailCard order={mockOrder} isCompact={true} />);
    
    // Check that critical elements are present
    expect(screen.getByText('Test Order')).toBeInTheDocument();
    expect(screen.getByText('This is a test order description.')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText(/Jan 1, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Order ID:/)).toBeInTheDocument();
    expect(screen.getByText('$115.00')).toBeInTheDocument();
  });

  test('renders in detailed mode correctly', () => {
    render(<OrderDetailCard order={mockOrder} isCompact={false} />);
    
    // Check for detailed mode specific elements
    expect(screen.getByText('Test Order')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('This is a test order description.')).toBeInTheDocument();
    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('order-123456789')).toBeInTheDocument();
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('HELD')).toBeInTheDocument();
    
    // Check price breakdown
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Fees')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Taxes')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$115.00')).toBeInTheDocument();
  });

  test('calls onClick when clicked in compact mode', () => {
    const handleClick = jest.fn();
    render(<OrderDetailCard order={mockOrder} isCompact={true} onClick={handleClick} />);
    
    // Find the clickable div
    const card = screen.getByText('Test Order').closest('div');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders different status badges with appropriate styling', () => {
    // Test with different order statuses
    const statuses = [
      OrderStatus.CREATED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.DISPUTED
    ];
    
    statuses.forEach(status => {
      const orderWithStatus = { ...mockOrder, status };
      const { unmount } = render(<OrderDetailCard order={orderWithStatus} isCompact={true} />);
      
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });

  test('handles orders without taxes correctly', () => {
    const orderWithoutTaxes = { 
      ...mockOrder, 
      price: { ...mockOrder.price, taxes: 0 } 
    };
    
    render(<OrderDetailCard order={orderWithoutTaxes} />);
    
    // Check that taxes are not displayed when 0
    const taxesElements = screen.queryAllByText('Taxes');
    expect(taxesElements.length).toBe(0);
  });
}); 