import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories } from '$lib/server/db/schema';

describe('Public Posts API', () => {
	let testPostId: number;
	let testCategoryId: number;

	beforeAll(async () => {
		// テスト用のカテゴリを作成
		const [category] = await db
			.insert(categories)
			.values({
				name: 'Test Category',
				slug: 'test-category'
			})
			.returning();
		testCategoryId = category.id;

		// テスト用の記事を作成
		const [post] = await db
			.insert(posts)
			.values({
				title: 'Test Post',
				slug: 'test-post',
				content: 'This is a test post content',
				excerpt: 'Test excerpt',
				status: 'published',
				publishedAt: new Date(),
				userId: 'test-user-id'
			})
			.returning();
		testPostId = post.id;

		// カテゴリと記事を関連付け
		await db.insert(postsToCategories).values({
			postId: testPostId,
			categoryId: testCategoryId
		});

		// 下書き記事も作成（APIで返されないことを確認するため）
		await db.insert(posts).values({
			title: 'Draft Post',
			slug: 'draft-post',
			content: 'This is a draft post',
			excerpt: 'Draft excerpt',
			status: 'draft',
			userId: 'test-user-id'
		});
	});

	afterAll(async () => {
		// テストデータのクリーンアップ
		await db.delete(postsToCategories);
		await db.delete(posts);
		await db.delete(categories);
	});

	describe('GET /api/posts', () => {
		it('should return published posts with pagination', async () => {
			const response = await fetch('http://localhost:5173/api/posts');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('posts');
			expect(data).toHaveProperty('pagination');
			expect(data.posts).toBeInstanceOf(Array);
			expect(data.posts.length).toBeGreaterThan(0);

			// 公開記事のみが返されることを確認
			const testPost = data.posts.find((p: { slug: string }) => p.slug === 'test-post');
			expect(testPost).toBeDefined();

			const draftPost = data.posts.find((p: { slug: string }) => p.slug === 'draft-post');
			expect(draftPost).toBeUndefined();
		});

		it('should filter posts by category', async () => {
			const response = await fetch(
				`http://localhost:5173/api/posts?category=${testCategoryId}`
			);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toBeInstanceOf(Array);

			// フィルタリングされた記事がすべて指定カテゴリを持つことを確認
			data.posts.forEach((post: { categories: Array<{ id: number }> }) => {
				const hasCategory = post.categories.some((c) => c.id === testCategoryId);
				expect(hasCategory).toBe(true);
			});
		});

		it('should respect pagination parameters', async () => {
			const response = await fetch('http://localhost:5173/api/posts?page=1&limit=5');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.pagination.page).toBe(1);
			expect(data.pagination.limit).toBe(5);
			expect(data.posts.length).toBeLessThanOrEqual(5);
		});
	});

	describe('GET /api/posts/[slug]', () => {
		it('should return a single post by slug', async () => {
			const response = await fetch('http://localhost:5173/api/posts/test-post');
			const post = await response.json();

			expect(response.status).toBe(200);
			expect(post.slug).toBe('test-post');
			expect(post.title).toBe('Test Post');
			expect(post.content).toBe('This is a test post content');
			expect(post.categories).toBeInstanceOf(Array);
		});

		it('should return 404 for non-existent post', async () => {
			const response = await fetch('http://localhost:5173/api/posts/non-existent');
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe('Post not found');
		});

		it('should not return draft posts', async () => {
			const response = await fetch('http://localhost:5173/api/posts/draft-post');
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe('Post not found');
		});
	});

	describe('GET /api/categories', () => {
		it('should return all categories with post counts', async () => {
			const response = await fetch('http://localhost:5173/api/categories');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('categories');
			expect(data.categories).toBeInstanceOf(Array);

			const testCategory = data.categories.find(
				(c: { slug: string; postCount: number }) => c.slug === 'test-category'
			);
			expect(testCategory).toBeDefined();
			expect(testCategory?.postCount).toBeGreaterThan(0);
		});
	});
});
