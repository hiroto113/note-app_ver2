import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories } from '$lib/server/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// クエリパラメータの取得
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
		const categorySlug = url.searchParams.get('category');

		// オフセットの計算
		const offset = (page - 1) * limit;

		// まずはシンプルな記事取得
		const postsResult = await db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				excerpt: posts.excerpt,
				publishedAt: posts.publishedAt,
				status: posts.status
			})
			.from(posts)
			.where(eq(posts.status, 'published'))
			.orderBy(desc(posts.publishedAt))
			.limit(limit)
			.offset(offset);

		// 各記事のカテゴリ情報を取得
		const postsWithCategories = await Promise.all(
			postsResult.map(async (post) => {
				const postCategories = await db
					.select({
						id: categories.id,
						name: categories.name,
						slug: categories.slug
					})
					.from(categories)
					.innerJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
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

		// 総件数の取得
		const [{ count }] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(posts)
			.where(eq(posts.status, 'published'));

		// レスポンスの構築
		return json({
			posts: filteredPosts,
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
};
