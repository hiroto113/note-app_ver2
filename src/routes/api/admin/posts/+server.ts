import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts, postsToCategories, users, categories } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/slug';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
	validatePost,
	validatePagination,
	createValidationErrorResponse
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

// GET /api/admin/posts - Get all posts (including drafts)
export const GET: RequestHandler = async ({ url }) => {
	try {
		// クエリパラメータの検証
		const {
			page,
			limit,
			errors: paginationErrors
		} = validatePagination({
			page: url.searchParams.get('page'),
			limit: url.searchParams.get('limit')
		});

		if (paginationErrors.length > 0) {
			return createValidationErrorResponse(paginationErrors);
		}

		const status = url.searchParams.get('status');

		// オフセットの計算
		const offset = (page - 1) * limit;

		// WHERE条件の構築
		const whereConditions = [];
		if (status && status !== 'all') {
			whereConditions.push(eq(posts.status, status as 'draft' | 'published'));
		}

		// 記事一覧の取得（カテゴリ情報含む）
		const allPosts = await db
			.select({
				id: posts.id,
				title: posts.title,
				slug: posts.slug,
				excerpt: posts.excerpt,
				status: posts.status,
				publishedAt: posts.publishedAt,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt,
				author: {
					id: users.id,
					username: users.username
				},
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
			.leftJoin(users, eq(posts.userId, users.id))
			.leftJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
			.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.groupBy(posts.id)
			.orderBy(desc(posts.createdAt))
			.limit(limit)
			.offset(offset);

		// 総件数の取得
		const [{ count }] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(posts)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

		// カテゴリ情報のパース
		const formattedPosts = allPosts.map((post) => ({
			...post,
			categories: post.categories ? post.categories.split(',').map((c) => JSON.parse(c)) : []
		}));

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

// POST /api/admin/posts - Create new post
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// 認証チェックはhooks.server.tsで行われるため、sessionを取得のみ
		const session = await locals.getSession?.();
		const userId = session?.user?.id;

		const postData = await request.json();
		const { title, content, excerpt, status, categoryIds, publishedAt } = postData;

		// バリデーション実行
		const validation = validatePost(postData);
		if (!validation.isValid) {
			return createValidationErrorResponse(validation.errors);
		}

		// Generate unique slug
		const baseSlug = generateSlug(title);
		let slug = baseSlug;
		let counter = 1;

		// Check if slug exists and make it unique
		while (true) {
			const existingPost = await db
				.select({ id: posts.id })
				.from(posts)
				.where(eq(posts.slug, slug))
				.get();

			if (!existingPost) break;

			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		const now = new Date();
		const finalPublishedAt =
			status === 'published' ? (publishedAt ? new Date(publishedAt) : now) : null;

		// Create post
		const result = await db
			.insert(posts)
			.values({
				title,
				slug,
				content,
				excerpt: excerpt || content.substring(0, 200) + '...',
				status: (status as 'draft' | 'published') || 'draft',
				publishedAt: finalPublishedAt,
				userId: userId!,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		const createdPost = result[0];

		// Add categories if provided
		if (categoryIds && categoryIds.length > 0) {
			const categoryInserts = categoryIds.map((categoryId: number) => ({
				postId: createdPost.id,
				categoryId
			}));

			await db.insert(postsToCategories).values(categoryInserts);
		}

		return json(createdPost, { status: 201 });
	} catch (error) {
		console.error('Error creating post:', error);
		return json({ error: 'Failed to create post' }, { status: 500 });
	}
};
