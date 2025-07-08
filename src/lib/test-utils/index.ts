/**
 * Test Utilities - Central Export Point
 * 2025 Best Practice: Consolidated test utilities for easy imports
 */

// Legacy test utilities (maintaining backward compatibility)
export * from './test-data';
export * from './auth-mock';
export * from './database-mock';
export * from './api-mock';

// New 2025 factory system
export * from './factories';
export { default as factories } from './factories';

// New fixtures system
export * from './fixtures';
export { default as TestFixtures, createTestFixtures, testScenarios } from './fixtures';

// Test helper utilities
export const testUtils = {
	/**
	 * Generate a unique test ID
	 */
	generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

	/**
	 * Wait for a specified amount of time (useful for async tests)
	 */
	wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

	/**
	 * Create a test date that's relative to now
	 */
	testDate: {
		now: () => new Date(),
		minutesAgo: (minutes: number) => new Date(Date.now() - minutes * 60 * 1000),
		hoursAgo: (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000),
		daysAgo: (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
		weeksAgo: (weeks: number) => new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000),
		minutesFromNow: (minutes: number) => new Date(Date.now() + minutes * 60 * 1000),
		hoursFromNow: (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000),
		daysFromNow: (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
	},

	/**
	 * Generate realistic test content
	 */
	content: {
		title: (prefix = 'Test') => `${prefix} ${testUtils.generateTestId()}`,
		slug: (title: string) =>
			title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, ''),
		excerpt: (title: string) => `This is a test excerpt for ${title}.`,
		markdown: (title: string) =>
			`# ${title}\n\nThis is test content for ${title}.\n\n## Section\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`
	},

	/**
	 * Email and user utilities
	 */
	user: {
		email: (username = 'test') => `${username}@example.com`,
		username: (prefix = 'user') => `${prefix}_${Date.now()}`,
		fullName: (first = 'Test', last = 'User') => `${first} ${last}`
	},

	/**
	 * File and media utilities
	 */
	media: {
		filename: (extension = 'jpg') => `test-file-${Date.now()}.${extension}`,
		mimeType: (type = 'image') => {
			const mimeTypes = {
				image: 'image/jpeg',
				video: 'video/mp4',
				audio: 'audio/mp3',
				document: 'application/pdf'
			};
			return mimeTypes[type as keyof typeof mimeTypes] || 'application/octet-stream';
		},
		size: (minKB = 100, maxKB = 1000) =>
			Math.floor(Math.random() * (maxKB - minKB) + minKB) * 1024
	},

	/**
	 * Quality metrics utilities
	 */
	metrics: {
		lighthouseScore: (min = 80, max = 100) => Math.floor(Math.random() * (max - min) + min),
		coverage: (min = 70, max = 95) => Math.floor(Math.random() * (max - min) + min),
		performanceTime: (minMs = 500, maxMs = 2000) =>
			Math.floor(Math.random() * (maxMs - minMs) + minMs),
		bundleSize: (minKB = 200, maxKB = 500) =>
			Math.floor(Math.random() * (maxKB - minKB) + minKB) * 1024
	},

	/**
	 * Assert utilities (for use in tests)
	 */
	assert: {
		/**
		 * Check if an object has all required properties
		 */
		hasRequiredProperties: <T extends Record<string, unknown>>(
			obj: T,
			requiredProps: Array<keyof T>
		): boolean => {
			return requiredProps.every((prop) => prop in obj && obj[prop] !== undefined);
		},

		/**
		 * Check if a date is within a range
		 */
		dateWithinRange: (date: Date, minDate: Date, maxDate: Date): boolean => {
			return date >= minDate && date <= maxDate;
		},

		/**
		 * Check if an array has specific length
		 */
		arrayLength: <T>(arr: T[], expectedLength: number): boolean => {
			return Array.isArray(arr) && arr.length === expectedLength;
		}
	}
};

/**
 * Type definitions for test utilities
 */
export type TestUtilsType = typeof testUtils;

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
	PASSWORDS: {
		DEFAULT: 'password',
		ADMIN: 'admin123',
		HASHED_DEFAULT: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // 'password'
	},
	USERS: {
		ADMIN_USERNAME: 'admin',
		TEST_USERNAME: 'testuser'
	},
	CATEGORIES: {
		TECH: {
			name: 'Technology',
			slug: 'technology'
		},
		AI_ML: {
			name: 'AI & Machine Learning',
			slug: 'ai-ml'
		}
	},
	TIMEOUTS: {
		SHORT: 1000, // 1 second
		MEDIUM: 5000, // 5 seconds
		LONG: 10000 // 10 seconds
	},
	LIMITS: {
		MAX_TITLE_LENGTH: 255,
		MAX_EXCERPT_LENGTH: 500,
		MAX_USERNAME_LENGTH: 50
	}
};

// Note: quickSetup function will be available after importing fixtures
// This is to avoid circular dependency issues
