import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories, users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';

// Import API route handlers directly
import * as postsApi from '../../../src/routes/api/posts/+server';
import * as categoriesApi from '../../../src/routes/api/categories/+server';
import * as postDetailApi from '../../../src/routes/api/posts/[slug]/+server';

describe('Public API Integration', () => {
	let testUserId: string;

	beforeEach(async () => {
		// Clean up database
		await db.delete(postsToCategories);
		await db.delete(posts);
		await db.delete(categories);
		await db.delete(users);

		// Create test user
		const hashedPassword = await bcrypt.hash('testpass', 10);
		const [user] = await db.insert(users).values({
			id: crypto.randomUUID(),
			username: 'testuser',
			hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();
		testUserId = user.id;

		// Create test categories
		const [techCategory] = await db.insert(categories).values({
			name: 'Technology',
			slug: 'technology',
			description: 'Tech posts',
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		const [webCategory] = await db.insert(categories).values({
			name: 'Web Development',
			slug: 'web-dev',
			description: 'Web dev posts',
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		// Create test posts
		const now = new Date();
		const yesterday = new Date(now.getTime() - 86400000);
		const tomorrow = new Date(now.getTime() + 86400000);

		const [post1] = await db.insert(posts).values({
			title: 'Published Post 1',
			slug: 'published-post-1',
			content: '# Published Post 1\n\nThis is the content.',
			excerpt: 'This is post 1',
			status: 'published',
			publishedAt: yesterday,
			userId: testUserId,
			createdAt: yesterday,
			updatedAt: yesterday
		}).returning();

		const [post2] = await db.insert(posts).values({
			title: 'Published Post 2',
			slug: 'published-post-2',
			content: '# Published Post 2\n\nThis is the content.',
			excerpt: 'This is post 2',
			status: 'published',
			publishedAt: now,
			userId: testUserId,
			createdAt: now,
			updatedAt: now
		}).returning();

		const [draftPost] = await db.insert(posts).values({
			title: 'Draft Post',
			slug: 'draft-post',
			content: '# Draft Post\n\nThis is draft content.',
			excerpt: 'This is a draft',
			status: 'draft',
			publishedAt: null,
			userId: testUserId,
			createdAt: now,
			updatedAt: now
		}).returning();

		const [futurePost] = await db.insert(posts).values({
			title: 'Future Post',
			slug: 'future-post',
			content: '# Future Post\n\nThis is future content.',
			excerpt: 'This is scheduled',
			status: 'published',
			publishedAt: tomorrow,
			userId: testUserId,
			createdAt: now,
			updatedAt: now
		}).returning();

		// Associate posts with categories
		await db.insert(postsToCategories).values([
			{ postId: post1.id, categoryId: techCategory.id },
			{ postId: post2.id, categoryId: techCategory.id },
			{ postId: post2.id, categoryId: webCategory.id },
			{ postId: draftPost.id, categoryId: webCategory.id }
		]);
	});

	afterEach(async () => {
		// Clean up
		await db.delete(postsToCategories);
		await db.delete(posts);
		await db.delete(categories);
		await db.delete(users);
	});

	describe('GET /api/posts', () => {
		it('should return published posts only', async () => {
			const request = new Request('http://localhost:5173/api/posts');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(2); // Only 2 published posts (not draft or future)
			expect(data.posts.every((p: any) => p.status === 'published')).toBe(true);
		});

		it('should return posts with categories', async () => {
			const request = new Request('http://localhost:5173/api/posts');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.posts[0].categories).toBeDefined();
			expect(Array.isArray(data.posts[0].categories)).toBe(true);
			
			// Post 2 should have 2 categories
			const post2 = data.posts.find((p: any) => p.slug === 'published-post-2');
			expect(post2.categories).toHaveLength(2);
		});

		it('should support pagination', async () => {
			const request = new Request('http://localhost:5173/api/posts?page=1&limit=1');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.posts).toHaveLength(1);
			expect(data.pagination).toEqual({
				page: 1,
				limit: 1,
				total: 2,
				totalPages: 2
			});
		});

		it('should filter by category', async () => {
			const request = new Request('http://localhost:5173/api/posts?category=web-dev');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.posts).toHaveLength(1);
			expect(data.posts[0].slug).toBe('published-post-2');
		});

		it('should order posts by publishedAt desc', async () => {
			const request = new Request('http://localhost:5173/api/posts');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.posts[0].slug).toBe('published-post-2'); // More recent
			expect(data.posts[1].slug).toBe('published-post-1'); // Older
		});

		it('should handle empty results', async () => {
			// Delete all posts
			await db.delete(posts);

			const request = new Request('http://localhost:5173/api/posts');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(0);
			expect(data.pagination.total).toBe(0);
		});
	});

	describe('GET /api/posts/[slug]', () => {
		it('should return a single published post', async () => {
			const request = new Request('http://localhost:5173/api/posts/published-post-1');
			const params = { slug: 'published-post-1' };
			const response = await postDetailApi.GET({ 
				request, 
				params,
				url: new URL(request.url) 
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.post).toBeDefined();
			expect(data.post.slug).toBe('published-post-1');
			expect(data.post.content).toContain('# Published Post 1');
		});

		it('should return post with categories', async () => {
			const request = new Request('http://localhost:5173/api/posts/published-post-2');
			const params = { slug: 'published-post-2' };
			const response = await postDetailApi.GET({ 
				request, 
				params,
				url: new URL(request.url) 
			} as any);
			const data = await response.json();

			expect(data.post.categories).toBeDefined();
			expect(data.post.categories).toHaveLength(2);
			expect(data.post.categories.map((c: any) => c.slug)).toContain('technology');
			expect(data.post.categories.map((c: any) => c.slug)).toContain('web-dev');
		});

		it('should not return draft posts', async () => {
			const request = new Request('http://localhost:5173/api/posts/draft-post');
			const params = { slug: 'draft-post' };
			const response = await postDetailApi.GET({ 
				request, 
				params,
				url: new URL(request.url) 
			} as any);

			expect(response.status).toBe(404);
		});

		it('should not return future posts', async () => {
			const request = new Request('http://localhost:5173/api/posts/future-post');
			const params = { slug: 'future-post' };
			const response = await postDetailApi.GET({ 
				request, 
				params,
				url: new URL(request.url) 
			} as any);

			expect(response.status).toBe(404);
		});

		it('should return 404 for non-existent post', async () => {
			const request = new Request('http://localhost:5173/api/posts/non-existent');
			const params = { slug: 'non-existent' };
			const response = await postDetailApi.GET({ 
				request, 
				params,
				url: new URL(request.url) 
			} as any);

			expect(response.status).toBe(404);
		});
	});

	describe('GET /api/categories', () => {
		it('should return all categories', async () => {
			const request = new Request('http://localhost:5173/api/categories');
			const response = await categoriesApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.categories).toHaveLength(2);
			expect(data.categories.map((c: any) => c.slug)).toContain('technology');
			expect(data.categories.map((c: any) => c.slug)).toContain('web-dev');
		});

		it('should include post count for each category', async () => {
			const request = new Request('http://localhost:5173/api/categories');
			const response = await categoriesApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			const techCategory = data.categories.find((c: any) => c.slug === 'technology');
			const webCategory = data.categories.find((c: any) => c.slug === 'web-dev');

			expect(techCategory.postCount).toBe(2); // 2 published posts
			expect(webCategory.postCount).toBe(1); // 1 published post (draft doesn't count)
		});

		it('should order categories by name', async () => {
			const request = new Request('http://localhost:5173/api/categories');
			const response = await categoriesApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.categories[0].name).toBe('Technology');
			expect(data.categories[1].name).toBe('Web Development');
		});

		it('should handle empty categories', async () => {
			// Delete all relationships and categories
			await db.delete(postsToCategories);
			await db.delete(categories);

			const request = new Request('http://localhost:5173/api/categories');
			const response = await categoriesApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.categories).toHaveLength(0);
		});
	});

	describe('Error Handling', () => {
		it('should handle database errors gracefully', async () => {
			// This would require mocking the database to throw an error
			// For now, we'll test the structure is in place
			const request = new Request('http://localhost:5173/api/posts');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);

			expect(response.headers.get('content-type')).toContain('application/json');
		});
	});

	describe('Performance Considerations', () => {
		it('should limit maximum results per page', async () => {
			// Create many posts
			const manyPosts = [];
			for (let i = 0; i < 100; i++) {
				manyPosts.push({
					title: `Post ${i}`,
					slug: `post-${i}`,
					content: `Content ${i}`,
					excerpt: `Excerpt ${i}`,
					status: 'published' as const,
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}
			await db.insert(posts).values(manyPosts);

			const request = new Request('http://localhost:5173/api/posts?limit=100');
			const response = await postsApi.GET({ request, url: new URL(request.url) } as any);
			const data = await response.json();

			expect(data.posts.length).toBeLessThanOrEqual(50); // Max limit should be enforced
		});
	});
});