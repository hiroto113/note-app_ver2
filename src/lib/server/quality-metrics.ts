import { desc, eq, and, gte, lte } from 'drizzle-orm';
import { qualityMetrics, type QualityMetrics, type NewQualityMetrics } from './db/schema';
import { db } from './db';

// Re-export types for components
export type { QualityMetrics, NewQualityMetrics } from './db/schema';

export interface QualityMetricsFilters {
	limit?: number;
	branch?: string;
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface QualityTrend {
	metric: string;
	current: number;
	previous: number;
	change: number;
	changePercent: number;
	trend: 'up' | 'down' | 'stable';
}

export class QualityMetricsService {
	/**
	 * Save quality metrics to database
	 */
	async saveMetrics(metrics: NewQualityMetrics): Promise<QualityMetrics> {
		const [result] = await db.insert(qualityMetrics).values(metrics).returning();
		return result;
	}

	/**
	 * Get quality metrics with optional filters
	 */
	async getMetrics(filters: QualityMetricsFilters = {}): Promise<QualityMetrics[]> {
		let query = db.select().from(qualityMetrics);

		// Apply filters
		const conditions = [];

		if (filters.branch) {
			conditions.push(eq(qualityMetrics.branch, filters.branch));
		}

		if (filters.dateRange) {
			conditions.push(
				and(
					gte(qualityMetrics.timestamp, filters.dateRange.start),
					lte(qualityMetrics.timestamp, filters.dateRange.end)
				)
			);
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		const result = query
			.orderBy(desc(qualityMetrics.timestamp))
			.limit(filters.limit || 50);

		return await result;
	}

	/**
	 * Get the latest quality metrics
	 */
	async getLatestMetrics(branch?: string): Promise<QualityMetrics | null> {
		let query = db.select().from(qualityMetrics);

		if (branch) {
			query = query.where(eq(qualityMetrics.branch, branch));
		}

		const result = await query.orderBy(desc(qualityMetrics.timestamp)).limit(1);

		return result[0] || null;
	}

	/**
	 * Get quality trends by comparing latest with previous metrics
	 */
	async getQualityTrends(branch?: string): Promise<QualityTrend[]> {
		const latest = await this.getLatestMetrics(branch);
		if (!latest) return [];

		const previous = await this.getPreviousMetrics(latest.id, branch);
		if (!previous) return [];

		const trends: QualityTrend[] = [];

		// Lighthouse Performance
		if (latest.lighthousePerformance && previous.lighthousePerformance) {
			trends.push(
				this.calculateTrend(
					'Lighthouse Performance',
					latest.lighthousePerformance,
					previous.lighthousePerformance
				)
			);
		}

		// Test Coverage (using unit test coverage as example)
		if (latest.testUnitCoverage && previous.testUnitCoverage) {
			trends.push(
				this.calculateTrend(
					'Test Coverage',
					latest.testUnitCoverage / 100,
					previous.testUnitCoverage / 100
				)
			);
		}

		// Bundle Size (reverse trend - smaller is better)
		if (latest.bundleSize && previous.bundleSize) {
			const trend = this.calculateTrend(
				'Bundle Size',
				latest.bundleSize,
				previous.bundleSize
			);
			// Reverse the trend direction for bundle size
			trend.trend = trend.trend === 'up' ? 'down' : trend.trend === 'down' ? 'up' : 'stable';
			trends.push(trend);
		}

		// Load Time (reverse trend - faster is better)
		if (latest.loadTime && previous.loadTime) {
			const trend = this.calculateTrend('Load Time', latest.loadTime, previous.loadTime);
			// Reverse the trend direction for load time
			trend.trend = trend.trend === 'up' ? 'down' : trend.trend === 'down' ? 'up' : 'stable';
			trends.push(trend);
		}

		return trends;
	}

	/**
	 * Get metrics for dashboard overview
	 */
	async getDashboardOverview(branch?: string): Promise<{
		latest: QualityMetrics | null;
		trends: QualityTrend[];
		history: QualityMetrics[];
	}> {
		const [latest, trends, history] = await Promise.all([
			this.getLatestMetrics(branch),
			this.getQualityTrends(branch),
			this.getMetrics({ limit: 30, branch })
		]);

		return { latest, trends, history };
	}

	/**
	 * Get aggregated statistics
	 */
	async getStatistics(branch?: string): Promise<{
		averageLighthouseScore: number;
		testSuccessRate: number;
		averageLoadTime: number;
		trendsCount: {
			improving: number;
			declining: number;
			stable: number;
		};
	}> {
		const metrics = await this.getMetrics({ limit: 10, branch });

		if (metrics.length === 0) {
			return {
				averageLighthouseScore: 0,
				testSuccessRate: 0,
				averageLoadTime: 0,
				trendsCount: { improving: 0, declining: 0, stable: 0 }
			};
		}

		// Calculate averages
		const avgLighthouse =
			metrics.reduce((sum, m) => {
				const scores = [
					m.lighthousePerformance,
					m.lighthouseAccessibility,
					m.lighthouseBestPractices,
					m.lighthouseSeo
				].filter(Boolean);
				return (
					sum +
					(scores.length > 0 ? scores.reduce((a, b) => a! + b!, 0)! / scores.length : 0)
				);
			}, 0) / metrics.length;

		const avgTestSuccess =
			metrics.reduce((sum, m) => {
				const total =
					(m.testUnitTotal || 0) + (m.testIntegrationTotal || 0) + (m.testE2eTotal || 0);
				const passed =
					(m.testUnitPassed || 0) +
					(m.testIntegrationPassed || 0) +
					(m.testE2ePassed || 0);
				return sum + (total > 0 ? (passed / total) * 100 : 100);
			}, 0) / metrics.length;

		const avgLoadTime = metrics.reduce((sum, m) => sum + (m.loadTime || 0), 0) / metrics.length;

		// Get trends count
		const trends = await this.getQualityTrends(branch);
		const trendsCount = trends.reduce(
			(count, trend) => {
				if (trend.trend === 'up') count.improving++;
				else if (trend.trend === 'down') count.declining++;
				else count.stable++;
				return count;
			},
			{ improving: 0, declining: 0, stable: 0 }
		);

		return {
			averageLighthouseScore: Math.round(avgLighthouse),
			testSuccessRate: Math.round(avgTestSuccess * 100) / 100,
			averageLoadTime: Math.round(avgLoadTime),
			trendsCount
		};
	}

	/**
	 * Private method to get previous metrics
	 */
	private async getPreviousMetrics(
		currentId: string,
		branch?: string
	): Promise<QualityMetrics | null> {
		// Get all metrics for the branch, ordered by timestamp
		let query = db.select().from(qualityMetrics);

		if (branch) {
			query = query.where(eq(qualityMetrics.branch, branch));
		}

		const allMetrics = await query.orderBy(desc(qualityMetrics.timestamp));

		// Find the current metric index
		const currentIndex = allMetrics.findIndex((m: QualityMetrics) => m.id === currentId);

		// Return the previous metric (next in descending order)
		if (currentIndex >= 0 && currentIndex + 1 < allMetrics.length) {
			return allMetrics[currentIndex + 1];
		}

		return null;
	}

	/**
	 * Private method to calculate trend
	 */
	private calculateTrend(metric: string, current: number, previous: number): QualityTrend {
		const change = current - previous;
		const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

		let trend: 'up' | 'down' | 'stable' = 'stable';
		if (Math.abs(changePercent) > 2) {
			// 2% threshold for significant change
			trend = change > 0 ? 'up' : 'down';
		}

		return {
			metric,
			current,
			previous,
			change,
			changePercent: Math.round(changePercent * 100) / 100,
			trend
		};
	}
}

// Singleton instance
export const qualityMetricsService = new QualityMetricsService();
