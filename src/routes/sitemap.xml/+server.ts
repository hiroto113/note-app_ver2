import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
	const baseUrl = dev ? 'http://localhost:5173' : 'https://mynotes.example.com';
	const currentDate = new Date().toISOString();

	let dynamicUrls = '';

	// 安全にデータベースから動的コンテンツを取得
	try {
		// 動的インポートでデータベースへの依存を遅延読み込み
		const { db } = await import('$lib/server/db');
		const { posts, categories } = await import('$lib/server/db/schema');
		const { eq } = await import('drizzle-orm');

		// 公開されている記事を取得
		const publishedPosts = await db
			.select({
				slug: posts.slug,
				updatedAt: posts.updatedAt,
				publishedAt: posts.publishedAt
			})
			.from(posts)
			.where(eq(posts.status, 'published'));

		// カテゴリを取得
		const allCategories = await db
			.select({
				slug: categories.slug,
				updatedAt: categories.updatedAt
			})
			.from(categories);

		// 記事ページのURL生成
		const postUrls = publishedPosts
			.filter((post) => post.publishedAt)
			.map(
				(post) => `
	<url>
		<loc>${baseUrl}/posts/${post.slug}</loc>
		<lastmod>${post.updatedAt.toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>`
			)
			.join('');

		// カテゴリ別記事一覧のURL生成
		const categoryUrls = allCategories
			.map(
				(category) => `
	<url>
		<loc>${baseUrl}/?category=${category.slug}</loc>
		<lastmod>${category.updatedAt.toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.6</priority>
	</url>`
			)
			.join('');

		dynamicUrls = postUrls + categoryUrls;
	} catch (error) {
		console.warn(
			'Database not available for sitemap generation, using static sitemap only:',
			error
		);
		// データベースエラーの場合は静的サイトマップのみ返す
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- トップページ -->
	<url>
		<loc>${baseUrl}/</loc>
		<lastmod>${currentDate}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	
	<!-- ログインページ -->
	<url>
		<loc>${baseUrl}/login</loc>
		<lastmod>${currentDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.3</priority>
	</url>${dynamicUrls}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
