import { describe, it, expect } from 'vitest';
import { generateOGPImageUrl, optimizeOGPDescription, optimizeOGPTitle } from './ogp';

describe('OGP Utils', () => {
	describe('generateOGPImageUrl', () => {
		it('should generate default OGP image URL', () => {
			const url = generateOGPImageUrl('https://example.com', {
				title: 'Test Title',
				category: 'Tech'
			});
			expect(url).toBe('https://example.com/api/og?title=Test+Title&category=Tech&type=default');
		});

		it('should generate article OGP image URL with slug', () => {
			const url = generateOGPImageUrl('https://example.com', {
				title: 'Test Article',
				type: 'article',
				slug: 'test-article'
			});
			expect(url).toBe('https://example.com/api/og/test-article');
		});

		it('should handle special characters in title', () => {
			const url = generateOGPImageUrl('https://example.com', {
				title: 'Title with & special chars',
				category: 'カテゴリ'
			});
			expect(url).toContain('Title+with+%26+special+chars');
		});
	});

	describe('optimizeOGPDescription', () => {
		it('should return original text if under max length', () => {
			const result = optimizeOGPDescription('Short description', 160);
			expect(result).toBe('Short description');
		});

		it('should truncate long text with ellipsis', () => {
			const longText = 'A'.repeat(200);
			const result = optimizeOGPDescription(longText, 160);
			expect(result).toHaveLength(160);
			expect(result.endsWith('...')).toBe(true);
		});

		it('should remove HTML tags', () => {
			const htmlText = '<p>This is <strong>bold</strong> text</p>';
			const result = optimizeOGPDescription(htmlText);
			expect(result).toBe('This is bold text');
		});

		it('should normalize whitespace', () => {
			const messyText = 'Text  with\n\tmultiple   spaces';
			const result = optimizeOGPDescription(messyText);
			expect(result).toBe('Text with multiple spaces');
		});

		it('should handle empty or null input', () => {
			expect(optimizeOGPDescription('')).toBe('');
			expect(optimizeOGPDescription(null as any)).toBe('');
		});
	});

	describe('optimizeOGPTitle', () => {
		it('should return title only if under max length', () => {
			const result = optimizeOGPTitle('Short Title', 'Site Name', 60);
			expect(result).toBe('Short Title - Site Name');
		});

		it('should truncate title if combined length exceeds max', () => {
			const longTitle = 'This is a very long title that exceeds the maximum length';
			const result = optimizeOGPTitle(longTitle, 'Site', 60);
			expect(result).toHaveLength(60);
			expect(result.endsWith('... - Site')).toBe(true);
		});

		it('should handle title without site name', () => {
			const result = optimizeOGPTitle('Title Only');
			expect(result).toBe('Title Only');
		});

		it('should truncate title-only if it exceeds max length', () => {
			const longTitle = 'A'.repeat(70);
			const result = optimizeOGPTitle(longTitle, undefined, 60);
			expect(result).toHaveLength(60);
			expect(result.endsWith('...')).toBe(true);
		});

		it('should return site name if title is empty', () => {
			const result = optimizeOGPTitle('', 'Site Name');
			expect(result).toBe('Site Name');
		});
	});
});