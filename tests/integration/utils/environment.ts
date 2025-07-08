/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Environment-specific configuration for database tests
 * Handles differences between local, CI, and different OS environments
 */

export interface DatabaseConfig {
	url: string;
	isTemporary: boolean;
	cleanup: boolean;
}

/**
 * Get database configuration based on current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
	const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
	const nodeEnv = process.env.NODE_ENV;
	const testDbPath = process.env.TEST_DB_PATH;

	// CI Environment
	if (isCI) {
		return {
			url: process.env.DATABASE_URL || 'file:./ci_test.db',
			isTemporary: true,
			cleanup: true
		};
	}

	// Test Environment (local)
	if (nodeEnv === 'test') {
		if (testDbPath) {
			return {
				url: `file:${testDbPath}`,
				isTemporary: true,
				cleanup: true
			};
		}

		// Generate unique database name for parallel test runs
		const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		return {
			url: `file:./test_${uniqueId}.db`,
			isTemporary: true,
			cleanup: true
		};
	}

	// Development fallback
	return {
		url: process.env.DATABASE_URL || 'file:./dev_test.db',
		isTemporary: false,
		cleanup: false
	};
}

/**
 * Check if current environment supports file-based databases
 */
export async function supportsFileDatabase(): Promise<boolean> {
	try {
		// Check if we can write to current directory
		const fs = await import('fs');
		const testFile = './db_write_test.tmp';
		fs.writeFileSync(testFile, 'test');
		fs.unlinkSync(testFile);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get optimal database URL for current environment
 */
export function getOptimalDatabaseUrl(): string {
	const config = getDatabaseConfig();

	// Fallback to in-memory if file system is not available
	if (!supportsFileDatabase() && config.isTemporary) {
		console.warn('File system not writable, falling back to in-memory database');
		return ':memory:';
	}

	return config.url;
}

/**
 * Environment detection utilities
 */
export const Environment = {
	isCI: () => process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
	isTest: () => process.env.NODE_ENV === 'test',
	isDevelopment: () => process.env.NODE_ENV === 'development',
	isProduction: () => process.env.NODE_ENV === 'production',

	// Platform detection
	isWindows: () => process.platform === 'win32',
	isMacOS: () => process.platform === 'darwin',
	isLinux: () => process.platform === 'linux',

	// Runtime detection
	isNode: () => typeof process !== 'undefined' && process.versions?.node,
	isBrowser: () => typeof window !== 'undefined'
} as const;
