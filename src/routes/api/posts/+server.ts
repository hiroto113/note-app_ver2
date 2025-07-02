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
		const categoryId = url.searchParams.get('category');

		// オフセットの計算
		const offset = (page - 1) * limit;

		// 基本的なWHERE条件
		const whereConditions = [
			eq(posts.status, 'published'),
			sql`${posts.publishedAt} <= datetime('now')`
		];

		// クエリの構築
		const baseQuery = db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				excerpt: posts.excerpt,
				publishedAt: posts.publishedAt,
				categories: sql<string>`
					GROUP_CONCAT(
						json_object(
							'id', ${categories.id},
							'name', ${categories.name}
						)
					)
				`.as('categories')
			})
			.from(posts);

		// カテゴリフィルタリング
		let results;
		if (categoryId) {
			results = await baseQuery
				.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
				.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
				.where(
					and(...whereConditions, eq(postsToCategories.categoryId, parseInt(categoryId)))
				)
				.groupBy(posts.id)
				.orderBy(desc(posts.publishedAt))
				.limit(limit)
				.offset(offset);
		} else {
			results = await baseQuery
				.leftJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
				.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
				.where(and(...whereConditions))
				.groupBy(posts.id)
				.orderBy(desc(posts.publishedAt))
				.limit(limit)
				.offset(offset);
		}

		// 総件数の取得
		const [{ count }] = await db
			.select({ count: sql<number>`COUNT(DISTINCT ${posts.id})` })
			.from(posts)
			.leftJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
			.where(
				and(
					...whereConditions,
					categoryId ? eq(postsToCategories.categoryId, parseInt(categoryId)) : undefined
				)
			);

		// カテゴリ情報のパース
		const formattedPosts = results.map((post) => ({
			...post,
			categories: post.categories ? post.categories.split(',').map((c) => JSON.parse(c)) : []
		}));

		// レスポンスの構築
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
};
