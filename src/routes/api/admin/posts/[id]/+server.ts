import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts, postsToCategories, users, categories } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/slug';
import { eq, and, ne } from 'drizzle-orm';
import { validatePost, createValidationErrorResponse } from '$lib/server/validation';
import type { RequestHandler } from './$types';

// GET /api/admin/posts/[id] - Get single post with categories
export const GET: RequestHandler = async ({ params }) => {
	const postId = parseInt(params.id);
	if (isNaN(postId)) {
		throw error(400, 'Invalid post ID');
	}

	try {
		// Get post details
		const post = await db
			.select({
				id: posts.id,
				title: posts.title,
				slug: posts.slug,
				content: posts.content,
				excerpt: posts.excerpt,
				status: posts.status,
				publishedAt: posts.publishedAt,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt,
				author: {
					id: users.id,
					username: users.username
				}
			})
			.from(posts)
			.leftJoin(users, eq(posts.userId, users.id))
			.where(eq(posts.id, postId))
			.get();

		if (!post) {
			throw error(404, 'Post not found');
		}

		// Get associated categories
		const postCategories = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug
			})
			.from(categories)
			.innerJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
			.where(eq(postsToCategories.postId, postId));

		return json({
			post: {
				...post,
				categories: postCategories
			}
		});
	} catch (err) {
		console.error('Error fetching post:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to fetch post' }, { status: 500 });
	}
};

// PUT /api/admin/posts/[id] - Update post
export const PUT: RequestHandler = async ({ params, request }) => {
	const postId = parseInt(params.id);
	if (isNaN(postId)) {
		throw error(400, 'Invalid post ID');
	}

	try {
		const postData = await request.json();
		const { title, content, excerpt, status, categoryIds } = postData;

		// バリデーション実行
		const validation = validatePost(postData);
		if (!validation.isValid) {
			return createValidationErrorResponse(validation.errors);
		}

		// Check if post exists
		const existingPost = await db
			.select({ id: posts.id, slug: posts.slug, publishedAt: posts.publishedAt })
			.from(posts)
			.where(eq(posts.id, postId))
			.get();

		if (!existingPost) {
			throw error(404, 'Post not found');
		}

		// Generate new slug if title changed
		let slug = existingPost.slug;
		const newSlug = generateSlug(title);

		if (newSlug !== existingPost.slug) {
			const baseSlug = newSlug;
			let counter = 1;
			slug = baseSlug;

			// Check if new slug exists (excluding current post)
			while (true) {
				const conflictingPost = await db
					.select({ id: posts.id })
					.from(posts)
					.where(and(eq(posts.slug, slug), ne(posts.id, postId)))
					.get();

				if (!conflictingPost) break;

				slug = `${baseSlug}-${counter}`;
				counter++;
			}
		}

		const now = new Date();

		// Update post
		await db
			.update(posts)
			.set({
				title,
				slug,
				content,
				excerpt: excerpt || content.substring(0, 200) + '...',
				status: (status as 'draft' | 'published') || 'draft',
				publishedAt: status === 'published' ? existingPost.publishedAt || now : null,
				updatedAt: now
			})
			.where(eq(posts.id, postId));

		// Update categories
		// First, remove existing categories
		await db.delete(postsToCategories).where(eq(postsToCategories.postId, postId));

		// Then add new categories if provided
		if (categoryIds && categoryIds.length > 0) {
			const categoryInserts = categoryIds.map((categoryId: number) => ({
				postId,
				categoryId
			}));

			await db.insert(postsToCategories).values(categoryInserts);
		}

		return json({ success: true, slug });
	} catch (err) {
		console.error('Error updating post:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to update post' }, { status: 500 });
	}
};

// DELETE /api/admin/posts/[id] - Delete post
export const DELETE: RequestHandler = async ({ params }) => {
	const postId = parseInt(params.id);
	if (isNaN(postId)) {
		throw error(400, 'Invalid post ID');
	}

	try {
		// Check if post exists
		const existingPost = await db
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.id, postId))
			.get();

		if (!existingPost) {
			throw error(404, 'Post not found');
		}

		// Delete post (categories will be deleted automatically due to foreign key cascade)
		await db.delete(posts).where(eq(posts.id, postId));

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting post:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to delete post' }, { status: 500 });
	}
};
