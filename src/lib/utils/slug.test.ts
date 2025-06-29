import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
	it('should generate basic slug from English title', () => {
		expect(generateSlug('Hello World')).toBe('hello-world');
	});

	it('should handle Japanese characters', () => {
		expect(generateSlug('こんにちは 世界')).toBe('');
	});

	it('should handle mixed content', () => {
		expect(generateSlug('Hello こんにちは World')).toBe('hello-world');
	});

	it('should handle special characters', () => {
		expect(generateSlug('Hello-World!@#$%')).toBe('hello-world');
	});

	it('should handle multiple spaces and hyphens', () => {
		expect(generateSlug('Hello   World---Test')).toBe('hello-world-test');
	});

	it('should handle empty string', () => {
		expect(generateSlug('')).toBe('');
	});

	it('should limit length to 100 characters', () => {
		const longTitle = 'a'.repeat(150);
		const result = generateSlug(longTitle);
		expect(result.length).toBeLessThanOrEqual(100);
	});
});
