/**
 * フォント最適化ユーティリティ
 */

/**
 * 重要なフォントをプリロードする（Google Fonts使用時は不要）
 */
export function preloadFonts() {
	// Google Fontsを使用するため、この機能は無効化
	return;
}

/**
 * フォント表示の最適化クラスを取得
 */
export function getFontDisplayClass(): string {
	return 'font-display-swap';
}

/**
 * フォントの読み込み状態を監視
 */
export function observeFontLoading(callback?: () => void) {
	if (typeof document === 'undefined') return;

	if ('fonts' in document) {
		// Font Loading APIが利用可能な場合
		document.fonts.ready.then(() => {
			callback?.();
		});
	} else {
		// フォールバック: 一定時間後にコールバックを実行
		setTimeout(() => {
			callback?.();
		}, 3000);
	}
}

/**
 * Critical フォントのインライン化用CSS（Google Fonts使用時は不要）
 */
export const criticalFontCSS = ``;
