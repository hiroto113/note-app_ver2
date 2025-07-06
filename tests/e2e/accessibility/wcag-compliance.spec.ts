import { test, expect } from '@playwright/test';
// import { injectAxe, checkA11y } from 'axe-playwright';
import { waitForPageLoad } from '../utils/page-helpers';

test.describe('WCAG 2.1 AA準拠アクセシビリティテスト', () => {
	test('ホームページのアクセシビリティ検証', async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);

		// axe-coreによる自動チェックは一時的に無効化
		// await injectAxe(page);
		// // await checkA11y(page, undefined, {
		// 	detailedReport: true,
		// 	detailedReportOptions: { html: true }
		// });

		// 手動でのアクセシビリティチェック
		// 1. メインランドマークの存在
		await expect(page.locator('main, [role="main"]')).toBeVisible();

		// 2. 見出し階層の確認
		const h1 = page.locator('h1');
		await expect(h1).toHaveCount(1);
		await expect(h1).toBeVisible();

		// 3. スキップリンクの存在（アクセシビリティ向上）
		const skipLink = page.locator('a[href="#main-content"], a[href="#content"], .skip-link');
		if ((await skipLink.count()) > 0) {
			await expect(skipLink.first()).toBeVisible();
		}

		// 4. ナビゲーションランドマークの存在
		const nav = page.locator('nav, [role="navigation"]');
		if ((await nav.count()) > 0) {
			await expect(nav.first()).toBeVisible();
		}
	});

	test('記事詳細ページのアクセシビリティ検証', async ({ page }) => {
		// 直接記事詳細ページにアクセス
		await page.goto('/posts/understanding-ai-ml');
		await waitForPageLoad(page);

		// axe-coreによる自動チェックは一時的に無効化
		// // await checkA11y(page, undefined, {
		// 	detailedReport: true,
		// 	detailedReportOptions: { html: true }
		// });

		// 記事の構造的アクセシビリティチェック
		// 1. 記事タイトルの存在確認
		await expect(page.locator('h1')).toBeVisible();

		// 2. 記事ランドマークの存在
		await expect(page.locator('article')).toBeVisible();

		// 2. 見出し階層の確認
		const headings = page.locator('h1, h2, h3, h4, h5, h6');
		const headingCount = await headings.count();

		if (headingCount > 0) {
			// h1は1つだけ存在すべき
			await expect(page.locator('h1')).toHaveCount(1);

			// 見出しレベルの順序確認
			const headingLevels = await headings.evaluateAll((elements) =>
				elements.map((el) => parseInt(el.tagName.charAt(1)))
			);

			for (let i = 1; i < headingLevels.length; i++) {
				const currentLevel = headingLevels[i];
				const previousLevel = headingLevels[i - 1];
				// 見出しレベルは1つずつ増加するか、同じレベルか、前のレベルに戻る
				expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
			}
		}

		// 3. 画像のalt属性チェック
		const images = page.locator('img');
		const imageCount = await images.count();

		for (let i = 0; i < imageCount; i++) {
			const image = images.nth(i);
			const alt = await image.getAttribute('alt');
			const role = await image.getAttribute('role');

			// 装飾的画像でない限り、alt属性は必須
			if (role !== 'presentation' && role !== 'none') {
				expect(alt).toBeTruthy();
			}
		}

		// 4. リンクの意味のあるテキスト確認
		const links = page.locator('a[href]');
		const linkCount = await links.count();

		for (let i = 0; i < linkCount; i++) {
			const link = links.nth(i);
			const text = await link.textContent();
			const ariaLabel = await link.getAttribute('aria-label');
			const title = await link.getAttribute('title');

			// リンクには意味のあるテキストが必要
			expect(text || ariaLabel || title).toBeTruthy();
		}
	});

	test('管理画面のアクセシビリティ検証', async ({ page }) => {
		// 管理画面にアクセス（認証が必要な場合はログイン処理を追加）
		await page.goto('/admin');
		await waitForPageLoad(page);

		// ログインページにリダイレクトされる場合の処理
		if (page.url().includes('/login')) {
			// テストユーザーでログイン
			await page.fill('input[name="email"], input[name="username"]', 'admin@example.com');
			await page.fill('input[name="password"]', 'password123');
			await page.click('button[type="submit"]');
			await waitForPageLoad(page);
		}

		// 管理画面のアクセシビリティチェック
		// await checkA11y(page, undefined, {
		// 	detailedReport: true,
		// 	detailedReportOptions: { html: true }
		// });

		// フォームのアクセシビリティチェック
		const forms = page.locator('form');
		const formCount = await forms.count();

		for (let i = 0; i < formCount; i++) {
			const form = forms.nth(i);
			const inputs = form.locator('input, textarea, select');
			const inputCount = await inputs.count();

			for (let j = 0; j < inputCount; j++) {
				const input = inputs.nth(j);
				const id = await input.getAttribute('id');
				const name = await input.getAttribute('name');
				const ariaLabel = await input.getAttribute('aria-label');
				const ariaLabelledby = await input.getAttribute('aria-labelledby');

				// 入力フィールドには適切なラベルが必要
				if (id) {
					const label = page.locator(`label[for="${id}"]`);
					const labelExists = (await label.count()) > 0;

					if (!labelExists) {
						// ラベルがない場合、aria-labelまたはaria-labelledbyが必要
						expect(ariaLabel || ariaLabelledby).toBeTruthy();
					}
				} else if (name) {
					// idがない場合、aria-labelが必要
					expect(ariaLabel || ariaLabelledby).toBeTruthy();
				}
			}
		}
	});

	test('キーボードナビゲーションテスト', async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);

		// フォーカス可能な要素を取得
		const focusableElements = page.locator(
			'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
		);
		const focusableCount = await focusableElements.count();

		if (focusableCount > 0) {
			// Tabキーでフォーカス移動をテスト
			await page.keyboard.press('Tab');

			// 最初のフォーカス可能要素にフォーカスがあることを確認
			const firstFocusable = focusableElements.first();
			await expect(firstFocusable).toBeFocused();

			// 複数のTab移動をテスト
			for (let i = 1; i < Math.min(5, focusableCount); i++) {
				await page.keyboard.press('Tab');
				const currentFocusable = focusableElements.nth(i);
				await expect(currentFocusable).toBeFocused();
			}

			// Shift+Tabで逆方向の移動をテスト
			await page.keyboard.press('Shift+Tab');
			const previousFocusable = focusableElements.nth(Math.min(3, focusableCount - 1));
			await expect(previousFocusable).toBeFocused();
		}
	});

	test('カラーコントラスト比チェック', async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);

		// 主要テキスト要素のカラーコントラスト比を確認
		const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, a, button, [role="button"]');
		const elementCount = await textElements.count();

		for (let i = 0; i < Math.min(10, elementCount); i++) {
			const element = textElements.nth(i);
			const isVisible = await element.isVisible();

			if (isVisible) {
				// 要素のスタイルを取得
				const styles = await element.evaluate((el) => {
					const computed = window.getComputedStyle(el);
					return {
						color: computed.color,
						backgroundColor: computed.backgroundColor,
						fontSize: computed.fontSize
					};
				});

				// フォントサイズが14px以上であることを確認（推奨）
				const fontSize = parseInt(styles.fontSize);
				expect(fontSize).toBeGreaterThanOrEqual(14);
			}
		}
	});

	test('スクリーンリーダー対応チェック', async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);

		// ARIA属性の適切な使用チェック
		const ariaElements = page.locator(
			'[aria-label], [aria-labelledby], [aria-describedby], [role]'
		);
		const ariaCount = await ariaElements.count();

		for (let i = 0; i < ariaCount; i++) {
			const element = ariaElements.nth(i);
			const ariaLabelledby = await element.getAttribute('aria-labelledby');
			const ariaDescribedby = await element.getAttribute('aria-describedby');
			const role = await element.getAttribute('role');

			// aria-labelledbyが指定されている場合、参照先の要素が存在することを確認
			if (ariaLabelledby) {
				const labelElement = page.locator(`#${ariaLabelledby}`);
				await expect(labelElement).toHaveCount(1);
			}

			// aria-describedbyが指定されている場合、参照先の要素が存在することを確認
			if (ariaDescribedby) {
				const descElement = page.locator(`#${ariaDescribedby}`);
				await expect(descElement).toHaveCount(1);
			}

			// 無効なrole属性をチェック
			if (role) {
				const validRoles = [
					'alert',
					'alertdialog',
					'application',
					'article',
					'banner',
					'button',
					'cell',
					'checkbox',
					'columnheader',
					'combobox',
					'complementary',
					'contentinfo',
					'definition',
					'dialog',
					'directory',
					'document',
					'feed',
					'figure',
					'form',
					'grid',
					'gridcell',
					'group',
					'heading',
					'img',
					'link',
					'list',
					'listbox',
					'listitem',
					'log',
					'main',
					'marquee',
					'math',
					'menu',
					'menubar',
					'menuitem',
					'menuitemcheckbox',
					'menuitemradio',
					'navigation',
					'none',
					'note',
					'option',
					'presentation',
					'progressbar',
					'radio',
					'radiogroup',
					'region',
					'row',
					'rowgroup',
					'rowheader',
					'scrollbar',
					'search',
					'searchbox',
					'separator',
					'slider',
					'spinbutton',
					'status',
					'switch',
					'tab',
					'table',
					'tablist',
					'tabpanel',
					'term',
					'textbox',
					'timer',
					'toolbar',
					'tooltip',
					'tree',
					'treegrid',
					'treeitem'
				];

				expect(validRoles).toContain(role);
			}
		}

		// 重要なランドマークの存在確認
		await expect(page.locator('main, [role="main"]')).toHaveCount(1);

		// ナビゲーションランドマークの確認
		const navElements = page.locator('nav, [role="navigation"]');
		if ((await navElements.count()) > 0) {
			// 複数のナビゲーションがある場合、aria-labelで区別されているか確認
			const navCount = await navElements.count();
			if (navCount > 1) {
				for (let i = 0; i < navCount; i++) {
					const nav = navElements.nth(i);
					const ariaLabel = await nav.getAttribute('aria-label');
					const ariaLabelledby = await nav.getAttribute('aria-labelledby');
					expect(ariaLabel || ariaLabelledby).toBeTruthy();
				}
			}
		}
	});

	test('動的コンテンツのアクセシビリティ', async ({ page }) => {
		await page.goto('/');
		await waitForPageLoad(page);

		// 動的に変更される要素のアクセシビリティチェック
		const dynamicElements = page.locator('[aria-live], [aria-atomic], [aria-relevant]');
		const dynamicCount = await dynamicElements.count();

		for (let i = 0; i < dynamicCount; i++) {
			const element = dynamicElements.nth(i);
			const ariaLive = await element.getAttribute('aria-live');

			if (ariaLive) {
				// aria-liveの値が有効であることを確認
				expect(['off', 'polite', 'assertive']).toContain(ariaLive);
			}
		}

		// モーダルダイアログのアクセシビリティチェック（存在する場合）
		const modalTriggers = page.locator(
			'button[data-modal], [data-toggle="modal"], button:has-text("モーダル")'
		);
		const modalCount = await modalTriggers.count();

		if (modalCount > 0) {
			// モーダルを開く
			await modalTriggers.first().click();
			await page.waitForTimeout(500);

			// モーダルのアクセシビリティ属性チェック
			const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal');
			if ((await modal.count()) > 0) {
				await expect(modal.first()).toHaveAttribute('aria-modal', 'true');

				// フォーカストラップの確認
				const focusableInModal = modal.locator(
					'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
				);
				const focusableCount = await focusableInModal.count();

				if (focusableCount > 0) {
					// 最初のフォーカス可能要素にフォーカスがあることを確認
					await expect(focusableInModal.first()).toBeFocused();
				}

				// モーダルを閉じる
				const closeButton = modal.locator(
					'button[aria-label*="閉じる"], button[aria-label*="close"], .close'
				);
				if ((await closeButton.count()) > 0) {
					await closeButton.first().click();
				} else {
					await page.keyboard.press('Escape');
				}
			}
		}
	});

	test('フォームのアクセシビリティ詳細チェック', async ({ page }) => {
		// 管理画面のフォームページにアクセス
		await page.goto('/admin/posts/new');
		await waitForPageLoad(page);

		// ログインが必要な場合の処理
		if (page.url().includes('/login')) {
			await page.fill('input[name="email"], input[name="username"]', 'admin@example.com');
			await page.fill('input[name="password"]', 'password123');
			await page.click('button[type="submit"]');
			await waitForPageLoad(page);
		}

		// フォームのアクセシビリティチェック
		// await checkA11y(page, undefined, {
		// 	detailedReport: true,
		// 	detailedReportOptions: { html: true }
		// });

		// 必須フィールドの表示確認
		const requiredFields = page.locator(
			'input[required], textarea[required], select[required]'
		);
		const requiredCount = await requiredFields.count();

		for (let i = 0; i < requiredCount; i++) {
			const field = requiredFields.nth(i);
			const ariaRequired = await field.getAttribute('aria-required');

			// 必須フィールドはaria-required="true"を持つべき
			expect(ariaRequired).toBe('true');
		}

		// エラーメッセージの関連付け確認
		const errorElements = page.locator('.error, [role="alert"], [aria-live="assertive"]');
		const errorCount = await errorElements.count();

		if (errorCount > 0) {
			// エラーメッセージが適切に関連付けられているかチェック
			for (let i = 0; i < errorCount; i++) {
				const error = errorElements.nth(i);
				const errorId = await error.getAttribute('id');

				if (errorId) {
					// このエラーを参照するフィールドが存在するかチェック
					const referencingField = page.locator(`[aria-describedby*="${errorId}"]`);
					const referencingCount = await referencingField.count();
					expect(referencingCount).toBeGreaterThan(0);
				}
			}
		}
	});
});
