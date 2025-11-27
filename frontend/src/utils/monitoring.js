/**
 * Frontend monitoring utilities for performance tracking and error logging
 */

import React from 'react';

class FrontendMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      componentRenderTimes: {},
      apiCallTimes: {},
      errors: [],
      userInteractions: [],
      memoryUsage: [],
      bundleSize: 0
    };

    this.init();
  }

  /**
   * Initialize monitoring
   */
  init() {
    this.trackPageLoadTime();
    this.trackMemoryUsage();
    this.trackUserInteractions();
    this.trackErrors();
  }

  /**
   * Track page load time
   */
  trackPageLoadTime() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      this.metrics.pageLoadTime = loadTime;

      // Send to backend for monitoring
      this.sendMetric('page_load_time', loadTime);
    }
  }

  /**
   * Track component render time
   * @param {string} componentName - Name of the component
   * @param {number} renderTime - Time taken to render
   */
  trackComponentRender(componentName, renderTime) {
    if (!this.metrics.componentRenderTimes[componentName]) {
      this.metrics.componentRenderTimes[componentName] = [];
    }

    this.metrics.componentRenderTimes[componentName].push({
      time: renderTime,
      timestamp: Date.now()
    });

    // Keep only last 10 measurements
    if (this.metrics.componentRenderTimes[componentName].length > 10) {
      this.metrics.componentRenderTimes[componentName].shift();
    }

    this.sendMetric(`component_render_${componentName}`, renderTime);
  }

  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {number} duration - Call duration in ms
   * @param {boolean} success - Whether the call was successful
   */
  trackApiCall(endpoint, duration, success = true) {
    const key = endpoint.replace(/\//g, '_').replace(/^_+|_+$/g, '');

    if (!this.metrics.apiCallTimes[key]) {
      this.metrics.apiCallTimes[key] = [];
    }

    this.metrics.apiCallTimes[key].push({
      duration,
      success,
      timestamp: Date.now()
    });

    // Keep only last 20 measurements
    if (this.metrics.apiCallTimes[key].length > 20) {
      this.metrics.apiCallTimes[key].shift();
    }

    this.sendMetric(`api_call_${key}`, duration, { success });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.metrics.memoryUsage.push(usage);

      // Keep only last 50 measurements
      if (this.metrics.memoryUsage.length > 50) {
        this.metrics.memoryUsage.shift();
      }

      // Send memory usage every 30 seconds
      if (this.metrics.memoryUsage.length % 30 === 0) {
        this.sendMetric('memory_usage', usage.used / usage.total);
      }
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    const interactions = ['click', 'scroll', 'keydown', 'touchstart'];

    interactions.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        this.metrics.userInteractions.push({
          type: eventType,
          element: e.target.tagName,
          timestamp: Date.now()
        });

        // Keep only last 100 interactions
        if (this.metrics.userInteractions.length > 100) {
          this.metrics.userInteractions.shift();
        }
      }, { passive: true });
    });
  }

  /**
   * Track JavaScript errors
   */
  trackErrors() {
    window.addEventListener('error', (e) => {
      const error = {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.metrics.errors.push(error);

      // Send error to backend
      this.sendError(error);
    });

    window.addEventListener('unhandledrejection', (e) => {
      const error = {
        message: `Unhandled promise rejection: ${e.reason}`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.metrics.errors.push(error);
      this.sendError(error);
    });
  }

  /**
   * Track bundle size (approximate)
   */
  trackBundleSize() {
    // This is a rough estimate - in production, you'd get this from build tools
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      let totalSize = 0;

      resources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
        }
      });

      this.metrics.bundleSize = totalSize;
      this.sendMetric('bundle_size', totalSize);
    }
  }

  /**
   * Send metric to backend
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  async sendMetric(name, value, metadata = {}) {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
          ...metadata
        })
      });
    } catch (error) {
      console.warn('Failed to send metric:', error);
    }
  }

  /**
   * Send error to backend
   * @param {Object} error - Error object
   */
  async sendError(error) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          sessionId: this.getSessionId()
        })
      });
    } catch (err) {
      console.warn('Failed to send error:', err);
    }
  }

  /**
   * Get or create session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('santa_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('santa_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get current metrics summary
   * @returns {Object} Metrics summary
   */
  getMetricsSummary() {
    return {
      pageLoadTime: this.metrics.pageLoadTime,
      averageComponentRenderTime: this.calculateAverageRenderTime(),
      averageApiCallTime: this.calculateAverageApiTime(),
      errorCount: this.metrics.errors.length,
      memoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1],
      bundleSize: this.metrics.bundleSize,
      userInteractionsCount: this.metrics.userInteractions.length
    };
  }

  /**
   * Calculate average component render time
   * @returns {number} Average render time
   */
  calculateAverageRenderTime() {
    const allTimes = Object.values(this.metrics.componentRenderTimes).flat();
    if (allTimes.length === 0) return 0;

    const sum = allTimes.reduce((acc, item) => acc + item.time, 0);
    return sum / allTimes.length;
  }

  /**
   * Calculate average API call time
   * @returns {number} Average API call time
   */
  calculateAverageApiTime() {
    const allTimes = Object.values(this.metrics.apiCallTimes).flat();
    if (allTimes.length === 0) return 0;

    const sum = allTimes.reduce((acc, item) => acc + item.duration, 0);
    return sum / allTimes.length;
  }

  /**
   * Performance monitoring HOC for components
   * @param {React.Component} WrappedComponent - Component to monitor
   * @param {string} componentName - Name for monitoring
   * @returns {React.Component} Monitored component
   */
  monitorComponent(WrappedComponent, componentName) {
    return React.forwardRef((props, ref) => {
      const startTime = React.useRef(performance.now());

      React.useEffect(() => {
        const renderTime = performance.now() - startTime.current;
        this.trackComponentRender(componentName, renderTime);
      });

      return <WrappedComponent {...props} ref={ref} />;
    });
  }
}

// Create singleton instance
const frontendMonitor = new FrontendMonitor();

export default frontendMonitor;

// Export individual functions for convenience
export const trackApiCall = (endpoint, duration, success) =>
  frontendMonitor.trackApiCall(endpoint, duration, success);

export const trackComponentRender = (componentName, renderTime) =>
  frontendMonitor.trackComponentRender(componentName, renderTime);

export const getMetricsSummary = () =>
  frontendMonitor.getMetricsSummary();

export const monitorComponent = (WrappedComponent, componentName) =>
  frontendMonitor.monitorComponent(WrappedComponent, componentName);