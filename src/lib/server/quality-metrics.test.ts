import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NewQualityMetrics } from './db/schema';

// Mock the drizzle database - create mock factory function
vi.mock('./db', () => {
	const mockDb = {
		insert: vi.fn(),
		select: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		returning: vi.fn(),
		values: vi.fn()
	};
	return {
		db: mockDb
	};
});

// Now import the service after mocking
import { QualityMetricsService, type QualityTrend } from './quality-metrics';
import { db } from './db';

let service: QualityMetricsService;
let mockDb: {
	insert: ReturnType<typeof vi.fn>;
	select: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	orderBy: ReturnType<typeof vi.fn>;
	limit: ReturnType<typeof vi.fn>;
	returning: ReturnType<typeof vi.fn>;
	values: ReturnType<typeof vi.fn>;
};

describe('QualityMetricsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		service = new QualityMetricsService();
		mockDb = db;

		// Setup mock chain for query builder pattern
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([
					{
						id: 'test-1',
						timestamp: new Date(),
						commitHash: 'abc123',
						branch: 'main'
					}
				])
			})
		});

		mockDb.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([])
			})
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('saveMetrics', () => {
		it('should save metrics successfully', async () => {
			const mockMetrics: NewQualityMetrics = {
				id: 'test-1',
				timestamp: new Date(),
				commitHash: 'abc123',
				branch: 'main',
				lighthousePerformance: 85,
				lighthouseAccessibility: 92,
				createdAt: new Date()
			};

			const result = await service.saveMetrics(mockMetrics);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(result).toBeDefined();
		});
	});

	describe('getMetrics', () => {
		it('should return empty array by default', async () => {
			const metrics = await service.getMetrics();
			expect(metrics).toEqual([]);
		});

		it('should filter by branch', async () => {
			await service.getMetrics({ branch: 'main' });
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should limit results', async () => {
			await service.getMetrics({ limit: 10 });
			expect(mockDb.select).toHaveBeenCalled();
		});
	});

	describe('getLatestMetrics', () => {
		it('should return null when no metrics exist', async () => {
			const result = await service.getLatestMetrics();
			expect(result).toBeNull();
		});

		it('should return latest metrics for branch', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 'test-1',
									timestamp: new Date(),
									commitHash: 'abc123',
									branch: 'main',
									lighthousePerformance: 85
								}
							])
						})
					})
				})
			});

			const result = await service.getLatestMetrics('main');
			expect(result).toBeDefined();
			if (result) {
				expect(result.branch).toBe('main');
			}
		});
	});

	describe('getDashboardOverview', () => {
		it('should return dashboard data structure', async () => {
			const result = await service.getDashboardOverview();

			expect(result).toHaveProperty('latest');
			expect(result).toHaveProperty('trends');
			expect(result).toHaveProperty('history');
		});
	});

	describe('getStatistics', () => {
		it('should return default statistics when no data', async () => {
			const result = await service.getStatistics();

			expect(result.averageLighthouseScore).toBe(0);
			expect(result.testSuccessRate).toBe(0);
			expect(result.averageLoadTime).toBe(0);
			expect(result.trendsCount).toEqual({ improving: 0, declining: 0, stable: 0 });
		});
	});

	describe('calculateTrend', () => {
		it('should calculate upward trend correctly', () => {
			// Access private method through type assertion
			const result = (
				service as unknown as {
					calculateTrend: (
						metric: string,
						current: number,
						previous: number
					) => QualityTrend;
				}
			).calculateTrend('Test Metric', 90, 80);

			expect(result.metric).toBe('Test Metric');
			expect(result.current).toBe(90);
			expect(result.previous).toBe(80);
			expect(result.change).toBe(10);
			expect(result.changePercent).toBe(12.5);
			expect(result.trend).toBe('up');
		});

		it('should calculate downward trend correctly', () => {
			const result = (
				service as unknown as {
					calculateTrend: (
						metric: string,
						current: number,
						previous: number
					) => QualityTrend;
				}
			).calculateTrend('Test Metric', 70, 80);

			expect(result.trend).toBe('down');
			expect(result.change).toBe(-10);
			expect(result.changePercent).toBe(-12.5);
		});

		it('should identify stable trend for small changes', () => {
			const result = (
				service as unknown as {
					calculateTrend: (
						metric: string,
						current: number,
						previous: number
					) => QualityTrend;
				}
			).calculateTrend('Test Metric', 81, 80);

			expect(result.trend).toBe('stable');
			expect(result.changePercent).toBe(1.25);
		});

		it('should handle zero previous value', () => {
			const result = (
				service as unknown as {
					calculateTrend: (
						metric: string,
						current: number,
						previous: number
					) => QualityTrend;
				}
			).calculateTrend('Test Metric', 80, 0);

			expect(result.changePercent).toBe(0);
			expect(result.trend).toBe('up');
		});
	});
});
