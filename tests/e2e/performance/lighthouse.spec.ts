import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Lighthouse パフォーマンステスト', () => {
	const thresholds = {
		performance: 90,
		accessibility: 95,
		'best-practices': 90,
		seo: 95
	};

	test('ホームページの Lighthouse スコア', async ({ page }) => {
		await page.goto('/');

		// Lighthouse監査を実行
		await playAudit({
			page,
			thresholds,
			port: 4173
		});
	});

	test('記事詳細ページの Lighthouse スコア', async ({ page }) => {
		// ホームページから記事詳細に移動
		await page.goto('/');
		const firstArticle = page.locator('article, .post-card').first();
		await firstArticle.click();

		// 記事詳細ページのURLを確認
		await expect(page).toHaveURL(/\/posts\/.+/);

		// Lighthouse監査を実行
		await playAudit({
			page,
			thresholds,
			port: 4173
		});
	});

	test('モバイル環境での Lighthouse スコア', async ({ page, browserName }) => {
		// WebKitはモバイルテストをスキップ（Safariのモバイル固有の問題を回避）
		test.skip(browserName === 'webkit', 'WebKit does not support mobile audit properly');

		await page.goto('/');

		// モバイル向けの閾値（パフォーマンスを少し緩和）
		const mobileThresholds = {
			performance: 75, // モバイルでは少し緩い基準
			accessibility: 95,
			'best-practices': 90,
			seo: 95
		};

		await playAudit({
			page,
			thresholds: mobileThresholds,
			port: 4173
		});
	});
});
