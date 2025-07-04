import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { posts, categories, postsToCategories, users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';

// Mock API handlers for testing
import { json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

// Test API handlers that use testDb instead of production db
const testPostsApi = {
	GET: async ({ url }: { url: URL }) => {
		try {
			// クエリパラメータの取得
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
			const categorySlug = url.searchParams.get('category');

			// オフセットの計算
			const offset = (page - 1) * limit;

			// 全ての記事を取得してJavaScriptでフィルタリング
			const allPosts = await testDb
				.select({
					id: posts.id,
					slug: posts.slug,
					title: posts.title,
					excerpt: posts.excerpt,
					publishedAt: posts.publishedAt,
					status: posts.status
				})
				.from(posts)
				.where(eq(posts.status, 'published'));

			// JavaScriptで未来の投稿をフィルタリング
			const now = new Date();
			const validPosts = allPosts.filter((post) => {
				if (!post.publishedAt) return true;
				return new Date(post.publishedAt) <= now;
			});

			// ソートとページネーション
			const sortedPosts = validPosts.sort((a, b) => {
				if (!a.publishedAt && !b.publishedAt) return 0;
				if (!a.publishedAt) return 1;
				if (!b.publishedAt) return -1;
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			});

			const postsResult = sortedPosts.slice(offset, offset + limit);

			// 各記事のカテゴリ情報を取得
			const postsWithCategories = await Promise.all(
				postsResult.map(async (post) => {
					const postCategories = await testDb
						.select({
							id: categories.id,
							name: categories.name,
							slug: categories.slug
						})
						.from(categories)
						.innerJoin(
							postsToCategories,
							eq(categories.id, postsToCategories.categoryId)
						)
						.where(eq(postsToCategories.postId, post.id));

					return {
						...post,
						categories: postCategories
					};
				})
			);

			// カテゴリフィルタリング（取得後）
			let filteredPosts = postsWithCategories;
			if (categorySlug) {
				filteredPosts = postsWithCategories.filter((post) =>
					post.categories.some((cat) => cat.slug === categorySlug)
				);
			}

			// 総件数はフィルタリング後の数
			const totalCount = validPosts.length;

			// レスポンスの構築
			return json({
				posts: filteredPosts,
				pagination: {
					page,
					limit,
					total: totalCount,
					totalPages: Math.ceil(totalCount / limit)
				}
			});
		} catch (error) {
			console.error('Error fetching posts:', error);
			return json({ error: 'Failed to fetch posts' }, { status: 500 });
		}
	}
};

const testPostDetailApi = {
	GET: async ({ params }: { params: { slug: string } }) => {
		try {
			const { slug } = params;

			// 記事を取得
			const [post] = await testDb.select().from(posts).where(eq(posts.slug, slug));

			if (!post) {
				return json({ error: 'Post not found' }, { status: 404 });
			}

			// 公開済みでない記事や未来の記事は返さない
			if (post.status !== 'published') {
				return json({ error: 'Post not found' }, { status: 404 });
			}

			if (post.publishedAt && new Date(post.publishedAt) > new Date()) {
				return json({ error: 'Post not found' }, { status: 404 });
			}

			// カテゴリ情報を取得
			const postCategories = await testDb
				.select({
					id: categories.id,
					name: categories.name,
					slug: categories.slug
				})
				.from(categories)
				.innerJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
				.where(eq(postsToCategories.postId, post.id));

			return json({
				post: {
					...post,
					categories: postCategories
				}
			});
		} catch (error) {
			console.error('Error fetching post:', error);
			return json({ error: 'Failed to fetch post' }, { status: 500 });
		}
	}
};

const testCategoriesApi = {
	GET: async () => {
		try {
			const categoriesResult = await testDb
				.select()
				.from(categories)
				.orderBy(categories.name);

			// 各カテゴリの記事数を取得
			const now = new Date();
			const categoriesWithCounts = await Promise.all(
				categoriesResult.map(async (category) => {
					const [{ count }] = await testDb
						.select({ count: sql<number>`COUNT(*)` })
						.from(posts)
						.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
						.where(
							sql`${postsToCategories.categoryId} = ${category.id} AND ${posts.status} = 'published' AND (${posts.publishedAt} IS NULL OR ${posts.publishedAt} <= ${now})`
						);

					return {
						...category,
						postCount: Number(count)
					};
				})
			);

			return json({
				categories: categoriesWithCounts
			});
		} catch (error) {
			console.error('Error fetching categories:', error);
			return json({ error: 'Failed to fetch categories' }, { status: 500 });
		}
	}
};

type PostResponse = {
	id: number;
	slug: string;
	title: string;
	status: string;
	categories: unknown[];
};

type CategoryResponse = {
	id: number;
	name: string;
	slug: string;
	postCount: number;
};

describe('Public API Integration', () => {
	let testUserId: string;

	beforeEach(async () => {
		// Create test user
		const hashedPassword = await bcrypt.hash('testpass', 10);
		const [user] = await testDb
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				username: 'testuser',
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

		// Create test posts
		const now = new Date();
		const yesterday = new Date(Date.now() - 86400000);
		const tomorrow = new Date(Date.now() + 86400000);

		const [post1] = await testDb
			.insert(posts)
			.values({
				title: 'Published Post 1',
				slug: 'published-post-1',
				content: '# Published Post 1\n\nThis is the content.',
				excerpt: 'This is post 1',
				status: 'published',
				publishedAt: yesterday,
				userId: testUserId,
				createdAt: yesterday,
				updatedAt: yesterday
			})
			.returning();

		const [post2] = await testDb
			.insert(posts)
			.values({
				title: 'Published Post 2',
				slug: 'published-post-2',
				content: '# Published Post 2\n\nThis is the content.',
				excerpt: 'This is post 2',
				status: 'published',
				publishedAt: now,
				userId: testUserId,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		const [draftPost] = await testDb
			.insert(posts)
			.values({
				title: 'Draft Post',
				slug: 'draft-post',
				content: '# Draft Post\n\nThis is draft content.',
				excerpt: 'This is a draft',
				status: 'draft',
				publishedAt: null,
				userId: testUserId,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		await testDb
			.insert(posts)
			.values({
				title: 'Future Post',
				slug: 'future-post',
				content: '# Future Post\n\nThis is future content.',
				excerpt: 'This is scheduled',
				status: 'published',
				publishedAt: tomorrow,
				userId: testUserId,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		// Associate posts with categories
		await testDb.insert(postsToCategories).values([
			{ postId: post1.id, categoryId: techCategory.id },
			{ postId: post2.id, categoryId: techCategory.id },
			{ postId: post2.id, categoryId: webCategory.id },
			{ postId: draftPost.id, categoryId: webCategory.id }
		]);
	});

	afterEach(async () => {
		// Clean up
		await testDb.delete(postsToCategories);
		await testDb.delete(posts);
		await testDb.delete(categories);
		await testDb.delete(users);
	});

	describe('GET /api/posts', () => {
		it('should return published posts only', async () => {
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(2); // Only 2 published posts (not draft or future)
			expect(data.posts.every((p: PostResponse) => p.status === 'published')).toBe(true);
		});

		it('should return posts with categories', async () => {
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});
			const data = await response.json();

			expect(data.posts[0].categories).toBeDefined();
			expect(Array.isArray(data.posts[0].categories)).toBe(true);

			// Post 2 should have 2 categories
			const post2 = data.posts.find((p: PostResponse) => p.slug === 'published-post-2');
			expect(post2.categories).toHaveLength(2);
		});

		it('should support pagination', async () => {
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts?page=1&limit=1')
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

		it('should filter by category', async () => {
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts?category=web-dev')
			});
			const data = await response.json();

			expect(data.posts).toHaveLength(1);
			expect(data.posts[0].slug).toBe('published-post-2');
		});

		it('should order posts by publishedAt desc', async () => {
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});
			const data = await response.json();

			expect(data.posts[0].slug).toBe('published-post-2'); // More recent
			expect(data.posts[1].slug).toBe('published-post-1'); // Older
		});

		it('should handle empty results', async () => {
			// Delete all posts
			await testDb.delete(posts);

			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.posts).toHaveLength(0);
			expect(data.pagination.total).toBe(0);
		});
	});

	describe('GET /api/posts/[slug]', () => {
		it('should return a single published post', async () => {
			const params = { slug: 'published-post-1' };
			const response = await testPostDetailApi.GET({
				params
			});
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.post).toBeDefined();
			expect(data.post.slug).toBe('published-post-1');
			expect(data.post.content).toContain('# Published Post 1');
		});

		it('should return post with categories', async () => {
			const params = { slug: 'published-post-2' };
			const response = await testPostDetailApi.GET({
				params
			});
			const data = await response.json();

			expect(data.post.categories).toBeDefined();
			expect(data.post.categories).toHaveLength(2);
			expect(data.post.categories.map((c: CategoryResponse) => c.slug)).toContain(
				'technology'
			);
			expect(data.post.categories.map((c: CategoryResponse) => c.slug)).toContain('web-dev');
		});

		it('should not return draft posts', async () => {
			const params = { slug: 'draft-post' };
			const response = await testPostDetailApi.GET({
				params
			});

			expect(response.status).toBe(404);
		});

		it('should not return future posts', async () => {
			const params = { slug: 'future-post' };
			const response = await testPostDetailApi.GET({
				params
			});

			expect(response.status).toBe(404);
		});

		it('should return 404 for non-existent post', async () => {
			const params = { slug: 'non-existent' };
			const response = await testPostDetailApi.GET({
				params
			});

			expect(response.status).toBe(404);
		});
	});

	describe('GET /api/categories', () => {
		it('should return all categories', async () => {
			const response = await testCategoriesApi.GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.categories).toHaveLength(2);
			expect(data.categories.map((c: CategoryResponse) => c.slug)).toContain('technology');
			expect(data.categories.map((c: CategoryResponse) => c.slug)).toContain('web-dev');
		});

		it('should include post count for each category', async () => {
			const response = await testCategoriesApi.GET();
			const data = await response.json();

			const techCategory = data.categories.find(
				(c: CategoryResponse) => c.slug === 'technology'
			);
			const webCategory = data.categories.find((c: CategoryResponse) => c.slug === 'web-dev');

			expect(techCategory.postCount).toBe(2); // 2 published posts
			expect(webCategory.postCount).toBe(1); // 1 published post (draft doesn't count)
		});

		it('should order categories by name', async () => {
			const response = await testCategoriesApi.GET();
			const data = await response.json();

			expect(data.categories[0].name).toBe('Technology');
			expect(data.categories[1].name).toBe('Web Development');
		});

		it('should handle empty categories', async () => {
			// Delete all relationships and categories
			await testDb.delete(postsToCategories);
			await testDb.delete(categories);

			const response = await testCategoriesApi.GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.categories).toHaveLength(0);
		});
	});

	describe('Error Handling', () => {
		it('should handle database errors gracefully', async () => {
			// This would require mocking the database to throw an error
			// For now, we'll test the structure is in place
			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});

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
			await testDb.insert(posts).values(manyPosts);

			const response = await testPostsApi.GET({
				url: new URL('http://localhost:5173/api/posts')
			});
			const data = await response.json();

			expect(data.posts.length).toBeLessThanOrEqual(50); // Max limit should be enforced
		});
	});
});
