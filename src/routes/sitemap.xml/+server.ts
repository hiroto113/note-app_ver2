import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { posts, categories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const baseUrl = dev ? 'http://localhost:5173' : 'https://mynotes.example.com';

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

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- トップページ -->
	<url>
		<loc>${baseUrl}/</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	
	<!-- 記事ページ -->
	${publishedPosts
		.map(
			(post) => `
	<url>
		<loc>${baseUrl}/posts/${post.slug}</loc>
		<lastmod>${post.updatedAt.toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>`
		)
		.join('')}
	
	<!-- カテゴリ別記事一覧 -->
	${allCategories
		.map(
			(category) => `
	<url>
		<loc>${baseUrl}/?category=${category.slug}</loc>
		<lastmod>${category.updatedAt.toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.6</priority>
	</url>`
		)
		.join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};