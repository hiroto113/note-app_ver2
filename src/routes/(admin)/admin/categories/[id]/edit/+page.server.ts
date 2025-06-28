import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	const categoryId = parseInt(params.id);
	if (isNaN(categoryId)) {
		throw error(400, 'Invalid category ID');
	}

	try {
		const response = await fetch(`/api/admin/categories/${categoryId}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Category not found');
			}
			const errorData = await response.json();
			throw error(response.status, errorData.error || 'Failed to fetch category');
		}

		const data = await response.json();

		return {
			category: data.category
		};
	} catch (err) {
		console.error('Error loading category for edit:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load category');
	}
};
