/**
 * フォント最適化ユーティリティ
 */

/**
 * 重要なフォントをプリロードする
 */
export function preloadFonts() {
	if (typeof document === 'undefined') return;

	const fontPreloads = [
		{
			href: '/fonts/inter-var.woff2',
			type: 'font/woff2',
			crossorigin: 'anonymous'
		}
	];

	fontPreloads.forEach(({ href, type, crossorigin }) => {
		const link = document.createElement('link');
		link.rel = 'preload';
		link.as = 'font';
		link.type = type;
		link.href = href;
		link.crossOrigin = crossorigin;
		document.head.appendChild(link);
	});
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
 * Critical フォントのインライン化用CSS
 */
export const criticalFontCSS = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-regular-subset.woff2') format('woff2');
  unicode-range: U+0020-007E, U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/inter-bold-subset.woff2') format('woff2');
  unicode-range: U+0020-007E, U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF;
}
`;
