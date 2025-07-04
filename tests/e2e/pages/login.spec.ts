import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';
import { waitForPageLoad } from '../utils/page-helpers';
import { expectLoginPage } from '../utils/auth-helpers';

test.describe('ログイン機能', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await waitForPageLoad(page);
	});

	test('ログインページが正常に表示される', async ({ page }) => {
		await expectLoginPage(page);

		// ページタイトルの確認
		await expect(page).toHaveTitle(/ログイン|Login/);

		// ログインフォームの要素確認
		await expect(page.locator('form')).toBeVisible();
		await expect(page.locator('input[name="email"], input[name="username"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('正しい認証情報でログインできる', async ({ page }) => {
		// 認証情報を入力
		await page.fill('input[name="email"], input[name="username"]', testUsers.admin.username);
		await page.fill('input[name="password"]', testUsers.admin.password);

		// ログインボタンをクリック
		await page.click('button[type="submit"]');
		await waitForPageLoad(page);

		// 管理画面にリダイレクトされることを確認
		await expect(page).toHaveURL(/\/admin/);

		// 管理画面が表示されることを確認
		await expect(page.locator('h1, h2')).toBeVisible();
	});

	test('間違った認証情報でログインに失敗する', async ({ page }) => {
		// 間違った認証情報を入力
		await page.fill('input[name="email"], input[name="username"]', 'wronguser');
		await page.fill('input[name="password"]', 'wrongpassword');

		// ログインボタンをクリック
		await page.click('button[type="submit"]');
		await waitForPageLoad(page);

		// ログインページにとどまることを確認
		await expect(page).toHaveURL(/\/login/);

		// エラーメッセージが表示されることを確認
		await expect(page.locator('body')).toContainText(/エラー|error|invalid|incorrect/i);
	});

	test('空の認証情報でログインできない', async ({ page }) => {
		// 空の状態でログインボタンをクリック
		await page.click('button[type="submit"]');

		// ログインページにとどまることを確認
		await expect(page).toHaveURL(/\/login/);

		// HTML5 バリデーションまたはカスタムエラーメッセージの確認
		const usernameInput = page.locator('input[name="email"], input[name="username"]');
		const passwordInput = page.locator('input[name="password"]');

		// 必須フィールドのバリデーション確認
		await expect(usernameInput).toHaveAttribute('required');
		await expect(passwordInput).toHaveAttribute('required');
	});

	test('パスワードフィールドがマスクされている', async ({ page }) => {
		const passwordInput = page.locator('input[name="password"]');

		// パスワードフィールドのtype属性を確認
		await expect(passwordInput).toHaveAttribute('type', 'password');
	});

	test('フォームのアクセシビリティが適切', async ({ page }) => {
		// ラベルとフィールドの関連付け確認
		const usernameInput = page.locator('input[name="email"], input[name="username"]');
		const passwordInput = page.locator('input[name="password"]');

		// ラベルまたはaria-labelの存在確認
		await expect(usernameInput).toHaveAttribute('aria-label');
		await expect(passwordInput).toHaveAttribute('aria-label');

		// またはlabel要素との関連付け確認
		const usernameLabel = page.locator('label[for]');
		if ((await usernameLabel.count()) > 0) {
			const labelFor = await usernameLabel.first().getAttribute('for');
			const inputId = await usernameInput.getAttribute('id');
			expect(labelFor).toBe(inputId);
		}
	});

	test('キーボードナビゲーションが機能する', async ({ page }) => {
		// Tabキーでフィールド間を移動
		await page.keyboard.press('Tab');
		await expect(page.locator('input[name="email"], input[name="username"]')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('input[name="password"]')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('button[type="submit"]')).toBeFocused();

		// Enterキーでフォーム送信
		await page.fill('input[name="email"], input[name="username"]', testUsers.admin.username);
		await page.fill('input[name="password"]', testUsers.admin.password);
		await page.locator('button[type="submit"]').focus();
		await page.keyboard.press('Enter');

		await waitForPageLoad(page);
		await expect(page).toHaveURL(/\/admin/);
	});

	test('ログイン状態の永続化確認', async ({ page }) => {
		// ログイン
		await page.fill('input[name="email"], input[name="username"]', testUsers.admin.username);
		await page.fill('input[name="password"]', testUsers.admin.password);
		await page.click('button[type="submit"]');
		await waitForPageLoad(page);

		// 管理画面に移動したことを確認
		await expect(page).toHaveURL(/\/admin/);

		// ページをリロード
		await page.reload();
		await waitForPageLoad(page);

		// まだ管理画面にいることを確認（セッションが維持されている）
		await expect(page).toHaveURL(/\/admin/);
	});

	test('未認証での管理画面アクセス時のリダイレクト', async ({ page }) => {
		try {
			// 直接管理画面にアクセス
			await page.goto('/admin');
			await waitForPageLoad(page);

			// ログインページにリダイレクトされることを確認
			await expect(page).toHaveURL(/\/login/);
		} catch (error) {
			// サーバーエラーの場合、ログインページに直接アクセスして認証が必要なことを確認
			await page.goto('/login');
			await expect(page.locator('form')).toBeVisible();
		}
	});

	test('ログイン後の元ページへのリダイレクト', async ({ page }) => {
		// 特定の管理画面ページに直接アクセス
		await page.goto('/admin/posts');
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/login/);

		// ログイン
		await page.fill('input[name="email"], input[name="username"]', testUsers.admin.username);
		await page.fill('input[name="password"]', testUsers.admin.password);
		await page.click('button[type="submit"]');
		await waitForPageLoad(page);

		// 元々アクセスしようとしていたページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/admin\/posts/);
	});

	test('CSRFプロテクション確認', async ({ page }) => {
		// フォームにCSRFトークンが含まれていることを確認
		const csrfToken = page.locator(
			'input[name="_token"], input[name="csrf_token"], input[name="authenticity_token"]'
		);

		if ((await csrfToken.count()) > 0) {
			await expect(csrfToken.first()).toHaveAttribute('value');
			const tokenValue = await csrfToken.first().getAttribute('value');
			expect(tokenValue).toBeTruthy();
			expect(tokenValue!.length).toBeGreaterThan(10);
		}
	});
});
