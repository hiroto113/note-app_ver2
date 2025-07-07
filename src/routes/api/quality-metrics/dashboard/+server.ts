import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { qualityMetricsService } from '$lib/server/quality-metrics';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const branch = url.searchParams.get('branch') || 'main';

		const [dashboard, statistics] = await Promise.all([
			qualityMetricsService.getDashboardOverview(branch),
			qualityMetricsService.getStatistics(branch)
		]);

		return json({
			success: true,
			data: {
				dashboard,
				statistics
			}
		});
	} catch (error) {
		console.error('Failed to fetch dashboard data:', error);
		return json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
	}
};
