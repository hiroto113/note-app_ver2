import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { categories, posts, postsToCategories } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// カテゴリ一覧を取得
		const categoriesResult = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description
			})
			.from(categories)
			.orderBy(categories.name);

		// 各カテゴリの公開記事数を取得
		const categoriesWithCount = await Promise.all(
			categoriesResult.map(async (category) => {
				const [{ count }] = await db
					.select({ count: sql<number>`COUNT(*)` })
					.from(posts)
					.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
					.where(
						and(
							eq(postsToCategories.categoryId, category.id),
							eq(posts.status, 'published')
						)
					);

				return {
					...category,
					postCount: Number(count) || 0
				};
			})
		);

		// レスポンスの構築
		return json({
			categories: categoriesWithCount
		});
	} catch (error) {
		console.error('Error fetching categories:', error);
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	}
};
