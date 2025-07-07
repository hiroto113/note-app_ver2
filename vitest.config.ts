import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Test inclusion patterns - optimized for parallel execution
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/integration/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**', 'tests/**/*.spec.ts'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts', './tests/integration/setup.ts'],
		watch: false,
		testTimeout: 15000, // Increased for CI stability
		hookTimeout: 15000, // Increased for setup/teardown
		
		// Parallel execution strategy - conditional based on test type
		fileParallelism: process.env.CI ? false : true, // Disable in CI for stability
		poolOptions: {
			threads: {
				// Single thread for database tests in CI, parallel locally
				singleThread: process.env.CI ? true : false,
				minThreads: 1,
				maxThreads: process.env.CI ? 1 : 4
			}
		},
		sequence: {
			setupFiles: 'list',
			// Shuffle tests in local dev for better coverage
			shuffle: process.env.CI ? false : true
		},
		
		// Environment configuration
		env: {
			DATABASE_URL: process.env.DATABASE_URL || 'file:./test.db',
			TEST_DB_PATH: process.env.TEST_DB_PATH,
			NODE_ENV: 'test',
			CI: process.env.CI || 'false'
		},
		
		// Test filtering and optimization
		testNamePattern: process.env.VITEST_TEST_PATTERN,
		bail: process.env.CI ? 1 : 0, // Fail fast in CI
		
		// Coverage configuration with enhanced reporting
		coverage: {
			provider: 'v8',
			reporter: process.env.CI 
				? ['text', 'json-summary', 'lcov'] 
				: ['text', 'json', 'html'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,js,svelte}'],
			exclude: [
				'src/**/*.test.{ts,js}',
				'src/**/*.spec.{ts,js}',
				'src/app.html',
				'src/app.d.ts',
				'src/hooks.server.ts',
				'src/routes/**/*.server.ts',
				'src/lib/server/seed.ts',
				'src/lib/server/db/migrations/**'
			],
			// Enhanced thresholds for quality gates
			thresholds: {
				global: {
					branches: process.env.CI ? 85 : 80,
					functions: process.env.CI ? 85 : 80,
					lines: process.env.CI ? 85 : 80,
					statements: process.env.CI ? 85 : 80
				}
			},
			// Skip coverage in CI if too slow
			skipFull: process.env.CI_SKIP_COVERAGE === 'true'
		},
		
		// Reporting configuration
		reporter: process.env.CI 
			? ['verbose', 'github-actions']
			: ['default'],
		
		// Output configuration for CI
		outputFile: {
			json: './test-results/results.json',
			junit: './test-results/junit.xml'
		}
	}
});
