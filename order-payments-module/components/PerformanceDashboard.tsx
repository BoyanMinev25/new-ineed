import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '../lib/performance-monitoring';
import '../styles/components/PerformanceDashboard.scss';

interface PerformanceStats {
  averageRenderTime: number;
  averageFetchTime: number;
  averageInteractionTime: number;
  totalEvents: number;
  memoryUsage: number;
}

const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    averageRenderTime: 0,
    averageFetchTime: 0,
    averageInteractionTime: 0,
    totalEvents: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const report = performanceMonitor.getPerformanceReport();
      const metrics = report.metrics;
      const events = report.events;

      // Calculate averages
      const renderTimes = metrics.map(m => m.componentRenderTime).filter(t => t > 0);
      const fetchTimes = metrics.map(m => m.dataFetchTime).filter(t => t > 0);
      const interactionTimes = metrics.map(m => m.userInteractionTime).filter(t => t > 0);

      setStats({
        averageRenderTime: renderTimes.length ? renderTimes.reduce((a, b) => a + b) / renderTimes.length : 0,
        averageFetchTime: fetchTimes.length ? fetchTimes.reduce((a, b) => a + b) / fetchTimes.length : 0,
        averageInteractionTime: interactionTimes.length ? interactionTimes.reduce((a, b) => a + b) / interactionTimes.length : 0,
        totalEvents: events.length,
        memoryUsage: metrics.length ? metrics[metrics.length - 1].memoryUsage : 0
      });
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const formatMemory = (mb: number): string => {
    return `${mb.toFixed(2)}MB`;
  };

  return (
    <div className="performance-dashboard">
      <h2 className="performance-dashboard__title">Performance Metrics</h2>
      
      <div className="performance-dashboard__grid">
        <div className="performance-dashboard__card">
          <h3>Component Rendering</h3>
          <div className="performance-dashboard__metric">
            <span className="performance-dashboard__label">Average Render Time:</span>
            <span className="performance-dashboard__value">{formatTime(stats.averageRenderTime)}</span>
          </div>
        </div>

        <div className="performance-dashboard__card">
          <h3>Data Fetching</h3>
          <div className="performance-dashboard__metric">
            <span className="performance-dashboard__label">Average Fetch Time:</span>
            <span className="performance-dashboard__value">{formatTime(stats.averageFetchTime)}</span>
          </div>
        </div>

        <div className="performance-dashboard__card">
          <h3>User Interactions</h3>
          <div className="performance-dashboard__metric">
            <span className="performance-dashboard__label">Average Interaction Time:</span>
            <span className="performance-dashboard__value">{formatTime(stats.averageInteractionTime)}</span>
          </div>
        </div>

        <div className="performance-dashboard__card">
          <h3>System Resources</h3>
          <div className="performance-dashboard__metric">
            <span className="performance-dashboard__label">Memory Usage:</span>
            <span className="performance-dashboard__value">{formatMemory(stats.memoryUsage)}</span>
          </div>
          <div className="performance-dashboard__metric">
            <span className="performance-dashboard__label">Total Events:</span>
            <span className="performance-dashboard__value">{stats.totalEvents}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard; 