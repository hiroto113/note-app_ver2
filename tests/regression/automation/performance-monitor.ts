import { performance } from 'perf_hooks';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Performance Monitoring for Regression Tests
 * 
 * Provides detailed performance tracking and analysis:
 * - Test execution time monitoring
 * - Memory usage tracking
 * - Database operation counting
 * - Resource utilization analysis
 * - Performance trend detection
 * - Alerting for performance degradation
 */

export interface PerformanceMetrics {
	testName: string;
	startTime: number;
	endTime: number;
	duration: number;
	memoryUsage: {
		heapUsed: number;
		heapTotal: number;
		external: number;
		rss: number;
	};
	cpuUsage: {
		user: number;
		system: number;
	};
	databaseMetrics: {
		queryCount: number;
		totalQueryTime: number;
		slowQueries: number;
		connectionCount: number;
	};
	resourceMetrics: {
		fileOperations: number;
		networkRequests: number;
		cacheHits: number;
		cacheMisses: number;
	};
}

export interface PerformanceTrend {
	testName: string;
	measurements: PerformanceMetrics[];
	trend: 'improving' | 'stable' | 'degrading' | 'critical';
	averageDuration: number;
	variability: number;
	lastChange: number; // percentage change from previous run
}

export interface PerformanceAlert {
	type: 'duration' | 'memory' | 'database' | 'resource';
	severity: 'low' | 'medium' | 'high' | 'critical';
	testName: string;
	message: string;
	threshold: number;
	actualValue: number;
	timestamp: Date;
}

