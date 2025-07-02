import { writable } from 'svelte/store';

export const loading = writable<boolean>(false);

export function setLoading(isLoading: boolean) {
	loading.set(isLoading);
}

export function withLoading<T>(promise: Promise<T>): Promise<T> {
	setLoading(true);
	return promise.finally(() => setLoading(false));
}
