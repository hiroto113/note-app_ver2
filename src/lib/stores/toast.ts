import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

export const toasts = writable<ToastMessage[]>([]);

let toastId = 0;

export function addToast(message: string, type: ToastMessage['type'] = 'info', duration = 5000) {
	const id = `toast-${++toastId}`;
	const toast: ToastMessage = { id, message, type, duration };

	toasts.update((list) => [...list, toast]);

	return id;
}

export function removeToast(id: string) {
	toasts.update((list) => list.filter((toast) => toast.id !== id));
}

export function clearToasts() {
	toasts.set([]);
}

// 便利な関数
export function showSuccess(message: string, duration?: number) {
	return addToast(message, 'success', duration);
}

export function showError(message: string, duration?: number) {
	return addToast(message, 'error', duration);
}

export function showInfo(message: string, duration?: number) {
	return addToast(message, 'info', duration);
}

export function showWarning(message: string, duration?: number) {
	return addToast(message, 'warning', duration);
}
