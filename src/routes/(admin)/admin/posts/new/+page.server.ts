import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Load categories for the form
		const response = await fetch('/api/admin/categories');

		if (!response.ok) {
			console.error('Failed to fetch categories, continuing without them');
			return {
				categories: []
			};
		}

		const data = await response.json();

		return {
			categories: data.categories || []
		};
	} catch (err) {
		console.error('Error loading categories:', err);
		return {
			categories: []
		};
	}
};
