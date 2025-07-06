import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { loading, setLoading, withLoading } from './loading';

describe('loading store', () => {
	beforeEach(() => {
		// Reset store to initial state
		setLoading(false);
	});

	describe('loading store', () => {
		it('should have initial value of false', () => {
			expect(get(loading)).toBe(false);
		});

		it('should be reactive to changes', () => {
			const values: boolean[] = [];
			
			const unsubscribe = loading.subscribe(value => {
				values.push(value);
			});

			setLoading(true);
			setLoading(false);

			expect(values).toEqual([false, true, false]);
			
			unsubscribe();
		});
	});

	describe('setLoading', () => {
		it('should set loading to true', () => {
			setLoading(true);
			expect(get(loading)).toBe(true);
		});

		it('should set loading to false', () => {
			setLoading(true);
			setLoading(false);
			expect(get(loading)).toBe(false);
		});
	});

	describe('withLoading', () => {
		it('should set loading true during promise execution', async () => {
			const promise = new Promise<string>((resolve) => {
				setTimeout(() => resolve('test'), 100);
			});

			const loadingPromise = withLoading(promise);
			
			// Should be loading immediately
			expect(get(loading)).toBe(true);

			const result = await loadingPromise;
			
			// Should not be loading after completion
			expect(get(loading)).toBe(false);
			expect(result).toBe('test');
		});

		it('should set loading false even when promise rejects', async () => {
			const promise = new Promise<string>((_, reject) => {
				setTimeout(() => reject(new Error('test error')), 100);
			});

			try {
				await withLoading(promise);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('test error');
			}

			// Should not be loading after rejection
			expect(get(loading)).toBe(false);
		});

		it('should handle already resolved promise', async () => {
			const promise = Promise.resolve('immediate');
			
			const result = await withLoading(promise);
			
			expect(result).toBe('immediate');
			expect(get(loading)).toBe(false);
		});

		it('should handle already rejected promise', async () => {
			const promise = Promise.reject(new Error('immediate error'));
			
			try {
				await withLoading(promise);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('immediate error');
			}

			expect(get(loading)).toBe(false);
		});

		it('should handle multiple concurrent promises', async () => {
			const promise1 = new Promise<string>((resolve) => {
				setTimeout(() => resolve('first'), 50);
			});
			
			const promise2 = new Promise<string>((resolve) => {
				setTimeout(() => resolve('second'), 100);
			});

			// Start both promises
			const loadingPromise1 = withLoading(promise1);
			const loadingPromise2 = withLoading(promise2);

			expect(get(loading)).toBe(true);

			const [result1, result2] = await Promise.all([loadingPromise1, loadingPromise2]);

			expect(result1).toBe('first');
			expect(result2).toBe('second');
			expect(get(loading)).toBe(false);
		});
	});
});