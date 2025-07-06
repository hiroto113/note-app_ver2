import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { preloadFonts, getFontDisplayClass, observeFontLoading, criticalFontCSS } from './fonts';

describe('fonts utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.clearAllTimers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('preloadFonts', () => {
		it('should return undefined (no-op function)', () => {
			const result = preloadFonts();
			expect(result).toBeUndefined();
		});
	});

	describe('getFontDisplayClass', () => {
		it('should return font display class', () => {
			const className = getFontDisplayClass();
			expect(className).toBe('font-display-swap');
		});
	});

	describe('observeFontLoading', () => {
		it('should call callback when fonts are ready', () => {
			const callback = vi.fn();
			const mockFonts = {
				ready: Promise.resolve()
			};

			Object.defineProperty(document, 'fonts', {
				writable: true,
				configurable: true,
				value: mockFonts
			});

			observeFontLoading(callback);

			return Promise.resolve().then(() => {
				expect(callback).toHaveBeenCalled();
			});
		});

		it('should use fallback timeout when Font Loading API is not available', () => {
			const callback = vi.fn();

			// Remove fonts API
			const originalFonts = document.fonts;
			// @ts-ignore
			delete document.fonts;

			observeFontLoading(callback);

			vi.advanceTimersByTime(3000);

			expect(callback).toHaveBeenCalled();

			// Restore fonts API
			Object.defineProperty(document, 'fonts', {
				writable: true,
				configurable: true,
				value: originalFonts
			});
		});

		it('should handle callback being undefined', () => {
			const mockFonts = {
				ready: Promise.resolve()
			};

			Object.defineProperty(document, 'fonts', {
				writable: true,
				configurable: true,
				value: mockFonts
			});

			expect(() => observeFontLoading()).not.toThrow();
		});

		it('should handle server-side rendering (no document)', () => {
			const originalDocument = global.document;
			// @ts-ignore
			global.document = undefined;

			const callback = vi.fn();

			expect(() => observeFontLoading(callback)).not.toThrow();
			expect(callback).not.toHaveBeenCalled();

			global.document = originalDocument;
		});
	});

	describe('criticalFontCSS', () => {
		it('should be an empty string', () => {
			expect(criticalFontCSS).toBe('');
		});
	});
});
