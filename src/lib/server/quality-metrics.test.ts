import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QualityMetricsService } from './quality-metrics';
import type { NewQualityMetrics } from './db/schema';

// Mock Drizzle ORM
const mockDb = {
	insert: vi.fn(),
	select: vi.fn(),
	where: vi.fn(),
	orderBy: vi.fn(),
	limit: vi.fn(),
	returning: vi.fn(),
	values: vi.fn()
};

// Mock the database client
vi.mock('@libsql/client', () => ({
	createClient: vi.fn(() => mockDb)
}));

vi.mock('drizzle-orm/libsql', () => ({
	drizzle: vi.fn(() => mockDb)
}));

vi.mock('$env/static/private', () => ({
	DATABASE_URL: 'file:./test.db'
}));

const mockMetrics: NewQualityMetrics = {
	id: 'test-1',
	timestamp: new Date('2024-01-01'),
	commitHash: 'abc123',
	branch: 'main',
	lighthousePerformance: 85,
	lighthouseAccessibility: 92,
	lighthouseBestPractices: 88,
	lighthouseSeo: 95,
	testUnitCoverage: 7500, // 75%
	testUnitTotal: 100,
	testUnitPassed: 95,
	bundleSize: 512000, // 512KB
	loadTime: 1200
};

const mockSavedMetrics = {
	...mockMetrics,
	createdAt: new Date('2024-01-01')
};

describe('QualityMetricsService', () => {
	let service: QualityMetricsService;

	beforeEach(() => {
		service = new QualityMetricsService();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('saveMetrics', () => {
		it('should save metrics to database', async () => {
			// Setup mock chain
			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockSavedMetrics])
				})
			});

			const result = await service.saveMetrics(mockMetrics);

			expect(result).toEqual(mockSavedMetrics);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should handle save errors', async () => {
			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockRejectedValue(new Error('Database error'))
				})
			});

			await expect(service.saveMetrics(mockMetrics)).rejects.toThrow('Database error');
		});
	});

	describe('getMetrics', () => {
		it('should retrieve metrics with filters', async () => {
			// Setup mock chain
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockSavedMetrics])
						})
					})
				})
			});

			const result = await service.getMetrics({ branch: 'main', limit: 10 });

			expect(result).toEqual([mockSavedMetrics]);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should handle empty results', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([])
					})
				})
			});

			const result = await service.getMetrics();

			expect(result).toEqual([]);
		});
	});

	describe('getStatistics', () => {
		it('should calculate statistics from metrics', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockSavedMetrics])
					})
				})
			});

			// Mock getQualityTrends
			vi.spyOn(service, 'getQualityTrends').mockResolvedValue([
				{
					metric: 'Test',
					current: 85,
					previous: 80,
					change: 5,
					changePercent: 6.25,
					trend: 'up'
				}
			]);

			const result = await service.getStatistics('main');

			expect(result).toHaveProperty('averageLighthouseScore');
			expect(result).toHaveProperty('testSuccessRate');
			expect(result).toHaveProperty('averageLoadTime');
			expect(result).toHaveProperty('trendsCount');
			expect(result.trendsCount.improving).toBe(1);
		});

		it('should handle empty metrics', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([])
					})
				})
			});

			vi.spyOn(service, 'getQualityTrends').mockResolvedValue([]);

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
					calculateTrend: (metric: string, current: number, previous: number) => any;
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
					calculateTrend: (metric: string, current: number, previous: number) => any;
				}
			).calculateTrend('Test Metric', 70, 80);

			expect(result.trend).toBe('down');
			expect(result.change).toBe(-10);
			expect(result.changePercent).toBe(-12.5);
		});

		it('should identify stable trend for small changes', () => {
			const result = (
				service as unknown as {
					calculateTrend: (metric: string, current: number, previous: number) => any;
				}
			).calculateTrend('Test Metric', 81, 80);

			expect(result.trend).toBe('stable');
			expect(result.changePercent).toBe(1.25);
		});

		it('should handle zero previous value', () => {
			const result = (service as any).calculateTrend('Test Metric', 80, 0);

			expect(result.changePercent).toBe(0);
			expect(result.trend).toBe('up');
		});
	});
});
