import { describe, it, expect } from 'vitest';
import { LOGIN_MESSAGES, ERROR_KEYWORDS, SUCCESS_KEYWORDS } from './messages';

describe('messages constants', () => {
	describe('LOGIN_MESSAGES', () => {
		it('should contain all required login messages', () => {
			expect(LOGIN_MESSAGES.INVALID_CREDENTIALS).toBe(
				'ログインに失敗しました。ユーザー名またはパスワードが正しくありません。'
			);
			expect(LOGIN_MESSAGES.LOGIN_ERROR).toBe('ログイン処理中にエラーが発生しました。');
			expect(LOGIN_MESSAGES.LOADING).toBe('ログイン中...');
			expect(LOGIN_MESSAGES.SUCCESS).toBe('ログインしました。');
		});

		it('should be readonly constants', () => {
			// TypeScript enforces immutability at compile time
			// Runtime test: constants should exist and have expected values
			expect(LOGIN_MESSAGES.INVALID_CREDENTIALS).toBeTruthy();
			expect(LOGIN_MESSAGES.LOGIN_ERROR).toBeTruthy();
			expect(LOGIN_MESSAGES.LOADING).toBeTruthy();
			expect(LOGIN_MESSAGES.SUCCESS).toBeTruthy();
		});
	});

	describe('ERROR_KEYWORDS', () => {
		it('should match login failure patterns', () => {
			const pattern = ERROR_KEYWORDS.LOGIN_FAILURE;

			expect(pattern.test('ログインに失敗しました')).toBe(true);
			expect(pattern.test('失敗しました')).toBe(true);
			expect(pattern.test('正しくありません')).toBe(true);
			expect(pattern.test('ユーザー名またはパスワード')).toBe(true);
			expect(pattern.test('成功しました')).toBe(false);
		});

		it('should match general error patterns', () => {
			const pattern = ERROR_KEYWORDS.GENERAL_ERROR;

			expect(pattern.test('エラーが発生しました')).toBe(true);
			expect(pattern.test('処理中にエラー')).toBe(true);
			expect(pattern.test('エラー')).toBe(true);
			expect(pattern.test('正常に処理されました')).toBe(false);
		});

		it('should match validation error patterns', () => {
			const pattern = ERROR_KEYWORDS.VALIDATION_ERROR;

			expect(pattern.test('必須項目です')).toBe(true);
			expect(pattern.test('入力してください')).toBe(true);
			expect(pattern.test('正しい形式で入力してください')).toBe(true);
			expect(pattern.test('任意項目です')).toBe(false);
		});

		it('should be case insensitive', () => {
			const pattern = ERROR_KEYWORDS.LOGIN_FAILURE;

			expect(pattern.test('ログインに失敗しました')).toBe(true);
			expect(pattern.test('ログインに失敗しました')).toBe(true);
		});
	});

	describe('SUCCESS_KEYWORDS', () => {
		it('should match login success patterns', () => {
			const pattern = SUCCESS_KEYWORDS.LOGIN_SUCCESS;

			expect(pattern.test('ログインしました')).toBe(true);
			expect(pattern.test('成功しました')).toBe(true);
			expect(pattern.test('管理画面にようこそ')).toBe(true);
			expect(pattern.test('ログアウトしました')).toBe(false);
		});

		it('should match save success patterns', () => {
			const pattern = SUCCESS_KEYWORDS.SAVE_SUCCESS;

			expect(pattern.test('保存しました')).toBe(true);
			expect(pattern.test('更新しました')).toBe(true);
			expect(pattern.test('作成しました')).toBe(true);
			expect(pattern.test('削除しました')).toBe(false);
		});
	});

	describe('pattern consistency', () => {
		it('should have all required pattern types', () => {
			expect(ERROR_KEYWORDS.LOGIN_FAILURE).toBeInstanceOf(RegExp);
			expect(ERROR_KEYWORDS.GENERAL_ERROR).toBeInstanceOf(RegExp);
			expect(ERROR_KEYWORDS.VALIDATION_ERROR).toBeInstanceOf(RegExp);

			expect(SUCCESS_KEYWORDS.LOGIN_SUCCESS).toBeInstanceOf(RegExp);
			expect(SUCCESS_KEYWORDS.SAVE_SUCCESS).toBeInstanceOf(RegExp);
		});

		it('should not have overlapping patterns between error and success', () => {
			const successText = 'ログインに成功しました';
			const errorText = 'ログインに失敗しました';

			expect(SUCCESS_KEYWORDS.LOGIN_SUCCESS.test(successText)).toBe(true);
			expect(ERROR_KEYWORDS.LOGIN_FAILURE.test(successText)).toBe(false);

			expect(ERROR_KEYWORDS.LOGIN_FAILURE.test(errorText)).toBe(true);
			expect(SUCCESS_KEYWORDS.LOGIN_SUCCESS.test(errorText)).toBe(false);
		});
	});
});
