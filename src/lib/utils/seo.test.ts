import { describe, it, expect } from 'vitest';
import {
	truncateText,
	generateSeoTitle,
	generateSeoDescription,
	generateMetaFromContent,
	generateBreadcrumbs
} from './seo';

describe('seo utilities', () => {
	describe('truncateText', () => {
		it('should return text as-is if shorter than max length', () => {
			expect(truncateText('short text', 20)).toBe('short text');
		});

		it('should truncate text and add ellipsis if longer than max length', () => {
			expect(truncateText('this is a very long text that should be truncated', 20)).toBe(
				'this is a very lo...'
			);
		});

		it('should handle empty string', () => {
			expect(truncateText('', 10)).toBe('');
		});

		it('should handle null/undefined', () => {
			expect(truncateText(null as any, 10)).toBe('');
			expect(truncateText(undefined as any, 10)).toBe('');
		});
	});

	describe('generateSeoTitle', () => {
		it('should combine title and site name', () => {
			expect(generateSeoTitle('Test Article', 'My Site')).toBe('Test Article | My Site');
		});

		it('should return just title if no site name', () => {
			expect(generateSeoTitle('Test Article', '')).toBe('Test Article');
		});

		it('should truncate long titles', () => {
			const longTitle = 'This is a very long title that should be truncated';
			const result = generateSeoTitle(longTitle, 'My Site');
			expect(result.length).toBeLessThanOrEqual(60);
		});
	});

	describe('generateSeoDescription', () => {
		it('should remove HTML tags', () => {
			const html = '<p>This is a <strong>test</strong> paragraph.</p>';
			expect(generateSeoDescription(html)).toBe('This is a test paragraph.');
		});

		it('should convert newlines to spaces', () => {
			const multiline = 'First line\nSecond line\nThird line';
			expect(generateSeoDescription(multiline)).toBe('First line Second line Third line');
		});

		it('should truncate to 160 characters', () => {
			const longText = 'a'.repeat(200);
			const result = generateSeoDescription(longText);
			expect(result.length).toBeLessThanOrEqual(160);
		});

		it('should handle empty string', () => {
			expect(generateSeoDescription('')).toBe('');
		});
	});

	describe('generateMetaFromContent', () => {
		it('should extract description from first paragraph', () => {
			const content = '# Title\n\nThis is the first paragraph.\n\nThis is the second paragraph.';
			const result = generateMetaFromContent(content, 'Test Title');
			expect(result.description).toBe('This is the first paragraph.');
		});

		it('should fallback to title if no content', () => {
			const result = generateMetaFromContent('', 'Test Title');
			expect(result.description).toBe('Test Title');
		});

		it('should return empty if both content and title are empty', () => {
			const result = generateMetaFromContent('', '');
			expect(result.description).toBe('');
			expect(result.keywords).toBe('');
		});

		it('should extract keywords from content', () => {
			const content = 'JavaScript プログラミング 学習 JavaScript 開発 プログラミング';
			const result = generateMetaFromContent(content, 'Test');
			expect(result.keywords).toContain('JavaScript');
			expect(result.keywords).toContain('プログラミング');
		});
	});

	describe('generateBreadcrumbs', () => {
		it('should generate breadcrumbs for simple path', () => {
			const breadcrumbs = generateBreadcrumbs('/posts/test-article', 'https://example.com');
			expect(breadcrumbs).toHaveLength(3);
			expect(breadcrumbs[0]).toEqual({ name: 'ホーム', url: 'https://example.com' });
			expect(breadcrumbs[1]).toEqual({ name: '記事', url: 'https://example.com/posts' });
			expect(breadcrumbs[2]).toEqual({
				name: 'test-article',
				url: 'https://example.com/posts/test-article'
			});
		});

		it('should handle root path', () => {
			const breadcrumbs = generateBreadcrumbs('/', 'https://example.com');
			expect(breadcrumbs).toHaveLength(1);
			expect(breadcrumbs[0]).toEqual({ name: 'ホーム', url: 'https://example.com' });
		});

		it('should handle admin paths', () => {
			const breadcrumbs = generateBreadcrumbs('/admin/posts', 'https://example.com');
			expect(breadcrumbs).toHaveLength(3);
			expect(breadcrumbs[1].name).toBe('管理画面');
		});
	});
});