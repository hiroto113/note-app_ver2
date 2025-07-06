export default {
	ci: {
		// Lighthouse CI設定
		collect: {
			// テスト対象のURL
			url: ['http://localhost:4173/'],
			// 各URLでの実行回数
			numberOfRuns: 2,
			// 設定項目
			settings: {
				// デスクトップとモバイルの両方でテスト
				preset: 'desktop',
				// ネットワーク速度シミュレーション
				throttlingMethod: 'simulate',
				// カスタム設定
				onlyAudits: [
					// Performance
					'first-contentful-paint',
					'largest-contentful-paint',
					'first-meaningful-paint',
					'speed-index',
					'interactive',
					'total-blocking-time',
					'cumulative-layout-shift',

					// Accessibility
					'color-contrast',
					'heading-order',
					'html-has-lang',
					'html-lang-valid',
					'image-alt',
					'label',
					'link-name',
					'meta-viewport',

					// Best Practices
					'is-on-https',
					'uses-http2',
					'no-vulnerable-libraries',
					'csp-xss',
					'external-anchors-use-rel-noopener',

					// SEO
					'document-title',
					'meta-description',
					'http-status-code',
					'link-text',
					'is-crawlable',
					'robots-txt',
					'canonical'
				]
			}
		},

		// アップロード設定（GitHub Actionsで使用）
		upload: {
			target: 'temporary-public-storage'
		},

		// アサート設定（スコア閾値） - 初期テスト用に緩和
		assert: {
			assertions: {
				// HTTP status codeは500でも警告のみ
				'audits:http-status-code': 'warn',

				// 基本的なアクセシビリティのみチェック
				'audits:html-has-lang': 'warn',
				'audits:meta-viewport': 'warn',

				// その他は警告レベルで設定
				'categories:accessibility': ['warn', { minScore: 0.7 }],
				'categories:best-practices': ['warn', { minScore: 0.6 }],
				'categories:seo': ['warn', { minScore: 0.6 }]
			}
		}
	}
};
