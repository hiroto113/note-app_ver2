import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = authHandle;
