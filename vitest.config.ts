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
		env: {
			DATABASE_URL: ':memory:'
		}
	}
});
