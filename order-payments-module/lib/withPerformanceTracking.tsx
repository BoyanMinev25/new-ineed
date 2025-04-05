import React, { useEffect, useRef } from 'react';
import { performanceMonitor } from './performance-monitoring';

export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function WithPerformanceTracking(props: P) {
    const renderStartTime = useRef(performance.now());

    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    });

    return <WrappedComponent {...props} />;
  };
}

// Hook for tracking user interactions
export function usePerformanceTracking() {
  const trackUserInteraction = (action: string, duration: number) => {
    performanceMonitor.trackUserInteraction(action, duration);
  };

  const trackPaymentFlow = (orderId: string, step: 'start' | 'complete', duration?: number) => {
    performanceMonitor.trackPaymentFlow(orderId, step, duration);
  };

  const trackFileUpload = (orderId: string, step: 'start' | 'complete', duration?: number) => {
    performanceMonitor.trackFileUpload(orderId, step, duration);
  };

  const trackDataFetch = (operation: string, fetchTime: number) => {
    performanceMonitor.trackDataFetch(operation, fetchTime);
  };

  return {
    trackUserInteraction,
    trackPaymentFlow,
    trackFileUpload,
    trackDataFetch
  };
} 