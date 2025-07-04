import { describe, it, expect, beforeEach } from 'vitest';
import { testDb } from '../setup';
import { posts, categories, postsToCategories, users } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// API パフォーマンステスト用のハンドラー
const performancePostsApi = {
	GET: async ({ url }: { url: URL }) => {
		const startTime = performance.now();

		try {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

			const offset = (page - 1) * limit;

			// 公開済み記事を取得
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

			// フィルタリング
			const now = new Date();
			const validPosts = allPosts.filter((post) => {
				if (!post.publishedAt) return true;
				return new Date(post.publishedAt) <= now;
			});

			// ソート
			const sortedPosts = validPosts.sort((a, b) => {
				if (!a.publishedAt && !b.publishedAt) return 0;
				if (!a.publishedAt) return 1;
				if (!b.publishedAt) return -1;
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			});

			const postsResult = sortedPosts.slice(offset, offset + limit);

			// カテゴリ情報を取得
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

			const endTime = performance.now();
			const responseTime = endTime - startTime;

			return {
				response: json({
					posts: postsWithCategories,
					pagination: {
						page,
						limit,
						total: validPosts.length,
						totalPages: Math.ceil(validPosts.length / limit)
					}
				}),
				responseTime
			};
		} catch (error) {
			const endTime = performance.now();
			return {
				response: json({ error: 'Failed to fetch posts' }, { status: 500 }),
				responseTime: endTime - startTime
			};
		}
	}
};

describe('API パフォーマンステスト', () => {
	let testUserId: string;

	beforeEach(async () => {
		// テストユーザーを作成
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

		// テストカテゴリを作成
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

		// 大量のテストデータを作成（パフォーマンステスト用）
		const posts_data: Array<{
			title: string;
			slug: string;
			content: string;
			excerpt: string;
			status: 'published';
			publishedAt: Date;
			userId: string;
			createdAt: Date;
			updatedAt: Date;
		}> = [];
		const postsToCategories_data: Array<{
			postId: number;
			categoryId: number;
		}> = [];

		for (let i = 1; i <= 100; i++) {
			const post = {
				title: `Performance Test Post ${i}`,
				slug: `performance-test-post-${i}`,
				content:
					`# Performance Test Post ${i}\n\nThis is test content for performance testing. `.repeat(
						10
					),
				excerpt: `This is test excerpt ${i}`,
				status: 'published' as const,
				publishedAt: new Date(Date.now() - i * 3600000), // 1時間ずつ過去
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			posts_data.push(post);
		}

		// 記事を一括挿入
		const insertedPosts = await testDb.insert(posts).values(posts_data).returning();

		// カテゴリ関連付けデータを作成
		insertedPosts.forEach((post) => {
			postsToCategories_data.push({
				postId: post.id,
				categoryId: techCategory.id
			});
		});

		// カテゴリ関連付けを一括挿入
		if (postsToCategories_data.length > 0) {
			await testDb.insert(postsToCategories).values(postsToCategories_data);
		}
	});

	describe('API レスポンス時間', () => {
		it('投稿リストAPI（10件）のレスポンス時間が100ms未満', async () => {
			const url = new URL('http://localhost:5173/api/posts?limit=10');
			const result = await performancePostsApi.GET({ url });

			expect(result.responseTime).toBeLessThan(100);

			const data = await result.response.json();
			expect(data.posts).toHaveLength(10);
			expect(data.pagination.total).toBe(100);
		});

		it('投稿リストAPI（50件）のレスポンス時間が200ms未満', async () => {
			const url = new URL('http://localhost:5173/api/posts?limit=50');
			const result = await performancePostsApi.GET({ url });

			expect(result.responseTime).toBeLessThan(200);

			const data = await result.response.json();
			expect(data.posts).toHaveLength(50);
		});

		it('ページネーション（後半ページ）のレスポンス時間が150ms未満', async () => {
			const url = new URL('http://localhost:5173/api/posts?page=5&limit=10');
			const result = await performancePostsApi.GET({ url });

			expect(result.responseTime).toBeLessThan(150);

			const data = await result.response.json();
			expect(data.posts).toHaveLength(10);
			expect(data.pagination.page).toBe(5);
		});
	});

	describe('データベースクエリパフォーマンス', () => {
		it('記事取得クエリが50ms未満で完了', async () => {
			const startTime = performance.now();

			const result = await testDb
				.select()
				.from(posts)
				.where(eq(posts.status, 'published'))
				.limit(50);

			const endTime = performance.now();
			const queryTime = endTime - startTime;

			expect(queryTime).toBeLessThan(50);
			expect(result.length).toBe(50);
		});

		it('カテゴリ付き記事取得が100ms未満で完了', async () => {
			const startTime = performance.now();

			const result = await testDb
				.select({
					post: posts,
					category: categories
				})
				.from(posts)
				.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
				.innerJoin(categories, eq(categories.id, postsToCategories.categoryId))
				.where(eq(posts.status, 'published'))
				.limit(20);

			const endTime = performance.now();
			const queryTime = endTime - startTime;

			expect(queryTime).toBeLessThan(100);
			expect(result.length).toBe(20);
		});

		it('カテゴリ別記事数取得が30ms未満で完了', async () => {
			const startTime = performance.now();

			const result = await testDb
				.select({
					categoryId: categories.id,
					categoryName: categories.name,
					postCount: sql<number>`COUNT(${posts.id})`
				})
				.from(categories)
				.leftJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
				.leftJoin(posts, eq(posts.id, postsToCategories.postId))
				.where(eq(posts.status, 'published'))
				.groupBy(categories.id);

			const endTime = performance.now();
			const queryTime = endTime - startTime;

			expect(queryTime).toBeLessThan(30);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('メモリ使用量テスト', () => {
		it('大量データ処理時のメモリ使用量が適切', async () => {
			const initialMemory = process.memoryUsage();

			// 大量データを取得・処理
			const allPosts = await testDb.select().from(posts).where(eq(posts.status, 'published'));

			// データを処理
			const processedPosts = allPosts.map((post) => ({
				...post,
				processedTitle: post.title.toUpperCase(),
				wordCount: post.content.split(' ').length
			}));

			const finalMemory = process.memoryUsage();
			const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

			// メモリ増加が10MB未満であることを確認
			expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
			expect(processedPosts.length).toBe(100);
		});
	});

	describe('同時接続処理性能', () => {
		it('複数の同時リクエストを効率的に処理', async () => {
			const startTime = performance.now();

			// 10個の同時リクエストをシミュレート
			const promises = Array.from({ length: 10 }, (_, i) => {
				const url = new URL(`http://localhost:5173/api/posts?page=${i + 1}&limit=5`);
				return performancePostsApi.GET({ url });
			});

			const results = await Promise.all(promises);

			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// 全ての同時リクエストが300ms未満で完了
			expect(totalTime).toBeLessThan(300);

			// 全てのリクエストが成功
			results.forEach((result, index) => {
				expect(result.responseTime).toBeLessThan(100);
			});
		});
	});
});
