import React from 'react';
import '../styles/components/Pagination.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  // Generate pagination links
  const generatePaginationLinks = () => {
    const pages: Array<number | string> = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range of pages to show around current page
    let rangeStart = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let rangeEnd = Math.min(totalPages - 1, rangeStart + maxVisible - 2);
    
    // Adjust start if we're near the end
    if (rangeEnd === totalPages - 1) {
      rangeStart = Math.max(2, rangeEnd - maxVisible + 2);
    }
    
    // Add ellipsis if needed before middle pages
    if (rangeStart > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed after middle pages
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageItem = (page: number | string, index: number) => {
    if (page === '...') {
      return (
        <li key={`ellipsis-${index}`} className="pagination__ellipsis">
          <span>...</span>
        </li>
      );
    }

    const isActive = page === currentPage;
    
    return (
      <li 
        key={`page-${page}`} 
        className={`pagination__item ${isActive ? 'pagination__item--active' : ''}`}
      >
        <button 
          onClick={() => handleClick(page)} 
          disabled={isActive}
          aria-current={isActive ? 'page' : undefined}
        >
          {page}
        </button>
      </li>
    );
  };

  return (
    <nav className="pagination" aria-label="Pagination">
      <ul className="pagination__list">
        <li className={`pagination__item pagination__item--nav ${currentPage === 1 ? 'pagination__item--disabled' : ''}`}>
          <button 
            onClick={() => handleClick(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <span aria-hidden="true">«</span>
            <span className="pagination__text">Previous</span>
          </button>
        </li>
        
        {generatePaginationLinks().map((page, index) => renderPageItem(page, index))}
        
        <li className={`pagination__item pagination__item--nav ${currentPage === totalPages ? 'pagination__item--disabled' : ''}`}>
          <button 
            onClick={() => handleClick(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <span className="pagination__text">Next</span>
            <span aria-hidden="true">»</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination; 