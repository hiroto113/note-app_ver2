import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
	const baseUrl = dev ? 'http://localhost:5173' : 'https://mynotes.example.com';
	const currentDate = new Date().toISOString();

	// 基本的なサイトマップ（静的コンテンツのみ）
	// TODO: 将来的にはAPIから動的にコンテンツを取得する
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
	</url>
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};