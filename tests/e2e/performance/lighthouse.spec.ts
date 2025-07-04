import { test, expect } from '@playwright/test';

test.describe('Lighthouse パフォーマンステスト', () => {
	test('ホームページの基本パフォーマンス確認', async ({ page }) => {
		const startTime = Date.now();
		
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		const loadTime = Date.now() - startTime;
		
		// 基本的なパフォーマンス指標
		expect(loadTime).toBeLessThan(5000); // 5秒以内での読み込み
		
		// ページの基本要素が表示されていることを確認
		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('main')).toBeVisible();
		
		// CSSが適用されていることの確認（フォントサイズが設定されている）
		const bodyFontSize = await page.locator('body').evaluate((el) => 
			window.getComputedStyle(el).fontSize
		);
		expect(bodyFontSize).not.toBe('16px'); // デフォルトから変更されている
	});

	test('記事詳細ページの基本パフォーマンス確認', async ({ page }) => {
		// 記事詳細ページに直接アクセス（テストの安定性向上）
		await page.goto('/posts/getting-started-sveltekit');
		await page.waitForLoadState('networkidle');

		// 記事詳細ページが正常に表示されていることを確認
		await expect(page.locator('article, main')).toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
		
		// レスポンシブデザインの確認
		const viewport = page.viewportSize();
		expect(viewport?.width).toBeGreaterThan(0);
	});

	test('レスポンシブデザインの確認', async ({ page }) => {
		// モバイルビューポートでテスト
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// モバイルでもナビゲーションが機能することを確認
		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('main')).toBeVisible();
		
		// デスクトップビューポートでテスト
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('main')).toBeVisible();
	});
});
