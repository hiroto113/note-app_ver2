import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { slug } = params;
		
		// 記事の取得（カテゴリ情報含む）
		const results = await db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				content: posts.content,
				publishedAt: posts.publishedAt,
				updatedAt: posts.updatedAt,
				categories: sql<string>`
					GROUP_CONCAT(
						json_object(
							'id', ${categories.id},
							'name', ${categories.name}
						)
					)
				`.as('categories')
			})
			.from(posts)
			.leftJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
			.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
			.where(and(
				eq(posts.slug, slug),
				eq(posts.status, 'published'),
				sql`${posts.publishedAt} <= datetime('now')`
			))
			.groupBy(posts.id)
			.limit(1);
		
		// 記事が見つからない場合
		if (results.length === 0) {
			return json(
				{ error: 'Post not found' },
				{ status: 404 }
			);
		}
		
		const post = results[0];
		
		// カテゴリ情報のパース
		const formattedPost = {
			...post,
			categories: post.categories 
				? post.categories.split(',').map(c => JSON.parse(c))
				: []
		};
		
		return json(formattedPost);
		
	} catch (error) {
		console.error('Error fetching post:', error);
		return json(
			{ error: 'Failed to fetch post' },
			{ status: 500 }
		);
	}
};