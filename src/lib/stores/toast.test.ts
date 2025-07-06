import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	toasts,
	addToast,
	removeToast,
	clearToasts,
	showSuccess,
	showError,
	showInfo,
	showWarning,
	type ToastMessage
} from './toast';

describe('toast store', () => {
	beforeEach(() => {
		clearToasts();
	});

	describe('toasts store', () => {
		it('should have initial value of empty array', () => {
			expect(get(toasts)).toEqual([]);
		});

		it('should be reactive to changes', () => {
			const values: ToastMessage[][] = [];

			const unsubscribe = toasts.subscribe((value) => {
				values.push([...value]);
			});

			addToast('Test message', 'info');
			clearToasts();

			expect(values).toHaveLength(3); // initial, after add, after clear
			expect(values[0]).toEqual([]);
			expect(values[1]).toHaveLength(1);
			expect(values[2]).toEqual([]);

			unsubscribe();
		});
	});

	describe('addToast', () => {
		it('should add toast with default type and duration', () => {
			const id = addToast('Test message');
			const toastList = get(toasts);

			expect(toastList).toHaveLength(1);
			expect(toastList[0]).toEqual({
				id,
				message: 'Test message',
				type: 'info',
				duration: 5000
			});
			expect(id).toMatch(/^toast-\d+$/);
		});

		it('should add toast with custom type and duration', () => {
			const id = addToast('Error message', 'error', 3000);
			const toastList = get(toasts);

			expect(toastList).toHaveLength(1);
			expect(toastList[0]).toEqual({
				id,
				message: 'Error message',
				type: 'error',
				duration: 3000
			});
		});

		it('should generate unique IDs for multiple toasts', () => {
			const id1 = addToast('First message');
			const id2 = addToast('Second message');
			const id3 = addToast('Third message');

			expect(id1).not.toBe(id2);
			expect(id2).not.toBe(id3);
			expect(id1).not.toBe(id3);

			const toastList = get(toasts);
			expect(toastList).toHaveLength(3);
		});

		it('should add toasts to the end of the list', () => {
			addToast('First');
			addToast('Second');
			addToast('Third');

			const toastList = get(toasts);
			expect(toastList[0].message).toBe('First');
			expect(toastList[1].message).toBe('Second');
			expect(toastList[2].message).toBe('Third');
		});
	});

	describe('removeToast', () => {
		it('should remove toast by id', () => {
			const id1 = addToast('First message');
			const id2 = addToast('Second message');

			expect(get(toasts)).toHaveLength(2);

			removeToast(id1);

			const toastList = get(toasts);
			expect(toastList).toHaveLength(1);
			expect(toastList[0].id).toBe(id2);
			expect(toastList[0].message).toBe('Second message');
		});

		it('should handle non-existent toast id gracefully', () => {
			addToast('Test message');

			expect(get(toasts)).toHaveLength(1);

			removeToast('non-existent-id');

			expect(get(toasts)).toHaveLength(1);
		});

		it('should handle empty toast list', () => {
			expect(get(toasts)).toHaveLength(0);

			expect(() => removeToast('any-id')).not.toThrow();

			expect(get(toasts)).toHaveLength(0);
		});
	});

	describe('clearToasts', () => {
		it('should clear all toasts', () => {
			addToast('First');
			addToast('Second');
			addToast('Third');

			expect(get(toasts)).toHaveLength(3);

			clearToasts();

			expect(get(toasts)).toEqual([]);
		});

		it('should handle empty toast list', () => {
			expect(get(toasts)).toHaveLength(0);

			expect(() => clearToasts()).not.toThrow();

			expect(get(toasts)).toHaveLength(0);
		});
	});

	describe('convenience functions', () => {
		describe('showSuccess', () => {
			it('should add success toast with default duration', () => {
				const id = showSuccess('Success message');
				const toastList = get(toasts);

				expect(toastList).toHaveLength(1);
				expect(toastList[0]).toEqual({
					id,
					message: 'Success message',
					type: 'success',
					duration: 5000
				});
			});

			it('should add success toast with custom duration', () => {
				const id = showSuccess('Success message', 3000);
				const toastList = get(toasts);

				expect(toastList[0]).toEqual({
					id,
					message: 'Success message',
					type: 'success',
					duration: 3000
				});
			});
		});

		describe('showError', () => {
			it('should add error toast with default duration', () => {
				const id = showError('Error message');
				const toastList = get(toasts);

				expect(toastList).toHaveLength(1);
				expect(toastList[0]).toEqual({
					id,
					message: 'Error message',
					type: 'error',
					duration: 5000
				});
			});

			it('should add error toast with custom duration', () => {
				const id = showError('Error message', 8000);
				const toastList = get(toasts);

				expect(toastList[0]).toEqual({
					id,
					message: 'Error message',
					type: 'error',
					duration: 8000
				});
			});
		});

		describe('showInfo', () => {
			it('should add info toast with default duration', () => {
				const id = showInfo('Info message');
				const toastList = get(toasts);

				expect(toastList).toHaveLength(1);
				expect(toastList[0]).toEqual({
					id,
					message: 'Info message',
					type: 'info',
					duration: 5000
				});
			});

			it('should add info toast with custom duration', () => {
				const id = showInfo('Info message', 2000);
				const toastList = get(toasts);

				expect(toastList[0]).toEqual({
					id,
					message: 'Info message',
					type: 'info',
					duration: 2000
				});
			});
		});

		describe('showWarning', () => {
			it('should add warning toast with default duration', () => {
				const id = showWarning('Warning message');
				const toastList = get(toasts);

				expect(toastList).toHaveLength(1);
				expect(toastList[0]).toEqual({
					id,
					message: 'Warning message',
					type: 'warning',
					duration: 5000
				});
			});

			it('should add warning toast with custom duration', () => {
				const id = showWarning('Warning message', 4000);
				const toastList = get(toasts);

				expect(toastList[0]).toEqual({
					id,
					message: 'Warning message',
					type: 'warning',
					duration: 4000
				});
			});
		});
	});

	describe('type safety', () => {
		it('should accept all valid toast types', () => {
			expect(() => addToast('Test', 'success')).not.toThrow();
			expect(() => addToast('Test', 'error')).not.toThrow();
			expect(() => addToast('Test', 'info')).not.toThrow();
			expect(() => addToast('Test', 'warning')).not.toThrow();
		});
	});
});
