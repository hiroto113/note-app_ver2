import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
	await page.goto('/');
	
	// Check if the page loads without critical errors
	const response = await page.waitForResponse(resp => resp.url().includes('/') && resp.status() === 200);
	expect(response.status()).toBe(200);
});

test('login page is accessible', async ({ page }) => {
	await page.goto('/login');
	
	// Check if login page loads
	const response = await page.waitForResponse(resp => resp.url().includes('/login') && resp.status() === 200);
	expect(response.status()).toBe(200);
});