import React, { useState, useEffect } from 'react';
import { OrderDispute } from '../models/order-models';

interface ResolutionCenterPageProps {
  userId: string;
  orderId?: string; // Optional - if specified, shows only disputes for a specific order
}

/**
 * ResolutionCenterPage Component
 * 
 * Provides an interface for users to view, create, and manage
 * disputes related to their orders. Also includes an FAQ section.
 */
const ResolutionCenterPage: React.FC<ResolutionCenterPageProps> = ({
  userId,
  orderId
}) => {
  // State for disputes
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for new dispute form
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'disputes' | 'faq'>('disputes');

  // Fetch disputes when component mounts
  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a real implementation, this would call a function from firestore-utils
        // const fetchedDisputes = await getOrderDisputes(userId, orderId);
        
        // Mock data for now
        const mockDisputes: OrderDispute[] = orderId ? [
          {
            id: 'dispute_1',
            orderId: orderId,
            reason: 'Late Delivery',
            description: 'The provider missed the deadline by 3 days without communication.',
            status: 'OPEN',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            createdBy: userId
          }
        ] : [
          {
            id: 'dispute_1',
            orderId: 'order_123',
            reason: 'Late Delivery',
            description: 'The provider missed the deadline by 3 days without communication.',
            status: 'OPEN',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            createdBy: userId
          },
          {
            id: 'dispute_2',
            orderId: 'order_456',
            reason: 'Quality Issue',
            description: 'The delivered work does not match the service description.',
            status: 'RESOLVED',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            createdBy: userId,
            resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            resolution: 'Provider agreed to revise the work at no additional cost.'
          }
        ];
        
        setDisputes(mockDisputes);
        
      } catch (err) {
        console.error('Error fetching disputes:', err);
        setError('Failed to load disputes. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDisputes();
  }, [userId, orderId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.description) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // In a real implementation, this would call a function from firestore-utils
      // const newDispute = await createOrderDispute({
      //   orderId: orderId || '',
      //   reason: formData.reason,
      //   description: formData.description,
      //   createdBy: userId,
      //   status: 'OPEN'
      // });
      
      // Mock response
      const newDispute: OrderDispute = {
        id: `dispute_${Math.random().toString(36).substring(2)}`,
        orderId: orderId || 'order_123',
        reason: formData.reason,
        description: formData.description,
        status: 'OPEN',
        createdAt: new Date(),
        createdBy: userId
      };
      
      // Add the new dispute to the list
      setDisputes(prev => [newDispute, ...prev]);
      
      // Reset form
      setFormData({
        reason: '',
        description: ''
      });
      
      // Close form
      setIsFormOpen(false);
      
    } catch (err) {
      console.error('Error creating dispute:', err);
      setError('Failed to create dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render disputes list
  const renderDisputes = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }
    
    if (disputes.length === 0) {
      return (
        <div className="bg-gray-50 border rounded-lg p-6 text-center">
          <p className="text-gray-600">You don't have any disputes yet.</p>
          {!orderId && (
            <p className="text-sm text-gray-500 mt-2">
              If you're experiencing issues with an order, you can open a dispute to resolve it.
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {disputes.map(dispute => (
          <div key={dispute.id} className="bg-white border rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{dispute.reason}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Order ID: <span className="font-mono">{dispute.orderId}</span>
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  dispute.status === 'OPEN' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {dispute.status}
                </span>
              </div>
              
              <div className="mt-3">
                <p className="text-sm">{dispute.description}</p>
              </div>
              
              <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                <p>Created on {formatDate(dispute.createdAt)}</p>
                
                {dispute.status === 'RESOLVED' && dispute.resolvedAt && (
                  <div className="mt-2">
                    <p>Resolved on {formatDate(dispute.resolvedAt)}</p>
                    {dispute.resolution && (
                      <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{dispute.resolution}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            {dispute.status === 'OPEN' && (
              <div className="px-4 py-3 bg-gray-50 border-t">
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    // Here we would navigate to a detailed view or open a chat interface
                    console.log(`View details for dispute ${dispute.id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render FAQ items
  const renderFAQ = () => {
    const faqItems = [
      {
        question: 'When should I open a dispute?',
        answer: 'You should open a dispute if there are issues with your order that you haven\'t been able to resolve directly with the other party. This might include missed deadlines, quality issues, or communication problems.'
      },
      {
        question: 'How long does the dispute resolution process take?',
        answer: 'Most disputes are resolved within 3-5 business days. Complex cases may take longer. Our team reviews each case carefully to ensure a fair resolution.'
      },
      {
        question: 'Will my payment be refunded if I open a dispute?',
        answer: 'Refunds are determined on a case-by-case basis. If your dispute is resolved in your favor, you may receive a full or partial refund depending on the circumstances.'
      },
      {
        question: 'Can I cancel an order without opening a dispute?',
        answer: 'Yes, if both parties agree, an order can be cancelled without opening a formal dispute. This is often the fastest way to resolve issues.'
      },
      {
        question: 'What information should I include when opening a dispute?',
        answer: 'Be as specific as possible about the issue, including dates, communications, and any relevant details. Screenshots or other evidence can be helpful in resolving your case quickly.'
      }
    ];
    
    return (
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="bg-white border rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="text-sm text-gray-600 mt-2">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="resolution-center-page max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Resolution Center</h2>
        <p className="text-gray-600">
          {orderId 
            ? 'Manage disputes for this order'
            : 'Manage disputes and find help with your orders'
          }
        </p>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('disputes')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'disputes'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Disputes
            </button>
            
            <button
              onClick={() => setActiveTab('faq')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'faq'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              FAQ
            </button>
          </nav>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Content */}
      <div className="mb-6">
        {activeTab === 'disputes' && (
          <>
            {/* Action buttons */}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {orderId ? 'Disputes for this Order' : 'Your Disputes'}
              </h3>
              
              {!isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Open New Dispute
                </button>
              )}
            </div>
            
            {/* New dispute form */}
            {isFormOpen && (
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Open a New Dispute</h3>
                
                <form onSubmit={handleSubmit}>
                  {/* Order ID selector - only show if orderId is not provided */}
                  {!orderId && (
                    <div className="mb-4">
                      <label htmlFor="order-id" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Order
                      </label>
                      <select
                        id="order-id"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>Select an order...</option>
                        <option value="order_123">Order #123 - Website Design</option>
                        <option value="order_456">Order #456 - Logo Creation</option>
                        <option value="order_789">Order #789 - Content Writing</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Reason */}
                  <div className="mb-4">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Dispute
                    </label>
                    <select
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>Select a reason...</option>
                      <option value="Late Delivery">Late Delivery</option>
                      <option value="Quality Issue">Quality Issue</option>
                      <option value="Incorrect Delivery">Incorrect Delivery</option>
                      <option value="Communication Issue">Communication Issue</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide details about the issue..."
                      required
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Please be specific and include any relevant details that will help us resolve your dispute.
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded text-white ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Disputes list */}
            {renderDisputes()}
          </>
        )}
        
        {activeTab === 'faq' && renderFAQ()}
      </div>
      
      {/* Contact support */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Need more help?</h3>
        <p className="text-sm text-blue-600">
          Our support team is available to assist you with any questions or concerns.
        </p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            // Here we would navigate to the contact support page or open a chat window
            console.log('Contact support');
          }}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default ResolutionCenterPage; 