/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * ページ操作のヘルパー関数
 */

/**
 * 要素が表示されるまで待機
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
	await page.waitForSelector(selector, { timeout });
}

/**
 * テキストが表示されるまで待機
 */
export async function waitForText(page: Page, text: string, timeout = 10000) {
	await page.waitForFunction((searchText) => document.body.innerText.includes(searchText), text, {
		timeout
	});
}

/**
 * ページの読み込み完了を待機
 */
export async function waitForPageLoad(page: Page) {
	await page.waitForLoadState('networkidle');
}

/**
 * フォームの送信と結果の待機
 */
export async function submitFormAndWait(
	page: Page,
	formSelector: string,
	expectedUrl?: string | RegExp
) {
	await page.click(`${formSelector} button[type="submit"]`);

	if (expectedUrl) {
		await expect(page).toHaveURL(expectedUrl);
	}

	await waitForPageLoad(page);
}

/**
 * 通知・トーストメッセージの確認
 */
export async function expectNotification(page: Page, message: string) {
	const notificationSelectors = [
		'.toast',
		'.notification',
		'.alert',
		'[data-testid="notification"]',
		'[role="alert"]'
	];

	for (const selector of notificationSelectors) {
		const element = page.locator(selector);
		if (await element.isVisible()) {
			await expect(element).toContainText(message);
			return;
		}
	}

	// フォールバック: ページ内のどこかにメッセージが表示されているかチェック
	await expect(page.locator('body')).toContainText(message);
}

/**
 * テーブル内の行を検索
 */
export async function findTableRow(
	page: Page,
	tableSelector: string,
	cellText: string
): Promise<Locator> {
	const table = page.locator(tableSelector);
	const rows = table.locator('tr');

	const rowCount = await rows.count();
	for (let i = 0; i < rowCount; i++) {
		const row = rows.nth(i);
		const text = await row.textContent();
		if (text?.includes(cellText)) {
			return row;
		}
	}

	throw new Error(`Row containing "${cellText}" not found in table`);
}

/**
 * ドロップダウン/セレクトボックスの操作
 */
export async function selectOption(page: Page, selectSelector: string, optionValue: string) {
	await page.selectOption(selectSelector, optionValue);
}

/**
 * ファイルアップロード
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
	await page.setInputFiles(inputSelector, filePath);
}

/**
 * モーダル/ダイアログの操作
 */
export async function expectModal(page: Page, modalSelector = '.modal, [role="dialog"]') {
	await expect(page.locator(modalSelector)).toBeVisible();
}

export async function closeModal(
	page: Page,
	closeSelector = 'button:has-text("閉じる"), button:has-text("Close"), [aria-label="Close"]'
) {
	await page.click(closeSelector);
}

/**
 * 確認ダイアログの処理
 */
export async function handleConfirmDialog(page: Page, accept = true) {
	page.on('dialog', async (dialog) => {
		if (accept) {
			await dialog.accept();
		} else {
			await dialog.dismiss();
		}
	});
}

/**
 * スクロール操作
 */
export async function scrollToElement(page: Page, selector: string) {
	await page.locator(selector).scrollIntoViewIfNeeded();
}

export async function scrollToBottom(page: Page) {
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * URL検証ヘルパー
 */
export async function expectUrl(page: Page, expected: string | RegExp) {
	await expect(page).toHaveURL(expected);
}

/**
 * レスポンシブデザインのテスト
 */
export async function setViewportSize(page: Page, width: number, height: number) {
	await page.setViewportSize({ width, height });
}

export const viewports = {
	mobile: { width: 375, height: 667 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1920, height: 1080 },
	largeDesktop: { width: 2560, height: 1440 }
};

/**
 * 要素の可視性チェック
 */
export async function expectVisible(page: Page, selector: string) {
	await expect(page.locator(selector)).toBeVisible();
}

export async function expectHidden(page: Page, selector: string) {
	await expect(page.locator(selector)).toBeHidden();
}

/**
 * キーボード操作
 */
export async function pressKey(page: Page, key: string) {
	await page.keyboard.press(key);
}

export async function typeText(page: Page, selector: string, text: string) {
	await page.fill(selector, ''); // Clear existing text
	await page.type(selector, text);
}
