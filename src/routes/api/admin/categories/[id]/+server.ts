import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories, postsToCategories } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/admin/categories/[id] - Get single category with associated posts count
export const GET: RequestHandler = async (event) => {
	await requireAuth(event);

	const categoryId = parseInt(event.params.id);
	if (isNaN(categoryId)) {
		throw error(400, 'Invalid category ID');
	}

	try {
		// Get category details
		const category = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description,
				createdAt: categories.createdAt,
				updatedAt: categories.updatedAt
			})
			.from(categories)
			.where(eq(categories.id, categoryId))
			.get();

		if (!category) {
			throw error(404, 'Category not found');
		}

		// Get count of associated posts
		const postCount = await db
			.select({ count: postsToCategories.postId })
			.from(postsToCategories)
			.where(eq(postsToCategories.categoryId, categoryId));

		return json({
			category: {
				...category,
				postCount: postCount.length
			}
		});
	} catch (err) {
		console.error('Error fetching category:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to fetch category' }, { status: 500 });
	}
};
