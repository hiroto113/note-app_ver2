import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * 管理者としてログインする
 */
export async function loginAsAdmin(page: Page) {
	await page.goto('/login');

	// ページ読み込み完了を待機
	await page.waitForLoadState('networkidle');

	// ログインフォームが表示されるまで待機
	await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

	// ユーザー名フィールドの存在確認
	const usernameField = page.locator('input[name="username"]');
	await expect(usernameField).toBeVisible({ timeout: 5000 });

	// 認証情報を入力
	await usernameField.fill(testUsers.admin.username);
	await page.fill('input[name="password"]', testUsers.admin.password);

	// ログインボタンをクリック
	const submitButton = page.locator('button[type="submit"]');
	await expect(submitButton).toBeVisible();
	await submitButton.click();

	// ログイン成功を確認（管理画面にリダイレクトされることを期待）
	await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
	
	// 管理画面の特定の要素確認（モバイルビューでは要素が隠れている可能性があるため複数パターンを試す）
	const dashboardLink = page.locator('text=ダッシュボード');
	const adminHeading = page.locator('h1, h2, h3');
	const adminMainContent = page.locator('main').first();
	
	try {
		await expect(dashboardLink).toBeVisible({ timeout: 3000 });
	} catch {
		// モバイルビューでダッシュボードリンクが隠れている場合、他の管理画面要素を確認
		try {
			await expect(adminHeading).toBeVisible({ timeout: 3000 });
		} catch {
			// 最後の手段として、main要素で確認
			await expect(adminMainContent).toBeVisible({ timeout: 3000 });
		}
	}
}

/**
 * ログアウトする
 */
export async function logout(page: Page) {
	// ページ読み込み完了を待機
	await page.waitForLoadState('networkidle');

	// ログアウトボタンまたはメニューを探す
	const logoutButton = page.locator(
		'button:has-text("ログアウト"), a:has-text("ログアウト"), button:has-text("Logout"), a:has-text("Logout")'
	);

	if (await logoutButton.isVisible({ timeout: 5000 })) {
		await logoutButton.click();
	} else {
		// ユーザーメニューを開く必要がある場合
		const userMenu = page.locator(
			'[data-testid="user-menu"], .user-menu, button:has-text("admin")'
		);
		if (await userMenu.isVisible({ timeout: 5000 })) {
			await userMenu.click();
			await page.locator('button:has-text("ログアウト"), a:has-text("ログアウト")').click();
		}
	}

	// ホームページまたはログインページにリダイレクトされることを確認
	await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
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
