import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html'], ['json', { outputFile: 'test-results/e2e-results.json' }], ['github']],
	use: {
		baseURL: 'http://localhost:4174', // Use preview server for E2E tests
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: 10000,
		navigationTimeout: 30000
	},

	projects: [
		{
			name: 'setup',
			testMatch: '**/setup.ts'
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup']
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			dependencies: ['setup']
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			dependencies: ['setup']
		},
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] },
			dependencies: ['setup']
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 12'] },
			dependencies: ['setup']
		}
	],

	webServer: {
		command: 'pnpm run build && pnpm run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000 // 2 minutes
	}
});
