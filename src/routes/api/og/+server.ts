import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const title = url.searchParams.get('title') || 'My Notes';
		const category = url.searchParams.get('category') || '';

		// タイトルの長さに応じてフォントサイズを調整
		const fontSize = title.length > 40 ? '48px' : '64px';

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
		console.error('OGP image generation error:', e);
		throw error(500, 'Failed to generate OGP image');
	}
};