export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private activeMetrics: Map<string, Partial<PerformanceMetrics>> = new Map();
	private historicalData: Map<string, PerformanceMetrics[]> = new Map();
	private alerts: PerformanceAlert[] = [];
	private readonly dataDirectory = 'tests/regression/performance-data';

	// Performance thresholds
	private readonly thresholds = {
		duration: {
			warning: 2000,  // 2 seconds
			critical: 5000  // 5 seconds
		},
		memory: {
			warning: 100 * 1024 * 1024,   // 100MB
			critical: 500 * 1024 * 1024   // 500MB
		},
		queryTime: {
			warning: 1000,  // 1 second
			critical: 3000  // 3 seconds
		},
		queryCount: {
			warning: 50,
			critical: 100
		}
	};

	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	/**
	 * Start monitoring a test
	 */
	startMonitoring(testName: string): void {
		const startTime = performance.now();
		const memoryUsage = process.memoryUsage();
		const cpuUsage = process.cpuUsage();

		this.activeMetrics.set(testName, {
			testName,
			startTime,
			memoryUsage: {
				heapUsed: memoryUsage.heapUsed,
				heapTotal: memoryUsage.heapTotal,
				external: memoryUsage.external,
				rss: memoryUsage.rss
			},
			cpuUsage: {
				user: cpuUsage.user,
				system: cpuUsage.system
			},
			databaseMetrics: {
				queryCount: 0,
				totalQueryTime: 0,
				slowQueries: 0,
				connectionCount: 0
			},
			resourceMetrics: {
				fileOperations: 0,
				networkRequests: 0,
				cacheHits: 0,
				cacheMisses: 0
			}
		});
	}

	/**
	 * Stop monitoring and calculate final metrics
	 */
	stopMonitoring(testName: string): PerformanceMetrics | null {
		const activeMetric = this.activeMetrics.get(testName);
		if (!activeMetric || !activeMetric.startTime) {
			return null;
		}

		const endTime = performance.now();
		const duration = endTime - activeMetric.startTime;
		const finalMemoryUsage = process.memoryUsage();
		const finalCpuUsage = process.cpuUsage();

		const metrics: PerformanceMetrics = {
			...activeMetric as PerformanceMetrics,
			endTime,
			duration,
			memoryUsage: {
				heapUsed: finalMemoryUsage.heapUsed,
				heapTotal: finalMemoryUsage.heapTotal,
				external: finalMemoryUsage.external,
				rss: finalMemoryUsage.rss
			},
			cpuUsage: {
				user: finalCpuUsage.user - (activeMetric.cpuUsage?.user || 0),
				system: finalCpuUsage.system - (activeMetric.cpuUsage?.system || 0)
			}
		};

		// Store historical data
		if (!this.historicalData.has(testName)) {
			this.historicalData.set(testName, []);
		}
		const history = this.historicalData.get(testName)!;
		history.push(metrics);

		// Keep only last 100 measurements
		if (history.length > 100) {
			history.shift();
		}

		// Check for performance alerts
		this.checkPerformanceThresholds(metrics);

		this.activeMetrics.delete(testName);
		return metrics;
	}

	/**
	 * Record database operation
	 */
	recordDatabaseOperation(testName: string, queryTime: number, isSlowQuery: boolean = false): void {
		const metrics = this.activeMetrics.get(testName);
		if (metrics && metrics.databaseMetrics) {
			metrics.databaseMetrics.queryCount++;
			metrics.databaseMetrics.totalQueryTime += queryTime;
			if (isSlowQuery) {
				metrics.databaseMetrics.slowQueries++;
			}
		}
	}

	/**
	 * Record resource operation
	 */
	recordResourceOperation(testName: string, type: 'file' | 'network' | 'cache-hit' | 'cache-miss'): void {
		const metrics = this.activeMetrics.get(testName);
		if (metrics && metrics.resourceMetrics) {
			switch (type) {
				case 'file':
					metrics.resourceMetrics.fileOperations++;
					break;
				case 'network':
					metrics.resourceMetrics.networkRequests++;
					break;
				case 'cache-hit':
					metrics.resourceMetrics.cacheHits++;
					break;
				case 'cache-miss':
					metrics.resourceMetrics.cacheMisses++;
					break;
			}
		}
	}

	/**
	 * Check performance thresholds and generate alerts
	 */
	private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
		// Duration threshold check
		if (metrics.duration > this.thresholds.duration.critical) {
			this.addAlert({
				type: 'duration',
				severity: 'critical',
				testName: metrics.testName,
				message: `Test execution time exceeded critical threshold`,
				threshold: this.thresholds.duration.critical,
				actualValue: metrics.duration,
				timestamp: new Date()
			});
		} else if (metrics.duration > this.thresholds.duration.warning) {
			this.addAlert({
				type: 'duration',
				severity: 'medium',
				testName: metrics.testName,
				message: `Test execution time exceeded warning threshold`,
				threshold: this.thresholds.duration.warning,
				actualValue: metrics.duration,
				timestamp: new Date()
			});
		}

		// Memory threshold check
		if (metrics.memoryUsage.heapUsed > this.thresholds.memory.critical) {
			this.addAlert({
				type: 'memory',
				severity: 'critical',
				testName: metrics.testName,
				message: `Memory usage exceeded critical threshold`,
				threshold: this.thresholds.memory.critical,
				actualValue: metrics.memoryUsage.heapUsed,
				timestamp: new Date()
			});
		} else if (metrics.memoryUsage.heapUsed > this.thresholds.memory.warning) {
			this.addAlert({
				type: 'memory',
				severity: 'medium',
				testName: metrics.testName,
				message: `Memory usage exceeded warning threshold`,
				threshold: this.thresholds.memory.warning,
				actualValue: metrics.memoryUsage.heapUsed,
				timestamp: new Date()
			});
		}

		// Database performance check
		if (metrics.databaseMetrics.totalQueryTime > this.thresholds.queryTime.critical) {
			this.addAlert({
				type: 'database',
				severity: 'critical',
				testName: metrics.testName,
				message: `Database query time exceeded critical threshold`,
				threshold: this.thresholds.queryTime.critical,
				actualValue: metrics.databaseMetrics.totalQueryTime,
				timestamp: new Date()
			});
		}

		if (metrics.databaseMetrics.queryCount > this.thresholds.queryCount.critical) {
			this.addAlert({
				type: 'database',
				severity: 'high',
				testName: metrics.testName,
				message: `Database query count exceeded critical threshold`,
				threshold: this.thresholds.queryCount.critical,
				actualValue: metrics.databaseMetrics.queryCount,
				timestamp: new Date()
			});
		}
	}

	/**
	 * Add performance alert
	 */
	private addAlert(alert: PerformanceAlert): void {
		this.alerts.push(alert);
		
		// Log alert immediately
		const severityEmoji = {
			low: '🟡',
			medium: '🟠',
			high: '🔴',
			critical: '🚨'
		};
		
		console.warn(`${severityEmoji[alert.severity]} Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
		console.warn(`  Test: ${alert.testName}`);
		console.warn(`  Threshold: ${alert.threshold}, Actual: ${alert.actualValue.toFixed(2)}`);
	}

	/**
	 * Analyze performance trends
	 */
	analyzePerformanceTrends(): PerformanceTrend[] {
		const trends: PerformanceTrend[] = [];

		this.historicalData.forEach((measurements, testName) => {
			if (measurements.length < 2) {
				return; // Need at least 2 measurements for trend analysis
			}

			const durations = measurements.map(m => m.duration);
			const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
			
			// Calculate variability (standard deviation)
			const variance = durations.reduce((acc, duration) => 
				acc + Math.pow(duration - averageDuration, 2), 0) / durations.length;
			const variability = Math.sqrt(variance);

			// Calculate trend
			const recentMeasurements = measurements.slice(-5); // Last 5 measurements
			const oldMeasurements = measurements.slice(-10, -5); // Previous 5 measurements
			
			let trend: 'improving' | 'stable' | 'degrading' | 'critical' = 'stable';
			let lastChange = 0;

			if (recentMeasurements.length > 0 && oldMeasurements.length > 0) {
				const recentAvg = recentMeasurements.reduce((a, b) => a + b.duration, 0) / recentMeasurements.length;
				const oldAvg = oldMeasurements.reduce((a, b) => a + b.duration, 0) / oldMeasurements.length;
				
				lastChange = ((recentAvg - oldAvg) / oldAvg) * 100;

				if (lastChange < -10) trend = 'improving';
				else if (lastChange > 25) trend = 'critical';
				else if (lastChange > 10) trend = 'degrading';
				else trend = 'stable';
			}

			trends.push({
				testName,
				measurements,
				trend,
				averageDuration,
				variability,
				lastChange
			});
		});

		return trends;
	}

	/**
	 * Get current alerts
	 */
	getAlerts(): PerformanceAlert[] {
		return [...this.alerts];
	}

	/**
	 * Clear alerts
	 */
	clearAlerts(): void {
		this.alerts = [];
	}

	/**
	 * Generate performance summary report
	 */
	generateSummaryReport(): {
		totalTests: number;
		averageTestDuration: number;
		slowestTest: { name: string; duration: number };
		fastestTest: { name: string; duration: number };
		memoryStats: { average: number; peak: number };
		alertSummary: Record<string, number>;
		trends: PerformanceTrend[];
	} {
		const allMetrics: PerformanceMetrics[] = [];
		this.historicalData.forEach(measurements => {
			allMetrics.push(...measurements);
		});

		if (allMetrics.length === 0) {
			return {
				totalTests: 0,
				averageTestDuration: 0,
				slowestTest: { name: '', duration: 0 },
				fastestTest: { name: '', duration: 0 },
				memoryStats: { average: 0, peak: 0 },
				alertSummary: {},
				trends: []
			};
		}

		const durations = allMetrics.map(m => m.duration);
		const averageTestDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

		const slowestMetric = allMetrics.reduce((prev, current) => 
			prev.duration > current.duration ? prev : current);
		const fastestMetric = allMetrics.reduce((prev, current) => 
			prev.duration < current.duration ? prev : current);

		const memoryUsages = allMetrics.map(m => m.memoryUsage.heapUsed);
		const averageMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
		const peakMemory = Math.max(...memoryUsages);

		const alertSummary: Record<string, number> = {};
		this.alerts.forEach(alert => {
			alertSummary[alert.severity] = (alertSummary[alert.severity] || 0) + 1;
		});

		return {
			totalTests: new Set(allMetrics.map(m => m.testName)).size,
			averageTestDuration,
			slowestTest: { name: slowestMetric.testName, duration: slowestMetric.duration },
			fastestTest: { name: fastestMetric.testName, duration: fastestMetric.duration },
			memoryStats: { average: averageMemory, peak: peakMemory },
			alertSummary,
			trends: this.analyzePerformanceTrends()
		};
	}

	/**
	 * Save performance data to disk
	 */
	async savePerformanceData(): Promise<void> {
		try {
			await mkdir(this.dataDirectory, { recursive: true });

			// Save historical data
			const historicalDataPath = join(this.dataDirectory, 'historical-performance.json');
			const historicalDataObj: Record<string, PerformanceMetrics[]> = {};
			this.historicalData.forEach((value, key) => {
				historicalDataObj[key] = value;
			});
			await writeFile(historicalDataPath, JSON.stringify(historicalDataObj, null, 2));

			// Save current alerts
			const alertsPath = join(this.dataDirectory, 'performance-alerts.json');
			await writeFile(alertsPath, JSON.stringify(this.alerts, null, 2));

			// Save summary report
			const summaryPath = join(this.dataDirectory, 'performance-summary.json');
			const summary = this.generateSummaryReport();
			await writeFile(summaryPath, JSON.stringify(summary, null, 2));

			console.log(`📊 Performance data saved to ${this.dataDirectory}`);
		} catch (error) {
			console.error('Failed to save performance data:', error);
		}
	}

	/**
	 * Load historical performance data
	 */
	async loadPerformanceData(): Promise<void> {
		try {
			const historicalDataPath = join(this.dataDirectory, 'historical-performance.json');
			const data = await readFile(historicalDataPath, 'utf-8');
			const historicalDataObj = JSON.parse(data);

			this.historicalData.clear();
			Object.entries(historicalDataObj).forEach(([key, value]) => {
				this.historicalData.set(key, value as PerformanceMetrics[]);
			});

			console.log(`📊 Loaded historical performance data for ${this.historicalData.size} tests`);
		} catch (error) {
			console.log('No historical performance data found (this is normal for first run)');
		}
	}
}

// Helper function to wrap test functions with performance monitoring
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
	testName: string,
	testFunction: T
): T {
	return ((...args: any[]) => {
		const monitor = PerformanceMonitor.getInstance();
		monitor.startMonitoring(testName);
		
		try {
			const result = testFunction(...args);
			
			// Handle async functions
			if (result && typeof result.then === 'function') {
				return result.finally(() => {
					monitor.stopMonitoring(testName);
				});
			} else {
				monitor.stopMonitoring(testName);
				return result;
			}
		} catch (error) {
			monitor.stopMonitoring(testName);
			throw error;
		}
	}) as T;
}