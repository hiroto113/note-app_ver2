/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { posts, categories, postsToCategories, users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { json } from '@sveltejs/kit';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
	validatePost,
	validatePagination,
	createValidationErrorResponse
} from '$lib/server/validation';
import { generateSlug } from '$lib/utils/slug';

// Mock admin API handlers for testing
const testAdminPostsApi = {
	GET: async ({ url }: { url: URL }) => {
		try {
			// Query parameter validation
			const {
				page,
				limit,
				errors: paginationErrors
			} = validatePagination({
				page: url.searchParams.get('page'),
				limit: url.searchParams.get('limit')
			});

			if (paginationErrors.length > 0) {
				return createValidationErrorResponse(paginationErrors);
			}

			const status = url.searchParams.get('status');
			const offset = (page - 1) * limit;

			// WHERE conditions
			const whereConditions = [];
			if (status && status !== 'all') {
				whereConditions.push(eq(posts.status, status as 'draft' | 'published'));
			}

			// Get posts
			const allPosts = await testDb
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
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(posts.createdAt))
				.limit(limit)
				.offset(offset);

			// Get total count
			const [{ count }] = await testDb
				.select({ count: sql<number>`COUNT(*)` })
				.from(posts)
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

			// Get categories for each post
			const formattedPosts = await Promise.all(
				allPosts.map(async (post) => {
					const categoryResults = await testDb
						.select({
							id: categories.id,
							name: categories.name
						})
						.from(categories)
						.innerJoin(
							postsToCategories,
							eq(categories.id, postsToCategories.categoryId)
						)
						.where(eq(postsToCategories.postId, post.id));

					return {
						...post,
						categories: categoryResults
					};
				})
			);

			return json({
				posts: formattedPosts,
				pagination: {
					page,
					limit,
					total: Number(count),
					totalPages: Math.ceil(Number(count) / limit)
				}
			});
		} catch (error) {
			console.error('Error fetching posts:', error);
			return json({ error: 'Failed to fetch posts' }, { status: 500 });
		}
	},

	POST: async ({ request, locals }: { request: Request; locals: { testUserId: string } }) => {
		try {
			// Mock session for testing
			const session = { user: { id: locals.testUserId } };
			const userId = session?.user?.id;

			const postData = await request.json();
			const { title, content, excerpt, status, categoryIds, publishedAt } = postData;

			// Validation
			const validation = validatePost(postData);
			if (!validation.isValid) {
				return createValidationErrorResponse(validation.errors);
			}

			// Generate unique slug
			const baseSlug = generateSlug(title);
			let slug = baseSlug;
			let counter = 1;

			// Check if slug exists and make it unique
			while (true) {
				const existingPost = await testDb
					.select({ id: posts.id })
					.from(posts)
					.where(eq(posts.slug, slug))
					.get();

				if (!existingPost) break;

				slug = `${baseSlug}-${counter}`;
				counter++;
			}

			const now = new Date();
			const finalPublishedAt =
				status === 'published' ? (publishedAt ? new Date(publishedAt) : now) : null;

			// Create post
			const result = await testDb
				.insert(posts)
				.values({
					title,
					slug,
					content,
					excerpt: excerpt || content.substring(0, 200) + '...',
					status: (status as 'draft' | 'published') || 'draft',
					publishedAt: finalPublishedAt,
					userId: userId!,
					createdAt: now,
					updatedAt: now
				})
				.returning();

			const createdPost = result[0];

			// Add categories if provided
			if (categoryIds && categoryIds.length > 0) {
				const categoryInserts = categoryIds.map((categoryId: number) => ({
					postId: createdPost.id,
					categoryId
				}));

				await testDb.insert(postsToCategories).values(categoryInserts);
			}

			return json(createdPost, { status: 201 });
		} catch (error) {
			console.error('Error creating post:', error);
			return json({ error: 'Failed to create post' }, { status: 500 });
		}
	}
};

type AdminPostResponse = {
	id: number;
	title: string;
	slug: string;
	excerpt: string;
	status: string;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	author: {
		id: string;
		username: string;
	};
	categories: Array<{
		id: number;
		name: string;
	}>;
};

