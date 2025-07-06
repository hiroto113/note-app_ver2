/**
 * アプリケーション全体で使用するメッセージ定数
 */

// ログイン関連メッセージ
export const LOGIN_MESSAGES = {
	INVALID_CREDENTIALS: 'ログインに失敗しました。ユーザー名またはパスワードが正しくありません。',
	LOGIN_ERROR: 'ログイン処理中にエラーが発生しました。',
	LOADING: 'ログイン中...',
	SUCCESS: 'ログインしました。'
} as const;

// エラーメッセージのキーワード（テスト用）
export const ERROR_KEYWORDS = {
	LOGIN_FAILURE: /ログインに失敗|失敗しました|正しくありません|ユーザー名またはパスワード/i,
	GENERAL_ERROR: /エラーが発生|処理中にエラー|エラー/i,
	VALIDATION_ERROR: /必須|入力してください|正しい形式/i
} as const;

// 成功メッセージのキーワード（テスト用）
export const SUCCESS_KEYWORDS = {
	LOGIN_SUCCESS: /ログインしました|成功|管理画面/i,
	SAVE_SUCCESS: /保存しました|更新しました|作成しました/i
} as const;
