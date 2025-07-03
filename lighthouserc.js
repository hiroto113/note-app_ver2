module.exports = {
  ci: {
    // Lighthouse CI設定
    collect: {
      // テスト対象のURL
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/posts',
        'http://localhost:3000/categories',
        'http://localhost:3000/admin'
      ],
      // 各URLでの実行回数
      numberOfRuns: 3,
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
    
    // アサート設定（スコア閾値）
    assert: {
      assertions: {
        // Performance（パフォーマンス）スコア
        'categories:performance': ['error', { minScore: 0.9 }],
        // Accessibility（アクセシビリティ）スコア
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Best Practices（ベストプラクティス）スコア
        'categories:best-practices': ['error', { minScore: 0.9 }],
        // SEO スコア
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // 個別指標の閾値
        'audits:first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'audits:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'audits:interactive': ['error', { maxNumericValue: 3000 }],
        'audits:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'audits:total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // アクセシビリティ
        'audits:color-contrast': 'error',
        'audits:heading-order': 'error',
        'audits:html-has-lang': 'error',
        'audits:image-alt': 'error',
        
        // ベストプラクティス
        'audits:is-on-https': 'error',
        'audits:no-vulnerable-libraries': 'error',
        
        // SEO
        'audits:document-title': 'error',
        'audits:meta-description': 'error',
        'audits:is-crawlable': 'error'
      }
    }
  }
};

// モバイル用設定
module.exports.mobile = {
  ci: {
    ...module.exports.ci,
    collect: {
      ...module.exports.ci.collect,
      settings: {
        ...module.exports.ci.collect.settings,
        preset: 'mobile',
        // モバイル用の更に厳しい閾値
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        ...module.exports.ci.assert.assertions,
        // モバイルではより厳しい基準
        'audits:first-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'audits:largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'audits:interactive': ['error', { maxNumericValue: 5000 }]
      }
    }
  }
};