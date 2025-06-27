import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts, postsToCategories, users, categories } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth';
import { generateSlug } from '$lib/utils/slug';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/admin/posts - Get all posts (including drafts)
export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	
	try {
		const allPosts = await db
			.select({
				id: posts.id,
				title: posts.title,
				slug: posts.slug,
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
			.orderBy(desc(posts.createdAt));
		
		return json({ posts: allPosts });
	} catch (error) {
		console.error('Error fetching posts:', error);
		return json({ error: 'Failed to fetch posts' }, { status: 500 });
	}
};

// POST /api/admin/posts - Create new post
export const POST: RequestHandler = async (event) => {
	const user = await requireAuth(event);
	
	try {
		const { title, content, excerpt, status, categoryIds } = await event.request.json();
		
		if (!title || !content) {
			return json({ error: 'Title and content are required' }, { status: 400 });
		}
		
		// Generate unique slug
		let baseSlug = generateSlug(title);
		let slug = baseSlug;
		let counter = 1;
		
		// Check if slug exists and make it unique
		while (true) {
			const existingPost = await db
				.select({ id: posts.id })
				.from(posts)
				.where(eq(posts.slug, slug))
				.get();
			
			if (!existingPost) break;
			
			slug = `${baseSlug}-${counter}`;
			counter++;
		}
		
		const now = new Date();
		
		// Create post
		const result = await db
			.insert(posts)
			.values({
				title,
				slug,
				content,
				excerpt: excerpt || content.substring(0, 200) + '...',
				status: (status as 'draft' | 'published') || 'draft',
				publishedAt: status === 'published' ? now : null,
				userId: user.id!,
				createdAt: now,
				updatedAt: now
			})
			.returning({ id: posts.id });
		
		const postId = result[0].id;
		
		// Add categories if provided
		if (categoryIds && categoryIds.length > 0) {
			const categoryInserts = categoryIds.map((categoryId: number) => ({
				postId,
				categoryId
			}));
			
			await db.insert(postsToCategories).values(categoryInserts);
		}
		
		return json({ id: postId, slug }, { status: 201 });
	} catch (error) {
		console.error('Error creating post:', error);
		return json({ error: 'Failed to create post' }, { status: 500 });
	}
};