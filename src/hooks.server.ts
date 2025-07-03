import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { json } from '@sveltejs/kit';

// 管理用API認証チェック
const adminApiAuth: Handle = async ({ event, resolve }) => {
	// 管理用APIパスの場合のみ認証チェック
	if (event.url.pathname.startsWith('/api/admin/')) {
		const session = await event.locals.getSession?.();

		if (!session?.user) {
			return json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
		}
	}

	return resolve(event);
};

// セキュリティヘッダーの設定
const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Lighthouse Best Practicesに準拠したセキュリティヘッダー
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-XSS-Protection', '1; mode=block');

	// Content Security Policy (CSP)
	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https: blob:",
		"connect-src 'self' https://api.github.com https://vercel.live",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'"
	].join('; ');

	response.headers.set('Content-Security-Policy', cspDirectives);

	// HTTPS強制（本番環境のみ）
	if (event.url.hostname !== 'localhost' && event.url.protocol === 'http:') {
		return Response.redirect(
			`https://${event.url.host}${event.url.pathname}${event.url.search}`,
			301
		);
	}

	// パフォーマンス最適化のためのヘッダー
	if (event.url.pathname.startsWith('/_app/immutable/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	}

	// APIレスポンスのキャッシュ設定
	if (event.url.pathname.startsWith('/api/') && event.request.method === 'GET') {
		response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
	}

	// 静的アセットのキャッシュ設定
	if (event.url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/)) {
		response.headers.set('Cache-Control', 'public, max-age=31536000');
	}

	return response;
};

// パフォーマンス監視
const monitoringHandle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();

	const response = await resolve(event);

	// パフォーマンス監視（開発環境でのみログ出力）
	if (process.env.NODE_ENV === 'development') {
		const duration = Date.now() - startTime;
		if (duration > 1000) {
			console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
		}
	}

	return response;
};

export const handle: Handle = sequence(authHandle, adminApiAuth, securityHandle, monitoringHandle);
