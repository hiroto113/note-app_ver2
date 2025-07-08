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

		// 記事一覧の取得（基本情報のみ）
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
				}
			})
			.from(posts)
			.leftJoin(users, eq(posts.userId, users.id))
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.orderBy(desc(posts.createdAt))
			.limit(limit)
			.offset(offset);

		// 総件数の取得
		const [{ count }] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(posts)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

		// 各記事のカテゴリ情報を取得
		const formattedPosts = await Promise.all(
			allPosts.map(async (post) => {
				const categoryResults = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(categories)
					.innerJoin(postsToCategories, eq(categories.id, postsToCategories.categoryId))
					.where(eq(postsToCategories.postId, post.id));

				return {
					...post,
					categories: categoryResults
				};
			})
		);

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

		// セッション確認を追加
		if (!session?.user?.id) {
			console.error('No authenticated session found');
			return json({ error: 'Unauthorized - Please login again' }, { status: 401 });
		}

		const userId = session.user.id;

		const postData = await request.json();
		console.log('Received post data:', {
			title: postData.title,
			contentLength: postData.content?.length || 0,
			status: postData.status,
			categoryIds: postData.categoryIds
		});

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

		console.log('Creating post with data:', {
			title,
			slug,
			contentLength: content.length,
			status: status || 'draft',
			userId,
			publishedAt: finalPublishedAt
		});

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

		console.log('Post created successfully:', result[0]?.id);

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
		console.error('Error details:', {
			name: error instanceof Error ? error.name : 'UnknownError',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});

		// より詳細なエラーメッセージを返す
		const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
		return json(
			{
				error: 'Failed to create post',
				details: errorMessage,
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
