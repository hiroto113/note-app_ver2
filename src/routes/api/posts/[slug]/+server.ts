import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { slug } = params;

		// 記事の基本情報を取得
		const postResults = await db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				content: posts.content,
				publishedAt: posts.publishedAt,
				updatedAt: posts.updatedAt
			})
			.from(posts)
			.where(
				and(
					eq(posts.slug, slug),
					eq(posts.status, 'published'),
					sql`${posts.publishedAt} <= datetime('now')`
				)
			)
			.limit(1);

		// 記事が見つからない場合
		if (postResults.length === 0) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		const post = postResults[0];

		// カテゴリ情報を別途取得
		const categoryResults = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug
			})
			.from(categories)
			.innerJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
			.where(eq(postsToCategories.postId, post.id));

		// 結果をフォーマット
		const formattedPost = {
			...post,
			categories: categoryResults
		};

		return json(formattedPost);
	} catch (error) {
		console.error('Error fetching post:', error);
		return json({ error: 'Failed to fetch post' }, { status: 500 });
	}
};
