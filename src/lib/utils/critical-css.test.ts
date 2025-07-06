import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	criticalCSS,
	inlineCriticalCSS,
	loadNonCriticalCSS,
	optimizeCSSLoading
} from './critical-css';

describe('critical-css utilities', () => {
	let originalCreateElement: typeof document.createElement;
	let originalHead: typeof document.head;
	let originalQuerySelectorAll: typeof document.querySelectorAll;

	beforeEach(() => {
		vi.clearAllMocks();

		// Store originals
		originalCreateElement = document.createElement;
		originalHead = document.head;
		originalQuerySelectorAll = document.querySelectorAll;

		// Mock document methods
		document.createElement = vi.fn().mockImplementation((tagName) => {
			const element = {
				tagName: tagName.toUpperCase(),
				rel: '',
				as: '',
				href: '',
				onload: null as (() => void) | null,
				appendChild: vi.fn()
			} as Partial<HTMLLinkElement>;
			return element as HTMLLinkElement;
		});

		Object.defineProperty(document, 'head', {
			writable: true,
			configurable: true,
			value: {
				appendChild: vi.fn()
			}
		});

		document.querySelectorAll = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// Restore originals
		document.createElement = originalCreateElement;
		Object.defineProperty(document, 'head', {
			writable: true,
			configurable: true,
			value: originalHead
		});
		document.querySelectorAll = originalQuerySelectorAll;
	});

	describe('criticalCSS', () => {
		it('should contain base CSS styles', () => {
			expect(criticalCSS).toContain('box-sizing: border-box');
			expect(criticalCSS).toContain('font-family:');
			expect(criticalCSS).toContain('.container');
			expect(criticalCSS).toContain('header');
			expect(criticalCSS).toContain('nav');
			expect(criticalCSS).toContain('@media (prefers-color-scheme: dark)');
			expect(criticalCSS).toContain('@media (max-width: 768px)');
		});

		it('should include button styles', () => {
			expect(criticalCSS).toContain('.btn');
			expect(criticalCSS).toContain('.btn-primary');
		});

		it('should include typography styles', () => {
			expect(criticalCSS).toContain('h1, h2, h3, h4, h5, h6');
			expect(criticalCSS).toContain('font-size: 2.5rem');
		});
	});

	describe('inlineCriticalCSS', () => {
		it('should wrap critical CSS in style tags', () => {
			const result = inlineCriticalCSS();
			expect(result).toBe(`<style>${criticalCSS}</style>`);
			expect(result).toContain('<style>');
			expect(result).toContain('</style>');
		});
	});

	describe('loadNonCriticalCSS', () => {
		it('should not create link element for default path', () => {
			loadNonCriticalCSS();
			expect(document.createElement).not.toHaveBeenCalled();
		});

		it('should create preload link for custom href', () => {
			const customHref = '/custom/styles.css';

			loadNonCriticalCSS(customHref);

			expect(document.createElement).toHaveBeenCalledWith('link');
			expect(document.head.appendChild).toHaveBeenCalled();
		});

		it('should set up onload handler to change rel to stylesheet', () => {
			const customHref = '/custom/styles.css';
			let linkElement: Partial<HTMLLinkElement>;

			document.createElement = vi.fn().mockImplementation(() => {
				linkElement = {
					rel: '',
					as: '',
					href: '',
					onload: null as (() => void) | null
				};
				return linkElement as HTMLLinkElement;
			});

			loadNonCriticalCSS(customHref);

			expect(linkElement!.rel).toBe('preload');
			expect(linkElement!.as).toBe('style');
			expect(linkElement!.href).toBe(customHref);
			expect(typeof linkElement!.onload).toBe('function');

			// Test onload handler
			if (linkElement!.onload) {
				(linkElement!.onload as any).call(linkElement!);
				expect(linkElement!.rel).toBe('stylesheet');
			}
		});

		it('should handle server-side rendering (no document)', () => {
			const originalDocument = global.document;
			// @ts-expect-error - Testing SSR environment without document
			global.document = undefined;

			expect(() => loadNonCriticalCSS('/test.css')).not.toThrow();

			global.document = originalDocument;
		});
	});

	describe('optimizeCSSLoading', () => {
		it('should handle server-side rendering (no document)', () => {
			const originalDocument = global.document;
			// @ts-expect-error - Testing SSR environment without document
			global.document = undefined;

			expect(() => optimizeCSSLoading()).not.toThrow();

			global.document = originalDocument;
		});

		it('should convert non-critical stylesheets to preload', () => {
			const mockStyleSheets: Partial<HTMLLinkElement>[] = [
				{
					href: 'https://example.com/styles.css',
					rel: 'stylesheet',
					as: '',
					onload: null as (() => void) | null
				},
				{
					href: 'https://example.com/critical.css',
					rel: 'stylesheet',
					as: '',
					onload: null as (() => void) | null
				}
			];

			document.querySelectorAll = vi.fn().mockReturnValue(mockStyleSheets);

			optimizeCSSLoading();

			expect(document.querySelectorAll).toHaveBeenCalledWith('link[rel="stylesheet"]');

			// First stylesheet (non-critical) should be converted
			expect(mockStyleSheets[0].rel).toBe('preload');
			expect(mockStyleSheets[0].as).toBe('style');
			expect(typeof mockStyleSheets[0].onload).toBe('function');

			// Critical stylesheet should remain unchanged
			expect(mockStyleSheets[1].rel).toBe('stylesheet');

			// Test onload handler for first stylesheet
			if (mockStyleSheets[0].onload) {
				(mockStyleSheets[0].onload as any).call(mockStyleSheets[0]);
				expect(mockStyleSheets[0].rel).toBe('stylesheet');
			}
		});

		it('should not modify critical CSS links', () => {
			const mockCriticalSheet: Partial<HTMLLinkElement> = {
				href: 'https://example.com/critical.css',
				rel: 'stylesheet',
				as: '',
				onload: null as (() => void) | null
			};

			document.querySelectorAll = vi.fn().mockReturnValue([mockCriticalSheet]);

			optimizeCSSLoading();

			expect(mockCriticalSheet.rel).toBe('stylesheet');
			expect(mockCriticalSheet.onload).toBeNull();
		});
	});
});
