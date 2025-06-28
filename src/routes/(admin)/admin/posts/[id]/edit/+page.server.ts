import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const session = await locals.getSession();
	
	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}
	
	const postId = parseInt(params.id);
	if (isNaN(postId)) {
		throw error(400, 'Invalid post ID');
	}
	
	try {
		// Load post data and categories in parallel
		const [postResponse, categoriesResponse] = await Promise.all([
			fetch(`/api/admin/posts/${postId}`),
			fetch('/api/admin/categories')
		]);
		
		if (!postResponse.ok) {
			if (postResponse.status === 404) {
				throw error(404, 'Post not found');
			}
			const errorData = await postResponse.json();
			throw error(postResponse.status, errorData.error || 'Failed to fetch post');
		}
		
		const postData = await postResponse.json();
		
		let categories = [];
		if (categoriesResponse.ok) {
			const categoriesData = await categoriesResponse.json();
			categories = categoriesData.categories || [];
		}
		
		return {
			post: postData.post,
			categories
		};
	} catch (err) {
		console.error('Error loading post for edit:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load post');
	}
};