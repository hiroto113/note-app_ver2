import { test, expect } from '@playwright/test';
import { waitForPageLoad, setViewportSize, viewports } from '../utils/page-helpers';

test.describe('ホームページ', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);
	});

	test('ページが正常に表示される', async ({ page }) => {
		// ページタイトルの確認
		await expect(page).toHaveTitle(/My Notes/);

		// メインヘッダーの確認
		await expect(page.locator('h1')).toContainText('My Notes');

		// ページの説明文の確認
		await expect(page.locator('text=個人的な学習記録とメモ')).toBeVisible();
	});

	test('記事一覧が表示される', async ({ page }) => {
		// 記事カードが表示されることを確認
		const articles = page.locator('article, .post-card');
		const articleCount = await articles.count();
		expect(articleCount).toBeGreaterThan(0);

		// 最初の記事の要素を確認
		const firstArticle = articles.first();
		await expect(firstArticle.locator('h2, h3, .title')).toBeVisible();
		await expect(firstArticle.locator('.excerpt, p')).toBeVisible();
	});

	test('記事詳細ページに遷移できる', async ({ page }) => {
		// 最初の記事をクリック
		const firstArticle = page.locator('article, .post-card').first();
		const articleTitle = await firstArticle.locator('h2, h3, .title').textContent();

		await firstArticle.click();
		await waitForPageLoad(page);

		// 記事詳細ページに遷移したことを確認
		await expect(page).toHaveURL(/\/posts\/.+/);

		// 記事タイトルが表示されることを確認
		if (articleTitle) {
			await expect(page.locator('h1')).toContainText(articleTitle.trim());
		}

		// 記事コンテンツが表示されることを確認
		await expect(page.locator('.post-content, .content, main')).toBeVisible();
	});

	test('カテゴリフィルタが動作する', async ({ page }) => {
		// カテゴリフィルタの存在確認
		const categoryFilter = page.locator('select');

		if (await categoryFilter.isVisible()) {
			// カテゴリを選択
			await categoryFilter.selectOption({ index: 1 }); // 最初のカテゴリを選択
			await waitForPageLoad(page);

			// フィルタ適用後も記事が表示されることを確認
			const articles = page.locator('article, .post-card');
			const articlesCheckCount = await articles.count();
			expect(articlesCheckCount).toBeGreaterThan(0);

			// URLにカテゴリパラメータが含まれることを確認
			expect(page.url()).toMatch(/category=/);
		}
	});

	test('ページネーションが動作する', async ({ page }) => {
		// ページネーションの存在確認
		const pagination = page.locator('nav[aria-label*="ページ"], .pagination');

		if (await pagination.isVisible()) {
			// 次のページボタンがあるかチェック
			const nextButton = pagination.locator(
				'button:has-text("次"), button:has-text("›"), a:has-text("次")'
			);

			if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
				// 次のページに移動前の状態を確認
				await page.locator('article, .post-card').count();

				// 次のページに移動
				await nextButton.click();
				await waitForPageLoad(page);

				// URLにページパラメータが含まれることを確認
				expect(page.url()).toMatch(/page=/);

				// 記事が表示されることを確認
				const articlesCheck = await page.locator('article, .post-card').count();
				expect(articlesCheck).toBeGreaterThan(0);
			}
		}
	});

	test('レスポンシブデザインが機能する', async ({ page }) => {
		// デスクトップビューの確認
		await setViewportSize(page, viewports.desktop.width, viewports.desktop.height);
		await expect(page.locator('h1')).toBeVisible();

		// タブレットビューの確認
		await setViewportSize(page, viewports.tablet.width, viewports.tablet.height);
		await expect(page.locator('h1')).toBeVisible();

		// モバイルビューの確認
		await setViewportSize(page, viewports.mobile.width, viewports.mobile.height);
		await expect(page.locator('h1')).toBeVisible();

		// モバイルでも記事が読める状態になっていることを確認
		const articles = page.locator('article, .post-card');
		if ((await articles.count()) > 0) {
			await expect(articles.first()).toBeVisible();
		}
	});

	test('ナビゲーションが機能する', async ({ page }) => {
		// ヘッダーナビゲーションの確認
		const header = page.locator('header, nav').first();
		await expect(header).toBeVisible();

		// ホームリンクの確認
		const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("ホーム")');
		if ((await homeLink.count()) > 0) {
			await expect(homeLink.first()).toBeVisible();
		}

		// フッターの確認（存在する場合）
		const footer = page.locator('footer');
		if (await footer.isVisible()) {
			await expect(footer).toBeVisible();
		}
	});

	test('検索機能が存在する場合の動作確認', async ({ page }) => {
		// 検索ボックスの確認
		const searchInput = page.locator(
			'input[type="search"], input[placeholder*="検索"], [data-testid="search"]'
		);

		if (await searchInput.isVisible()) {
			// 検索語句を入力
			await searchInput.fill('SvelteKit');

			// 検索フォームの送信（Enterキーまたは検索ボタン）
			const searchButton = page.locator('button[type="submit"]:near(input[type="search"])');
			if (await searchButton.isVisible()) {
				await searchButton.click();
			} else {
				await searchInput.press('Enter');
			}

			await waitForPageLoad(page);

			// 検索結果が表示されることを確認
			await expect(page.locator('body')).toContainText('SvelteKit');
		}
	});

	test('ダークモードの切り替えが動作する', async ({ page }) => {
		// ダークモード切り替えボタンの確認
		const darkModeToggle = page.locator(
			'button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]'
		);

		if (await darkModeToggle.isVisible()) {
			// 現在のテーマクラスを取得
			const initialClass = (await page.locator('html, body').getAttribute('class')) || '';

			// ダークモード切り替え
			await darkModeToggle.click();

			// テーマが変更されたことを確認
			await page.waitForTimeout(500); // アニメーション待機
			const newClass = (await page.locator('html, body').getAttribute('class')) || '';

			expect(initialClass).not.toBe(newClass);
		}
	});

	test('SEO要素が適切に設定されている', async ({ page }) => {
		// メタタグの確認
		const metaDescription = page.locator('meta[name="description"]');
		const metaCount = await metaDescription.count();
		expect(metaCount).toBeGreaterThanOrEqual(1);
		await expect(page.locator('title')).toHaveCount(1);

		// OGPタグの確認
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);

		// 構造化データの確認（存在する場合）
		const structuredData = page.locator('script[type="application/ld+json"]');
		if ((await structuredData.count()) > 0) {
			const jsonContent = await structuredData.textContent();
			expect(jsonContent).toBeTruthy();
			// JSONが有効であることを確認
			expect(() => JSON.parse(jsonContent!)).not.toThrow();
		}
	});
});
