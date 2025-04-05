import { Order } from '../models/order-models';

// Performance metrics interface
interface PerformanceMetrics {
  componentRenderTime: number;
  dataFetchTime: number;
  userInteractionTime: number;
  memoryUsage: number;
  timestamp: number;
}

// Analytics event types
type AnalyticsEventType = 
  | 'order_list_load'
  | 'order_detail_load'
  | 'payment_process_start'
  | 'payment_process_complete'
  | 'file_upload_start'
  | 'file_upload_complete'
  | 'component_render'
  | 'user_interaction';

interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Component performance tracking
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    this.metrics.push({
      componentRenderTime: renderTime,
      dataFetchTime: 0,
      userInteractionTime: 0,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    });

    this.events.push({
      type: 'component_render',
      timestamp: Date.now(),
      duration: renderTime,
      metadata: { componentName }
    });

    this.flushMetricsIfNeeded();
  }

  // Data fetching performance tracking
  trackDataFetch(operation: string, fetchTime: number) {
    if (!this.isEnabled) return;

    this.metrics.push({
      componentRenderTime: 0,
      dataFetchTime: fetchTime,
      userInteractionTime: 0,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    });

    this.events.push({
      type: 'order_list_load',
      timestamp: Date.now(),
      duration: fetchTime,
      metadata: { operation }
    });

    this.flushMetricsIfNeeded();
  }

  // User interaction tracking
  trackUserInteraction(action: string, duration: number) {
    if (!this.isEnabled) return;

    this.metrics.push({
      componentRenderTime: 0,
      dataFetchTime: 0,
      userInteractionTime: duration,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    });

    this.events.push({
      type: 'user_interaction',
      timestamp: Date.now(),
      duration,
      metadata: { action }
    });

    this.flushMetricsIfNeeded();
  }

  // Payment flow tracking
  trackPaymentFlow(orderId: string, step: 'start' | 'complete', duration?: number) {
    if (!this.isEnabled) return;

    this.events.push({
      type: step === 'start' ? 'payment_process_start' : 'payment_process_complete',
      timestamp: Date.now(),
      duration,
      metadata: { orderId }
    });

    this.flushEventsIfNeeded();
  }

  // File upload tracking
  trackFileUpload(orderId: string, step: 'start' | 'complete', duration?: number) {
    if (!this.isEnabled) return;

    this.events.push({
      type: step === 'start' ? 'file_upload_start' : 'file_upload_complete',
      timestamp: Date.now(),
      duration,
      metadata: { orderId }
    });

    this.flushEventsIfNeeded();
  }

  // Get current memory usage
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window as any).performance) {
      const memory = (window as any).performance.memory;
      return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
    }
    return 0;
  }

  // Flush metrics if buffer is full
  private flushMetricsIfNeeded() {
    if (this.metrics.length >= 100) {
      this.flushMetrics();
    }
  }

  // Flush events if buffer is full
  private flushEventsIfNeeded() {
    if (this.events.length >= 100) {
      this.flushEvents();
    }
  }

  // Flush metrics to analytics service
  private flushMetrics() {
    // TODO: Implement actual analytics service integration
    console.log('Flushing performance metrics:', this.metrics);
    this.metrics = [];
  }

  // Flush events to analytics service
  private flushEvents() {
    // TODO: Implement actual analytics service integration
    console.log('Flushing analytics events:', this.events);
    this.events = [];
  }

  // Get performance report
  getPerformanceReport(): {
    metrics: PerformanceMetrics[];
    events: AnalyticsEvent[];
  } {
    return {
      metrics: [...this.metrics],
      events: [...this.events]
    };
  }

  // Clear all data
  clear() {
    this.metrics = [];
    this.events = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance(); 