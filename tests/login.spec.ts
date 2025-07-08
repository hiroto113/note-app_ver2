/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

test('basic application health check', async ({ page }) => {
	// Simple connectivity test
	await page.goto('/');

	// Wait for any response that indicates the app is running
	await page.waitForLoadState('networkidle');

	// Basic assertion that the page loaded
	expect(page.url()).toContain('localhost');
});
