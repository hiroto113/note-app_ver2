import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		const { slug } = params;

		// 記事データを取得
		let post: any = null;
		try {
			const response = await fetch(`/api/posts/${slug}`);
			if (response.ok) {
				post = await response.json();
			}
		} catch (fetchError) {
			console.warn('Failed to fetch post data for OGP:', fetchError);
		}

		// フォールバック値
		const title = post?.title || 'My Notes';
		const category = post?.category?.name || '';

		// タイトルの長さに応じてフォントサイズを調整
		const fontSize = title.length > 50 ? '40px' : title.length > 30 ? '48px' : '64px';

		// SVGテンプレート
		const svg = `
			<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
						<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="1200" height="630" fill="url(#gradient)" />
				
				<!-- Type Indicator -->
				<rect x="40" y="40" width="120" height="40" rx="20" fill="rgba(255,255,255,0.2)" />
				<text 
					x="100" 
					y="60" 
					font-family="Arial, sans-serif" 
					font-size="20px" 
					fill="white" 
					text-anchor="middle" 
					dominant-baseline="middle"
				>
					📝 記事
				</text>
				
				<!-- Title -->
				<text 
					x="600" 
					y="${category ? '280' : '315'}" 
					font-family="Arial, sans-serif" 
					font-size="${fontSize}" 
					font-weight="bold" 
					fill="white" 
					text-anchor="middle" 
					dominant-baseline="middle"
				>
					${title.length > 50 ? title.substring(0, 47) + '...' : title}
				</text>
				
				${
					category
						? `
					<!-- Category -->
					<rect x="480" y="350" width="240" height="40" rx="20" fill="rgba(255,255,255,0.2)" />
					<text 
						x="600" 
						y="370" 
						font-family="Arial, sans-serif" 
						font-size="28px" 
						fill="white" 
						text-anchor="middle" 
						dominant-baseline="middle"
					>
						${category}
					</text>
				`
						: ''
				}
				
				<!-- Site Name -->
				<text 
					x="1120" 
					y="570" 
					font-family="Arial, sans-serif" 
					font-size="24px" 
					fill="white" 
					opacity="0.8" 
					text-anchor="end"
				>
					My Notes
				</text>
			</svg>
		`;

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (e) {
		console.error('Post OGP image generation error:', e);
		throw error(500, 'Failed to generate post OGP image');
	}
};
