import { test, expect } from '@playwright/test';
import { testContent } from '../fixtures/test-data';
import { loginAsAdmin, logout } from '../utils/auth-helpers';
import {
	waitForPageLoad,
	expectNotification,
	findTableRow,
	handleConfirmDialog,
	expectModal,
	closeModal
} from '../utils/page-helpers';

test.describe('管理画面 - 記事管理', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/admin/posts');
		await waitForPageLoad(page);
	});

	test.afterEach(async ({ page }) => {
		await logout(page);
	});

	test('記事一覧ページが正常に表示される', async ({ page }) => {
		// ページタイトルの確認
		await expect(page).toHaveTitle(/記事管理|Posts/);

		// メインヘッダーの確認
		await expect(page.locator('h1, h2')).toContainText(/記事|Posts/);

		// 新規作成ボタンの確認
		await expect(
			page.locator(
				'button:has-text("新規作成"), a:has-text("新規作成"), button:has-text("New"), a:has-text("New")'
			)
		).toBeVisible();

		// 記事一覧テーブルまたはカードの確認
		const postsContainer = page.locator('table, .posts-grid, .posts-list');
		await expect(postsContainer).toBeVisible();
	});

	test('新しい記事を作成できる', async ({ page }) => {
		// 新規作成ボタンをクリック
		await page.click(
			'button:has-text("新規作成"), a:has-text("新規作成"), button:has-text("New"), a:has-text("New")'
		);
		await waitForPageLoad(page);

		// 記事作成フォームページに移動
		await expect(page).toHaveURL(/\/admin\/posts\/(new|create)/);

		// フォーム要素の確認
		await expect(
			page.locator('input[name="title"], [data-testid="title-input"]')
		).toBeVisible();
		await expect(
			page.locator('textarea[name="content"], [data-testid="content-input"]')
		).toBeVisible();

		// 記事データを入力
		await page.fill(
			'input[name="title"], [data-testid="title-input"]',
			testContent.newPost.title
		);
		await page.fill(
			'textarea[name="content"], [data-testid="content-input"]',
			testContent.newPost.content
		);

		// 概要（excerpt）フィールドがある場合
		const excerptField = page.locator(
			'textarea[name="excerpt"], [data-testid="excerpt-input"]'
		);
		if (await excerptField.isVisible()) {
			await excerptField.fill(testContent.newPost.excerpt);
		}

		// カテゴリ選択がある場合
		const categorySelect = page.locator(
			'select[name="category"], [data-testid="category-select"]'
		);
		if (await categorySelect.isVisible()) {
			await categorySelect.selectOption({ index: 1 }); // 最初のカテゴリを選択
		}

		// 保存ボタンをクリック
		await page.click('button:has-text("保存"), button:has-text("Save"), button[type="submit"]');
		await waitForPageLoad(page);

		// 成功メッセージまたは記事一覧ページへのリダイレクトを確認
		try {
			await expectNotification(page, '作成', 'success');
		} catch {
			// リダイレクトの場合
			await expect(page).toHaveURL(/\/admin\/posts/);
		}

		// 作成した記事が一覧に表示されることを確認
		await expect(page.locator('body')).toContainText(testContent.newPost.title);
	});

	test('記事を編集できる', async ({ page }) => {
		// 既存の記事を探して編集ボタンをクリック
		const editButton = page
			.locator(
				'button:has-text("編集"), a:has-text("編集"), button:has-text("Edit"), a:has-text("Edit")'
			)
			.first();
		await editButton.click();
		await waitForPageLoad(page);

		// 編集フォームページに移動
		await expect(page).toHaveURL(/\/admin\/posts\/\d+\/(edit|update)/);

		// 既存の値が入力されていることを確認
		const titleInput = page.locator('input[name="title"], [data-testid="title-input"]');
		const contentTextarea = page.locator(
			'textarea[name="content"], [data-testid="content-input"]'
		);

		await expect(titleInput).not.toHaveValue('');
		await expect(contentTextarea).not.toHaveValue('');

		// タイトルを更新
		const originalTitle = await titleInput.inputValue();
		const updatedTitle = `${originalTitle} (Updated)`;
		await titleInput.fill(updatedTitle);

		// 保存ボタンをクリック
		await page.click(
			'button:has-text("保存"), button:has-text("Save"), button:has-text("更新"), button[type="submit"]'
		);
		await waitForPageLoad(page);

		// 成功メッセージまたは記事一覧ページへのリダイレクトを確認
		try {
			await expectNotification(page, '更新', 'success');
		} catch {
			await expect(page).toHaveURL(/\/admin\/posts/);
		}

		// 更新した記事が一覧に表示されることを確認
		await expect(page.locator('body')).toContainText(updatedTitle);
	});

	test('記事のステータスを変更できる', async ({ page }) => {
		// ステータス変更ボタンまたはドロップダウンを探す
		const statusControl = page
			.locator('select[name*="status"], button:has-text("公開"), button:has-text("下書き")')
			.first();

		if (await statusControl.isVisible()) {
			if ((await statusControl.evaluate((el) => el.tagName)) === 'SELECT') {
				// セレクトボックスの場合
				const currentValue = await statusControl.inputValue();
				const newValue = currentValue === 'published' ? 'draft' : 'published';
				await statusControl.selectOption(newValue);
			} else {
				// ボタンの場合
				await statusControl.click();
			}

			await waitForPageLoad(page);

			// ステータス変更の確認
			await expectNotification(page, 'ステータス', 'success');
		}
	});

	test('記事を削除できる', async ({ page }) => {
		// 削除対象の記事数を確認
		const initialPostCount = await page.locator('tr, .post-item').count();

		// 最初の記事の削除ボタンをクリック
		const deleteButton = page
			.locator('button:has-text("削除"), button:has-text("Delete")')
			.first();

		if (await deleteButton.isVisible()) {
			// 確認ダイアログの処理
			handleConfirmDialog(page, true);

			await deleteButton.click();
			await waitForPageLoad(page);

			// 削除成功メッセージの確認
			await expectNotification(page, '削除', 'success');

			// 記事数が1つ減ったことを確認
			const newPostCount = await page.locator('tr, .post-item').count();
			expect(newPostCount).toBe(initialPostCount - 1);
		}
	});

	test('記事の検索・フィルタ機能が動作する', async ({ page }) => {
		// 検索ボックスの確認
		const searchInput = page.locator(
			'input[type="search"], input[placeholder*="検索"], [data-testid="search"]'
		);

		if (await searchInput.isVisible()) {
			// 検索語句を入力
			await searchInput.fill('SvelteKit');

			// 検索ボタンがあればクリック、なければEnterキー
			const searchButton = page.locator('button[type="submit"]:near(input[type="search"])');
			if (await searchButton.isVisible()) {
				await searchButton.click();
			} else {
				await searchInput.press('Enter');
			}

			await waitForPageLoad(page);

			// 検索結果の確認
			await expect(page.locator('body')).toContainText('SvelteKit');
		}

		// ステータスフィルタの確認
		const statusFilter = page.locator('select[name*="status"], select[name*="filter"]');
		if (await statusFilter.isVisible()) {
			await statusFilter.selectOption('published');
			await waitForPageLoad(page);

			// フィルタ結果の確認
			const posts = page.locator('tr, .post-item');
			if ((await posts.count()) > 0) {
				// 公開済み記事のみが表示されることを確認
				await expect(page.locator('body')).toContainText('公開');
			}
		}
	});

	test('記事のプレビュー機能が動作する', async ({ page }) => {
		// プレビューボタンの確認
		const previewButton = page
			.locator(
				'button:has-text("プレビュー"), a:has-text("プレビュー"), button:has-text("Preview"), a:has-text("Preview")'
			)
			.first();

		if (await previewButton.isVisible()) {
			// プレビューボタンをクリック
			await previewButton.click();

			// 新しいタブまたはモーダルでプレビューが開くことを確認
			const newPage = await page
				.context()
				.waitForEvent('page', { timeout: 5000 })
				.catch(() => null);

			if (newPage) {
				// 新しいタブの場合
				await newPage.waitForLoadState('networkidle');
				await expect(newPage.locator('h1')).toBeVisible();
				await newPage.close();
			} else {
				// モーダルの場合
				await expectModal(page);
				await closeModal(page);
			}
		}
	});

	test('一括操作が機能する', async ({ page }) => {
		// チェックボックスの確認
		const checkboxes = page.locator('input[type="checkbox"]');

		if ((await checkboxes.count()) > 1) {
			// 複数の記事を選択
			await checkboxes.nth(1).check(); // 最初はヘッダーの可能性があるため2番目から
			await checkboxes.nth(2).check();

			// 一括操作ボタンの確認
			const bulkAction = page.locator('select[name*="bulk"], button:has-text("一括")');
			if (await bulkAction.isVisible()) {
				if ((await bulkAction.evaluate((el) => el.tagName)) === 'SELECT') {
					await bulkAction.selectOption('delete');

					// 実行ボタンをクリック
					const executeButton = page.locator(
						'button:has-text("実行"), button:has-text("Apply")'
					);
					if (await executeButton.isVisible()) {
						handleConfirmDialog(page, true);
						await executeButton.click();
						await waitForPageLoad(page);

						await expectNotification(page, '一括', 'success');
					}
				}
			}
		}
	});

	test('ページネーションが機能する', async ({ page }) => {
		// ページネーションの確認
		const pagination = page.locator('.pagination, nav[aria-label*="ページ"]');

		if (await pagination.isVisible()) {
			const nextButton = pagination.locator(
				'a:has-text("次"), a:has-text("Next"), button:has-text("次")'
			);

			if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
				// 現在のページ番号を記録
				const currentUrl = page.url();

				// 次のページに移動
				await nextButton.click();
				await waitForPageLoad(page);

				// URLが変更されたことを確認
				expect(page.url()).not.toBe(currentUrl);

				// 記事一覧が表示されることを確認
				await expect(page.locator('table, .posts-grid, .posts-list')).toBeVisible();
			}
		}
	});

	test('並び替え機能が動作する', async ({ page }) => {
		// テーブルヘッダーのソートボタンを確認
		const sortButtons = page.locator('th button, th a, .sortable');

		if ((await sortButtons.count()) > 0) {
			// タイトル列でソート
			const titleSort = sortButtons.filter({ hasText: /タイトル|Title/ }).first();
			if (await titleSort.isVisible()) {
				await titleSort.click();
				await waitForPageLoad(page);

				// ソート結果の確認（URLパラメータまたは表示順序の変化）
				expect(page.url()).toMatch(/sort|order/);
			}
		}
	});

	test('記事の複製機能が存在する場合の確認', async ({ page }) => {
		// 複製ボタンの確認
		const duplicateButton = page
			.locator('button:has-text("複製"), button:has-text("Duplicate"), a:has-text("複製")')
			.first();

		if (await duplicateButton.isVisible()) {
			// 元の記事数を記録
			const originalCount = await page.locator('tr, .post-item').count();

			// 複製ボタンをクリック
			await duplicateButton.click();
			await waitForPageLoad(page);

			// 複製成功メッセージの確認
			await expectNotification(page, '複製', 'success');

			// 記事数が増えたことを確認
			const newCount = await page.locator('tr, .post-item').count();
			expect(newCount).toBe(originalCount + 1);
		}
	});
});
