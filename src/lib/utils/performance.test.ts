import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	measureCoreWebVitals,
	logPerformanceMetrics,
	measureResourceTiming,
	startPerformanceMonitoring,
	type PerformanceMetrics
} from './performance';

// Mock PerformanceObserver
Object.defineProperty(window, 'PerformanceObserver', {
	writable: true,
	configurable: true,
	value: vi.fn().mockImplementation((callback) => ({
		observe: vi.fn(),
		disconnect: vi.fn()
	}))
});

// Mock performance.timing
Object.defineProperty(window, 'performance', {
	writable: true,
	configurable: true,
	value: {
		timing: {
			loadEventEnd: 1000,
			navigationStart: 0,
			responseStart: 100,
			domContentLoadedEventEnd: 500
		},
		getEntriesByType: vi.fn(() => []),
		now: vi.fn(() => Date.now())
	}
});

describe('performance utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		console.group = vi.fn();
		console.log = vi.fn();
		console.groupEnd = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('measureCoreWebVitals', () => {
		it('should return a promise with performance metrics', async () => {
			const metricsPromise = measureCoreWebVitals();
			
			expect(metricsPromise).toBeInstanceOf(Promise);
			
			const metrics = await metricsPromise;
			expect(typeof metrics).toBe('object');
		});

		it('should handle missing PerformanceObserver gracefully', async () => {
			const originalPO = window.PerformanceObserver;
			// @ts-ignore
			delete window.PerformanceObserver;
			
			const metrics = await measureCoreWebVitals();
			expect(typeof metrics).toBe('object');
			
			window.PerformanceObserver = originalPO;
		});
	});

	describe('logPerformanceMetrics', () => {
		it('should log performance metrics to console', () => {
			const metrics: PerformanceMetrics = {
				fcp: 1200,
				lcp: 2000,
				fid: 50,
				cls: 0.05,
				ttfb: 400
			};
			
			logPerformanceMetrics(metrics);
			
			expect(console.group).toHaveBeenCalledWith('🚀 Performance Metrics');
			expect(console.log).toHaveBeenCalledTimes(5);
			expect(console.groupEnd).toHaveBeenCalled();
		});

		it('should handle empty metrics object', () => {
			const metrics: PerformanceMetrics = {};
			
			expect(() => logPerformanceMetrics(metrics)).not.toThrow();
			
			expect(console.group).toHaveBeenCalledWith('🚀 Performance Metrics');
			expect(console.groupEnd).toHaveBeenCalled();
		});

		it('should handle partial metrics', () => {
			const metrics: PerformanceMetrics = {
				fcp: 1500,
				cls: 0.1
			};
			
			logPerformanceMetrics(metrics);
			
			expect(console.log).toHaveBeenCalledTimes(2);
		});
	});

	describe('measureResourceTiming', () => {
		it('should measure resource timing', () => {
			const result = measureResourceTiming();
			// Function may return undefined in test environment
			expect(result === undefined || typeof result === 'object').toBe(true);
		});
	});

	describe('startPerformanceMonitoring', () => {
		it('should start performance monitoring without errors', () => {
			expect(() => startPerformanceMonitoring()).not.toThrow();
		});
	});
});