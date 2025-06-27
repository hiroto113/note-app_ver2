import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireAuth(event: RequestEvent) {
	const session = await event.locals.getSession();
	
	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}
	
	return session.user;
}