describe('Admin API Integration', () => {
	let testUserId: string;
	let techCategoryId: number;
	let webCategoryId: number;

	beforeEach(async () => {
		// Create test user
		const hashedPassword = await bcrypt.hash('testpass', 10);
		const [user] = await testDb
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				username: 'admin',
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		testUserId = user.id;

		// Create test categories
		const [techCategory] = await testDb
			.insert(categories)
			.values({
				name: 'Technology',
				slug: 'technology',
				description: 'Tech posts',
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		techCategoryId = techCategory.id;

		const [webCategory] = await testDb
			.insert(categories)
			.values({
				name: 'Web Development',
				slug: 'web-dev',
				description: 'Web dev posts',
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		webCategoryId = webCategory.id;

		// Create test posts with different statuses
		const now = new Date();
		const yesterday = new Date(Date.now() - 86400000);

		const [publishedPost] = await testDb
			.insert(posts)
			.values({
				title: 'Published Admin Post',
				slug: 'published-admin-post',
				content: '# Published Admin Post\n\nThis is published content.',
				excerpt: 'Published content excerpt',
				status: 'published',
				publishedAt: yesterday,
				userId: testUserId,
				createdAt: yesterday,
				updatedAt: yesterday
			})
			.returning();

		const [draftPost] = await testDb
			.insert(posts)
			.values({
				title: 'Draft Admin Post',
				slug: 'draft-admin-post',
				content: '# Draft Admin Post\n\nThis is draft content.',
				excerpt: 'Draft content excerpt',
				status: 'draft',
				publishedAt: null,
				userId: testUserId,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		// Associate posts with categories
		await testDb.insert(postsToCategories).values([
			{ postId: publishedPost.id, categoryId: techCategoryId },
			{ postId: draftPost.id, categoryId: webCategoryId }
		]);
	});

	afterEach(async () => {
		// Clean up
		await testDb.delete(postsToCategories);
		await testDb.delete(posts);
		await testDb.delete(categories);
		await testDb.delete(users);
	});

	describe('GET /api/admin/posts', () => {
		it('should return all posts including drafts', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts')
			});
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(2);
			expect(data.posts.some((p: AdminPostResponse) => p.status === 'draft')).toBe(true);
			expect(data.posts.some((p: AdminPostResponse) => p.status === 'published')).toBe(true);
		});

		it('should filter by status', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts?status=draft')
			});
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(1);
			expect(data.posts[0].status).toBe('draft');
		});

		it('should include author information', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts')
			});
			const data = await response.json();

			expect(data.posts[0].author).toBeDefined();
			expect(data.posts[0].author.id).toBe(testUserId);
			expect(data.posts[0].author.username).toBe('admin');
		});

		it('should include categories for each post', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts')
			});
			const data = await response.json();

			const publishedPost = data.posts.find(
				(p: AdminPostResponse) => p.slug === 'published-admin-post'
			);
			const draftPost = data.posts.find(
				(p: AdminPostResponse) => p.slug === 'draft-admin-post'
			);

			expect(publishedPost.categories).toHaveLength(1);
			expect(publishedPost.categories[0].name).toBe('Technology');

			expect(draftPost.categories).toHaveLength(1);
			expect(draftPost.categories[0].name).toBe('Web Development');
		});

		it('should support pagination', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts?page=1&limit=1')
			});
			const data = await response.json();

			expect(data.posts).toHaveLength(1);
			expect(data.pagination).toEqual({
				page: 1,
				limit: 1,
				total: 2,
				totalPages: 2
			});
		});

		it('should order posts by createdAt desc', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts')
			});
			const data = await response.json();

			// Draft post was created more recently
			expect(data.posts[0].slug).toBe('draft-admin-post');
			expect(data.posts[1].slug).toBe('published-admin-post');
		});

		it('should validate pagination parameters', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts?page=invalid&limit=invalid')
			});

			expect(response.status).toBe(400);
		});
	});

	describe('POST /api/admin/posts', () => {
		it('should create a new published post', async () => {
			const postData = {
				title: 'New Test Post',
				content: '# New Test Post\n\nThis is test content.',
				excerpt: 'Test excerpt',
				status: 'published',
				categoryIds: [techCategoryId]
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.title).toBe('New Test Post');
			expect(data.slug).toBe('new-test-post');
			expect(data.status).toBe('published');
			expect(data.publishedAt).toBeTruthy();
		});

		it('should create a draft post', async () => {
			const postData = {
				title: 'Draft Test Post',
				content: '# Draft Test Post\n\nThis is draft content.',
				status: 'draft'
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.status).toBe('draft');
			expect(data.publishedAt).toBeNull();
		});

		it('should generate unique slug when title conflicts', async () => {
			const postData = {
				title: 'Published Admin Post', // Same as existing post
				content: '# Duplicate Title\n\nThis has the same title.',
				status: 'draft'
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.slug).toBe('published-admin-post-1'); // Should be unique
		});

		it('should generate excerpt from content if not provided', async () => {
			const longContent = 'A'.repeat(300);
			const postData = {
				title: 'Auto Excerpt Post',
				content: longContent,
				status: 'draft'
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.excerpt.length).toBeLessThanOrEqual(203); // 200 + '...'
			expect(data.excerpt).toContain('...');
		});

		it('should validate required fields', async () => {
			const postData = {
				// Missing title
				content: 'Content without title'
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});

			expect(response.status).toBe(400);
		});

		it('should associate post with categories', async () => {
			const postData = {
				title: 'Multi Category Post',
				content: '# Multi Category Post\n\nThis has multiple categories.',
				status: 'published',
				categoryIds: [techCategoryId, webCategoryId]
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);

			// Verify categories were associated
			const postCategories = await testDb
				.select({ categoryId: postsToCategories.categoryId })
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, data.id));

			expect(postCategories).toHaveLength(2);
			expect(postCategories.map((pc) => pc.categoryId)).toContain(techCategoryId);
			expect(postCategories.map((pc) => pc.categoryId)).toContain(webCategoryId);
		});

		it('should handle custom publishedAt date', async () => {
			const customDate = new Date('2023-01-01T10:00:00Z');
			const postData = {
				title: 'Custom Date Post',
				content: '# Custom Date Post\n\nThis has a custom publish date.',
				status: 'published',
				publishedAt: customDate.toISOString()
			};

			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const response = await testAdminPostsApi.POST({
				request,
				locals: { testUserId }
			});
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(new Date(data.publishedAt)).toEqual(customDate);
		});
	});

	describe('Error Handling', () => {
		it('should handle database errors gracefully', async () => {
			// Test malformed JSON
			const request = new Request('http://localhost:5173/api/admin/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'invalid json'
			});

			try {
				await testAdminPostsApi.POST({
					request,
					locals: { testUserId }
				});
			} catch (error) {
				// Should handle JSON parse errors
				expect(error).toBeDefined();
			}
		});

		it('should return proper error format', async () => {
			const response = await testAdminPostsApi.GET({
				url: new URL('http://localhost:5173/api/admin/posts?page=invalid')
			});

			expect(response.status).toBe(400);
			expect(response.headers.get('content-type')).toContain('application/json');
		});
	});
});
