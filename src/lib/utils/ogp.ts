/**
 * OGP画像URLを生成する
 */
export function generateOGPImageUrl(
	baseUrl: string,
	options: {
		title?: string;
		category?: string;
		type?: 'default' | 'article';
		slug?: string;
	} = {}
): string {
	const { title, category, type = 'default', slug } = options;

	// 記事用の場合はslug専用エンドポイントを使用
	if (type === 'article' && slug) {
		return `${baseUrl}/api/og/${encodeURIComponent(slug)}`;
	}

	// デフォルト画像生成
	const params = new URLSearchParams();
	if (title) params.set('title', title);
	if (category) params.set('category', category);
	if (type) params.set('type', type);

	return `${baseUrl}/api/og?${params.toString()}`;
}

/**
 * OGPメタタグの説明文を最適化する
 */
export function optimizeOGPDescription(text: string, maxLength: number = 160): string {
	if (!text) return '';

	// HTMLタグを除去
	const stripped = text.replace(/<[^>]*>/g, '');

	// 改行文字を空白に置換
	const normalized = stripped.replace(/\s+/g, ' ').trim();

	// 指定文字数でトランケート
	if (normalized.length <= maxLength) {
		return normalized;
	}

	// 単語境界でカット
	const truncated = normalized.substring(0, maxLength - 3);
	const lastSpace = truncated.lastIndexOf(' ');

	if (lastSpace > maxLength * 0.8) {
		return truncated.substring(0, lastSpace) + '...';
	}

	return truncated + '...';
}

/**
 * OGPタイトルを最適化する
 */
export function optimizeOGPTitle(title: string, siteName?: string, maxLength: number = 60): string {
	if (!title) return siteName || '';

	// サイト名を含める場合の調整
	if (siteName && title !== siteName) {
		const separator = ' - ';
		const availableLength = maxLength - siteName.length - separator.length;

		if (title.length <= availableLength) {
			return `${title}${separator}${siteName}`;
		} else {
			// タイトルを短縮
			const truncated = title.substring(0, availableLength - 3) + '...';
			return `${truncated}${separator}${siteName}`;
		}
	}

	// サイト名なしの場合
	if (title.length <= maxLength) {
		return title;
	}

	return title.substring(0, maxLength - 3) + '...';
}
