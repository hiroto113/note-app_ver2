import type { PageServerLoad } from './$types';
import { qualityMetricsService } from '$lib/server/quality-metrics';

export const load: PageServerLoad = async () => {
	try {
		// Get dashboard data for main branch
		const [dashboard, statistics] = await Promise.all([
			qualityMetricsService.getDashboardOverview('main'),
			qualityMetricsService.getStatistics('main')
		]);

		return {
			dashboard,
			statistics
		};
	} catch (error) {
		console.error('Failed to load quality dashboard data:', error);
		
		// Return empty state on error
		return {
			dashboard: {
				latest: null,
				trends: [],
				history: []
			},
			statistics: {
				averageLighthouseScore: 0,
				testSuccessRate: 0,
				averageLoadTime: 0,
				trendsCount: { improving: 0, declining: 0, stable: 0 }
			}
		};
	}
};
