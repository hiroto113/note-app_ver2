import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const response = await fetch('/api/admin/categories');

		if (!response.ok) {
			const errorData = await response.json();
			throw error(response.status, errorData.error || 'Failed to fetch categories');
		}

		const data = await response.json();

		return {
			categories: data.categories || []
		};
	} catch (err) {
		console.error('Error loading categories:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load categories');
	}
};
