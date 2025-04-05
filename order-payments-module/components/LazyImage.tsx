import React, { useState, useEffect, useRef } from 'react';
import { usePerformanceTracking } from '../lib/withPerformanceTracking';
import '../styles/components/LazyImage.scss';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  placeholderSrc?: string;
  className?: string;
  loadingClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  placeholderSrc = '/assets/placeholder-image.png',
  className = '',
  loadingClassName = 'lazy-image--loading',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { trackUserInteraction } = usePerformanceTracking();
  
  useEffect(() => {
    // Create an intersection observer to detect when the image enters the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        // When the image enters the viewport, set isVisible to true
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Start loading when image is 200px from viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleImageLoad = () => {
    const startTime = performance.now();
    setIsLoaded(true);
    if (onLoad) onLoad();
    const duration = performance.now() - startTime;
    trackUserInteraction('image_load', duration);
  };

  const handleImageError = () => {
    setError(true);
    if (onError) onError();
  };

  // Determine which source to use
  const imageSrc = error ? placeholderSrc : (isVisible ? src : placeholderSrc);
  
  return (
    <div 
      className={`lazy-image ${!isLoaded && isVisible ? loadingClassName : ''} ${className}`}
      style={{ width, height }}
    >
      {!isLoaded && isVisible && (
        <div className="lazy-image__skeleton"></div>
      )}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`lazy-image__img ${isLoaded ? 'lazy-image__img--loaded' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default LazyImage; 