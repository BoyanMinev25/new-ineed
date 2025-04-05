import React, { lazy, Suspense, useState, useEffect } from 'react';
import { performanceMonitor } from './performance-monitoring';
import LoadingSpinner from '../components/LoadingSpinner';

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

// Create a loading component with customizable fallback
export const LazyLoadingFallback: React.FC<{ height?: string | number, size?: 'small' | 'medium' | 'large' }> = ({ 
  height = '200px',
  size = 'medium'
}) => (
  <div 
    style={{ 
      height, 
      backgroundColor: '#f3f4f6', 
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <LoadingSpinner size={size} />
  </div>
);

// Track when component is loaded
const trackComponentLoad = (componentName: string, startTime: number) => {
  const loadTime = performance.now() - startTime;
  performanceMonitor.trackComponentRender(`Lazy_${componentName}`, loadTime);
};

// Lazy load a component with performance tracking
export function lazyLoad<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName: string,
  options: { preload?: boolean } = {}
) {
  const loadStartTime = performance.now();
  
  // Create the lazy component
  const LazyComponent = lazy(() => {
    return factory().then(module => {
      trackComponentLoad(componentName, loadStartTime);
      return module;
    });
  });
  
  // Create a wrapper with preloading capability
  const LazyLoadedComponent: React.FC<React.ComponentProps<T> & LazyComponentProps> = ({
    fallback = <LazyLoadingFallback />,
    ...props
  }) => {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props as any} />
      </Suspense>
    );
  };
  
  // Add display name for debugging
  LazyLoadedComponent.displayName = `LazyLoaded(${componentName})`;
  
  // Add preload method
  const preload = () => {
    factory().catch(err => console.error(`Error preloading ${componentName}:`, err));
  };
  
  // If preload option is enabled, preload immediately
  if (options.preload) {
    preload();
  }
  
  // Attach preload method to component
  (LazyLoadedComponent as any).preload = preload;
  
  return LazyLoadedComponent;
}

// Hook for preloading components on hover or other events
export function usePreload() {
  const [preloaded, setPreloaded] = useState<Record<string, boolean>>({});
  
  const preloadComponent = (component: React.ComponentType<any> & { preload?: () => void }, id: string) => {
    if (component.preload && !preloaded[id]) {
      component.preload();
      setPreloaded(prev => ({ ...prev, [id]: true }));
    }
  };
  
  return { preloadComponent, preloaded };
} 