import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { qualityMetricsService } from '$lib/server/quality-metrics';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const branch = url.searchParams.get('branch') || 'main';
		
		const trends = await qualityMetricsService.getQualityTrends(branch);
		
		return json({
			success: true,
			data: trends
		});
	} catch (error) {
		console.error('Failed to fetch trends:', error);
		return json(
			{ success: false, error: 'Failed to fetch trends' },
			{ status: 500 }
		);
	}
};
