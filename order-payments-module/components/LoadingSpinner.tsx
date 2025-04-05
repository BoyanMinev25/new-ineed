import React from 'react';
import '../styles/components/LoadingSpinner.scss';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = ''
}) => {
  const sizeClass = size === 'medium' ? '' : `loading-spinner--${size}`;
  
  return (
    <div className={`loading-spinner ${sizeClass} ${className}`}></div>
  );
};

export default LoadingSpinner; 