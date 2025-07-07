import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/integration/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**', 'tests/**/*.spec.ts'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts', './tests/integration/setup.ts'],
		watch: false,
		testTimeout: 10000, // 10 seconds for integration tests
		hookTimeout: 10000, // 10 seconds for setup/teardown
		// Database test optimizations
		fileParallelism: false, // Disable parallel test file execution for database tests
		poolOptions: {
			threads: {
				singleThread: true // All tests in one thread to avoid database conflicts
			}
		},
		sequence: {
			setupFiles: 'list' // Sequential setup execution to prevent race conditions
		},
		env: {
			DATABASE_URL: 'file:./test.db',
			NODE_ENV: 'test'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,js,svelte}'],
			exclude: [
				'src/**/*.test.{ts,js}',
				'src/**/*.spec.{ts,js}',
				'src/app.html',
				'src/app.d.ts',
				'src/hooks.server.ts',
				'src/routes/**/*.server.ts',
				'src/lib/server/seed.ts'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		}
	}
});
