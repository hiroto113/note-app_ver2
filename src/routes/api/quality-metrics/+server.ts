import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { qualityMetricsService } from '$lib/server/quality-metrics';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const branch = url.searchParams.get('branch') || 'main';
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		const filters: any = { branch, limit };

		if (startDate && endDate) {
			filters.dateRange = {
				start: new Date(startDate),
				end: new Date(endDate)
			};
		}

		const metrics = await qualityMetricsService.getMetrics(filters);

		return json({
			success: true,
			data: metrics
		});
	} catch (error) {
		console.error('Failed to fetch quality metrics:', error);
		return json({ success: false, error: 'Failed to fetch quality metrics' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		// Add timestamp if not provided
		if (!data.timestamp) {
			data.timestamp = new Date();
		}

		// Generate ID if not provided
		if (!data.id) {
			data.id = `${data.branch}-${data.commitHash}-${Date.now()}`;
		}

		const result = await qualityMetricsService.saveMetrics(data);

		return json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Failed to save quality metrics:', error);
		return json({ success: false, error: 'Failed to save quality metrics' }, { status: 500 });
	}
};
