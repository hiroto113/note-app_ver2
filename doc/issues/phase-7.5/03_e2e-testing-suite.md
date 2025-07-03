# Issue: E2Eテストスイートの実装

## 基本情報

- **Issue Type**: Feature
- **Priority**: High
- **Estimated Time**: 3-4日
- **Assignee**: 開発者
- **Labels**: `testing`, `e2e`, `playwright`, `quality-assurance`, `phase-7.5`

## 概要

Playwrightを使用して、アプリケーション全体のE2Eテストスイートを実装し、実際のユーザーの操作フローを自動化してテストする。

## 実装対象のユーザージャーニー

### 1. 一般訪問者のジャーニー

**記事閲覧フロー:**

- [ ] トップページアクセス
- [ ] 記事一覧表示
- [ ] 記事詳細表示
- [ ] カテゴリ別記事表示
- [ ] レスポンシブデザイン確認

**ナビゲーション:**

- [ ] ヘッダーナビゲーション
- [ ] フッターナビゲーション
- [ ] ページネーション
- [ ] 検索機能（実装時）

### 2. 管理者のジャーニー

**認証フロー:**

- [ ] ログインページアクセス
- [ ] 認証情報入力
- [ ] ログイン成功・失敗
- [ ] セッション管理
- [ ] ログアウト

**記事管理フロー:**

- [ ] 管理画面アクセス
- [ ] 記事一覧表示
- [ ] 記事作成
- [ ] 記事編集
- [ ] 記事削除
- [ ] 記事プレビュー

**カテゴリ管理フロー:**

- [ ] カテゴリ一覧表示
- [ ] カテゴリ作成
- [ ] カテゴリ編集
- [ ] カテゴリ削除

**リッチテキストエディタ:**

- [ ] テキスト入力
- [ ] フォーマット適用
- [ ] 画像挿入
- [ ] プレビュー機能

### 3. クロスブラウザ・デバイステスト

**ブラウザテスト:**

- [ ] Chrome（デスクトップ・モバイル）
- [ ] Firefox（デスクトップ・モバイル）
- [ ] Safari（デスクトップ・モバイル）
- [ ] Edge（デスクトップ）

**デバイステスト:**

- [ ] デスクトップ（1920x1080）
- [ ] タブレット（768x1024）
- [ ] モバイル（375x667）
- [ ] 大画面（2560x1440）

## 実装内容

### 1. テストファイル構成

```
tests/e2e/
├── fixtures/
│   ├── test-data.ts        # テストデータ
│   └── auth-setup.ts       # 認証設定
├── pages/
│   ├── home.spec.ts        # トップページテスト
│   ├── post-detail.spec.ts # 記事詳細テスト
│   ├── login.spec.ts       # ログインテスト
│   └── admin/
│       ├── posts.spec.ts   # 記事管理テスト
│       └── categories.spec.ts # カテゴリ管理テスト
├── utils/
│   ├── auth-helpers.ts     # 認証ヘルパー
│   ├── data-helpers.ts     # データ操作ヘルパー
│   └── page-helpers.ts     # ページ操作ヘルパー
└── performance/
    ├── lighthouse.spec.ts  # Lighthouse テスト
    └── core-web-vitals.spec.ts # Core Web Vitals テスト
```

### 2. 主要テストケース

**一般訪問者テスト:**

```typescript
// tests/e2e/pages/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
	test('記事一覧が表示される', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('article')).toHaveCount(10);
		await expect(page.locator('h1')).toContainText('最新の記事');
	});

	test('記事詳細ページに遷移できる', async ({ page }) => {
		await page.goto('/');
		await page.locator('article').first().click();
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('.post-content')).toBeVisible();
	});
});
```

**管理者テスト:**

```typescript
// tests/e2e/pages/admin/posts.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth-helpers';

test.describe('記事管理', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('記事を作成できる', async ({ page }) => {
		await page.goto('/admin/posts');
		await page.locator('button:has-text("新規作成")').click();
		await page.fill('[data-testid="title-input"]', 'テスト記事');
		await page.fill('[data-testid="content-input"]', 'テスト内容');
		await page.locator('button:has-text("保存")').click();
		await expect(page.locator('text=記事を作成しました')).toBeVisible();
	});
});
```

### 3. パフォーマンステスト

**Lighthouse テスト:**

```typescript
// tests/e2e/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Lighthouse テスト', () => {
	test('トップページのパフォーマンス', async ({ page }) => {
		await page.goto('/');

		await playAudit({
			page,
			thresholds: {
				performance: 90,
				accessibility: 95,
				'best-practices': 90,
				seo: 95
			}
		});
	});
});
```

**Core Web Vitals テスト:**

```typescript
// tests/e2e/performance/core-web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
	test('LCP が 2.5s 以下', async ({ page }) => {
		await page.goto('/');

		const lcp = await page.evaluate(() => {
			return new Promise((resolve) => {
				new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1];
					resolve(lastEntry.startTime);
				}).observe({ entryTypes: ['largest-contentful-paint'] });
			});
		});

		expect(lcp).toBeLessThan(2500);
	});
});
```

### 4. アクセシビリティテスト

```typescript
// tests/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('アクセシビリティテスト', () => {
	test.beforeEach(async ({ page }) => {
		await injectAxe(page);
	});

	test('WCAG 2.1 AA準拠', async ({ page }) => {
		await page.goto('/');
		await checkA11y(page, null, {
			axeOptions: {
				rules: {
					'color-contrast': { enabled: true },
					'keyboard-navigation': { enabled: true }
				}
			}
		});
	});
});
```

## 設定ファイル

### Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html'], ['json', { outputFile: 'test-results.json' }], ['github']],
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{
			name: 'setup',
			testMatch: '**/setup.ts'
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup']
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			dependencies: ['setup']
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			dependencies: ['setup']
		},
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] },
			dependencies: ['setup']
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 12'] },
			dependencies: ['setup']
		}
	],
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
});
```

## 完了基準

### 基本機能テスト

- [ ] 全ユーザージャーニーのテストが実装されている
- [ ] 全テストが通過している
- [ ] クロスブラウザテストが通過している

### パフォーマンステスト

- [ ] Lighthouse スコア目標値達成
- [ ] Core Web Vitals 基準値達成
- [ ] レスポンシブデザイン確認

### アクセシビリティテスト

- [ ] WCAG 2.1 AA準拠確認
- [ ] キーボードナビゲーション確認
- [ ] スクリーンリーダー対応確認

### CI/CD統合

- [ ] GitHub Actions でのテスト実行
- [ ] テスト結果の可視化
- [ ] 失敗時のスクリーンショット・動画保存

## 関連ファイル

### 新規作成

- `tests/e2e/`
- `playwright.config.ts`

### 既存ファイル修正

- `package.json`
- `.github/workflows/`

## 影響範囲

- 開発フロー
- CI/CDパイプライン
- 品質保証プロセス
- デプロイメント

## 備考

- Playwright v1.40以上を使用
- 並列実行によるテスト時間短縮
- 失敗時のデバッグ情報保存
- 継続的な品質保証の仕組み構築
