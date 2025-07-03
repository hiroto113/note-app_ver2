import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/
Disallow: /login

Sitemap: https://mynotes.example.com/sitemap.xml`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};
