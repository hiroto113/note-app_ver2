import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * 管理者としてログインする
 */
export async function loginAsAdmin(page: Page) {
	await page.goto('/login');

	// ログインフォームが表示されるまで待機
	await expect(page.locator('form')).toBeVisible();

	// 認証情報を入力
	await page.fill('input[name="email"], input[name="username"]', testUsers.admin.username);
	await page.fill('input[name="password"]', testUsers.admin.password);

	// ログインボタンをクリック
	await page.click('button[type="submit"]');

	// ログイン成功を確認（管理画面にリダイレクトされることを期待）
	await expect(page).toHaveURL(/\/admin/);
}

/**
 * ログアウトする
 */
export async function logout(page: Page) {
	// ログアウトボタンまたはメニューを探す
	const logoutButton = page.locator(
		'button:has-text("ログアウト"), a:has-text("ログアウト"), button:has-text("Logout"), a:has-text("Logout")'
	);

	if (await logoutButton.isVisible()) {
		await logoutButton.click();
	} else {
		// ユーザーメニューを開く必要がある場合
		const userMenu = page.locator(
			'[data-testid="user-menu"], .user-menu, button:has-text("admin")'
		);
		if (await userMenu.isVisible()) {
			await userMenu.click();
			await page.click('button:has-text("ログアウト"), a:has-text("ログアウト")');
		}
	}

	// ホームページまたはログインページにリダイレクトされることを確認
	await expect(page).toHaveURL(/\/(login)?$/);
}

/**
 * 認証状態をチェックする
 */
export async function checkAuthState(page: Page): Promise<boolean> {
	try {
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');

		// 管理画面にアクセスできるかチェック
		const currentUrl = page.url();
		return currentUrl.includes('/admin') && !currentUrl.includes('/login');
	} catch {
		return false;
	}
}

/**
 * 認証が必要なページで認証チェックを行う
 */
export async function ensureAuthenticated(page: Page) {
	const isAuthenticated = await checkAuthState(page);

	if (!isAuthenticated) {
		await loginAsAdmin(page);
	}
}

/**
 * ログインページの表示を確認
 */
export async function expectLoginPage(page: Page) {
	await expect(page).toHaveURL(/\/login/);
	await expect(page.locator('form')).toBeVisible();
	await expect(page.locator('input[name="email"], input[name="username"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
	await expect(page.locator('button[type="submit"]')).toBeVisible();
}
