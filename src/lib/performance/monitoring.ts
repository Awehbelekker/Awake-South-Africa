/**
 * Performance Monitoring Utilities
 * Track and report web vitals and performance metrics
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: any[];
}

/**
 * Send metrics to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify(metric);
  
  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  } else {
    fetch('/api/analytics', {
      body,
      method: 'POST',
      keepalive: true,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }
}

/**
 * Initialize web vitals tracking
 */
export function initPerformanceMonitoring() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Track custom performance metrics
 */
export function trackPerformance(name: string, value: number) {
  const metric: Metric = {
    id: `custom-${Date.now()}`,
    name,
    value,
    rating: 'good',
    delta: 0,
    entries: [],
  };

  sendToAnalytics(metric);
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    trackPerformance(name, duration);
  }
}
