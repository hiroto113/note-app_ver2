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

export const handle: Handle = sequence(authHandle, adminApiAuth);
