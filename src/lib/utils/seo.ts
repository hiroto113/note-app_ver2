/**
 * SEO関連のユーティリティ関数
 */

/**
 * 文字列を指定された長さに切り詰める
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) {
		return text || '';
	}
	return text.substring(0, maxLength - 3) + '...';
}

/**
 * SEO用のタイトルを生成（最大60文字）
 */
export function generateSeoTitle(title: string, siteName: string = ''): string {
	const fullTitle = siteName ? `${title} | ${siteName}` : title;
	return truncateText(fullTitle, 60);
}

/**
 * SEO用の説明文を生成（最大160文字）
 */
export function generateSeoDescription(text: string): string {
	if (!text) return '';
	
	// HTMLタグを除去
	const plainText = text.replace(/<[^>]*>/g, '');
	// 改行を空白に変換
	const singleLine = plainText.replace(/\n+/g, ' ').trim();
	return truncateText(singleLine, 160);
}

/**
 * 記事の内容から自動的にメタ情報を生成
 */
export function generateMetaFromContent(content: string, title: string) {
	if (!content && !title) {
		return {
			description: '',
			keywords: ''
		};
	}

	// 最初の段落を抽出して説明文に使用
	const firstParagraph = content
		? content
			.split('\n')
			.find((line) => line.trim().length > 0 && !line.startsWith('#'))
		: null;

	const description = firstParagraph
		? generateSeoDescription(firstParagraph)
		: generateSeoDescription(title || '');

	// キーワードの抽出（簡易版）
	// TODO: より高度なキーワード抽出アルゴリズムの実装
	const keywords = extractKeywords(content || '');

	return {
		description,
		keywords: keywords.join(', ')
	};
}

/**
 * コンテンツから重要なキーワードを抽出
 */
function extractKeywords(content: string): string[] {
	if (!content) return [];
	
	// HTMLタグを除去
	const plainText = content.replace(/<[^>]*>/g, '');

	// 一般的な日本語のストップワード
	const stopWords = new Set([
		'です',
		'ます',
		'する',
		'なる',
		'ある',
		'いる',
		'れる',
		'られる',
		'こと',
		'もの',
		'ため',
		'よう',
		'から',
		'まで',
		'より',
		'ほど',
		'など',
		'でも',
		'けど',
		'しかし',
		'また',
		'そして',
		'それ',
		'これ',
		'あれ',
		'どれ'
	]);

	// 単語を抽出（簡易版）
	const words = plainText
		.split(/[\s\u3000,。、.!?！？]+/)
		.filter((word) => word.length > 1)
		.filter((word) => !stopWords.has(word))
		.filter((word) => !/^\d+$/.test(word)); // 数字のみは除外

	// 出現頻度でソート
	const wordFreq = new Map<string, number>();
	words.forEach((word) => {
		wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
	});

	// 頻度順でソートして上位を返す
	return Array.from(wordFreq.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([word]) => word);
}

/**
 * パンくずリストのアイテムを生成
 */
export function generateBreadcrumbs(path: string, baseUrl: string) {
	const segments = path.split('/').filter(Boolean);
	const items = [
		{
			name: 'ホーム',
			url: baseUrl
		}
	];

	let currentPath = '';
	segments.forEach((segment, index) => {
		currentPath += `/${segment}`;

		// 最後のセグメントでない場合のみURLを含める
		if (index < segments.length - 1) {
			items.push({
				name: segmentToLabel(segment),
				url: `${baseUrl}${currentPath}`
			});
		} else {
			items.push({
				name: segmentToLabel(segment),
				url: `${baseUrl}${currentPath}`
			});
		}
	});

	return items;
}

/**
 * URLセグメントを表示用ラベルに変換
 */
function segmentToLabel(segment: string): string {
	const labelMap: Record<string, string> = {
		posts: '記事',
		about: '学習ログ',
		categories: 'カテゴリ',
		admin: '管理画面'
	};

	return labelMap[segment] || segment;
}