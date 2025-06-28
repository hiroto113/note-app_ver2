import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	return {}; // No data needed for new category page
};
