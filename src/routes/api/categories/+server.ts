import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { categories, posts, postsToCategories } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// カテゴリ一覧と各カテゴリの公開記事数を取得
		const results = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				postCount: sql<number>`
					COUNT(DISTINCT CASE 
						WHEN ${posts.status} = 'published' 
						AND ${posts.publishedAt} <= datetime('now') 
						THEN ${posts.id} 
						ELSE NULL 
					END)
				`.as('postCount')
			})
			.from(categories)
			.leftJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
			.leftJoin(posts, eq(postsToCategories.postId, posts.id))
			.groupBy(categories.id)
			.orderBy(categories.name);

		// レスポンスの構築
		return json({
			categories: results.map((cat) => ({
				...cat,
				postCount: Number(cat.postCount) || 0
			}))
		});
	} catch (error) {
		console.error('Error fetching categories:', error);
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	}
};
