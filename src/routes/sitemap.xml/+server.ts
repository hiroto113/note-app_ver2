import { db } from '$lib/server/db';
import { posts, categories } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// サイトのベースURL（環境変数から取得）
const BASE_URL = 'https://my-notes.vercel.app';

/**
 * XMLサイトマップを生成
 */
export const GET: RequestHandler = async () => {
	try {
		// データベースから記事とカテゴリを取得
		const [allPosts, allCategories] = await Promise.all([
			db.select().from(posts).where(eq(posts.status, 'published')).orderBy(desc(posts.publishedAt)),
			db.select().from(categories).orderBy(categories.name)
		]);

		// 公開済みの記事のみを対象
		const publishedPosts = allPosts;

		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

	<!-- ホームページ -->
	<url>
		<loc>${BASE_URL}/</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>

	<!-- 記事一覧ページ -->
	<url>
		<loc>${BASE_URL}/posts</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>0.8</priority>
	</url>

	<!-- カテゴリ一覧ページ -->
	<url>
		<loc>${BASE_URL}/categories</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.7</priority>
	</url>

	<!-- 各記事ページ -->
	${publishedPosts.map(post => `
	<url>
		<loc>${BASE_URL}/posts/${post.slug}</loc>
		<lastmod>${post.updatedAt.toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.9</priority>
		${post.excerpt ? `
		<news:news>
			<news:publication>
				<news:name>My Notes</news:name>
				<news:language>ja</news:language>
			</news:publication>
			<news:publication_date>${post.publishedAt?.toISOString() || post.createdAt.toISOString()}</news:publication_date>
			<news:title><![CDATA[${post.title}]]></news:title>
		</news:news>` : ''}
	</url>`).join('')}

	<!-- 各カテゴリページ -->
	${allCategories.map(category => `
	<url>
		<loc>${BASE_URL}/categories/${category.slug}</loc>
		<lastmod>${category.updatedAt.toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.6</priority>
	</url>`).join('')}

	<!-- 静的ページ -->
	<url>
		<loc>${BASE_URL}/about</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.5</priority>
	</url>

	<url>
		<loc>${BASE_URL}/contact</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.5</priority>
	</url>

	<url>
		<loc>${BASE_URL}/privacy</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>yearly</changefreq>
		<priority>0.3</priority>
	</url>

	<url>
		<loc>${BASE_URL}/terms</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>yearly</changefreq>
		<priority>0.3</priority>
	</url>

</urlset>`;

		return new Response(sitemap.trim(), {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600, s-maxage=3600'
			}
		});

	} catch (error) {
		console.error('Sitemap generation failed:', error);
		
		// エラー時は最小限のサイトマップを返す
		const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${BASE_URL}/</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
</urlset>`;

		return new Response(fallbackSitemap.trim(), {
			status: 500,
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=60'
			}
		});
	}
};