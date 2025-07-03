# Issue: 品質ダッシュボードの実装

## 基本情報

- **Issue Type**: Feature
- **Priority**: Medium
- **Estimated Time**: 2-3日
- **Assignee**: 開発者
- **Labels**: `dashboard`, `quality-assurance`, `monitoring`, `phase-7.5`

## 概要

品質メトリクスを可視化し、継続的な品質改善を支援するダッシュボードを実装する。Lighthouse スコア、テスト結果、パフォーマンス指標等を一元管理する。

## 実装内容

### 1. 品質ダッシュボード画面

**ファイル構成:**

```
src/routes/admin/quality/
├── +page.svelte            # ダッシュボードメイン画面
├── +page.server.ts         # サーバーサイドロジック
└── components/
    ├── MetricsOverview.svelte     # メトリクス概要
    ├── LighthouseChart.svelte     # Lighthouse スコア推移
    ├── TestResultsPanel.svelte    # テスト結果表示
    ├── PerformanceChart.svelte    # パフォーマンス推移
    └── QualityAlerts.svelte       # 品質アラート
```

### 2. 品質メトリクスの管理

**データモデル:**

```typescript
// src/lib/types/quality-metrics.ts
export interface QualityMetrics {
	id: string;
	timestamp: Date;
	commitHash: string;
	branch: string;

	// Lighthouse スコア
	lighthouse: {
		performance: number;
		accessibility: number;
		bestPractices: number;
		seo: number;
		pwa: number;
	};

	// Core Web Vitals
	coreWebVitals: {
		lcp: number; // Largest Contentful Paint
		fid: number; // First Input Delay
		cls: number; // Cumulative Layout Shift
	};

	// テスト結果
	testResults: {
		unit: TestResult;
		integration: TestResult;
		e2e: TestResult;
	};

	// パフォーマンス指標
	performance: {
		bundleSize: number;
		loadTime: number;
		ttfb: number; // Time to First Byte
	};

	// アクセシビリティ
	accessibility: {
		wcagScore: number;
		axeViolations: number;
	};
}

export interface TestResult {
	total: number;
	passed: number;
	failed: number;
	coverage: number;
	duration: number;
}
```

### 3. データ収集・保存システム

**メトリクス収集:**

```typescript
// src/lib/server/quality-metrics.ts
import { db } from '$lib/server/db';
import { qualityMetrics } from '$lib/server/db/schema';

export class QualityMetricsService {
	async saveMetrics(metrics: QualityMetrics): Promise<void> {
		await db.insert(qualityMetrics).values(metrics);
	}

	async getMetrics(options: {
		limit?: number;
		branch?: string;
		dateRange?: { start: Date; end: Date };
	}): Promise<QualityMetrics[]> {
		// 実装詳細
	}

	async getLatestMetrics(): Promise<QualityMetrics | null> {
		// 実装詳細
	}
}
```

**データベーススキーマ:**

```sql
-- 品質メトリクステーブル
CREATE TABLE quality_metrics (
  id TEXT PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  commit_hash TEXT NOT NULL,
  branch TEXT NOT NULL,
  lighthouse_performance INTEGER,
  lighthouse_accessibility INTEGER,
  lighthouse_best_practices INTEGER,
  lighthouse_seo INTEGER,
  lighthouse_pwa INTEGER,
  lcp REAL,
  fid REAL,
  cls REAL,
  test_unit_total INTEGER,
  test_unit_passed INTEGER,
  test_unit_failed INTEGER,
  test_unit_coverage REAL,
  test_integration_total INTEGER,
  test_integration_passed INTEGER,
  test_integration_failed INTEGER,
  test_integration_coverage REAL,
  test_e2e_total INTEGER,
  test_e2e_passed INTEGER,
  test_e2e_failed INTEGER,
  test_e2e_coverage REAL,
  bundle_size INTEGER,
  load_time REAL,
  ttfb REAL,
  wcag_score REAL,
  axe_violations INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. ダッシュボードUI

**メトリクス概要パネル:**

```svelte
<!-- src/routes/admin/quality/components/MetricsOverview.svelte -->
<script lang="ts">
	import type { QualityMetrics } from '$lib/types/quality-metrics';

	export let metrics: QualityMetrics;

	$: lighthouseAverage =
		(metrics.lighthouse.performance +
			metrics.lighthouse.accessibility +
			metrics.lighthouse.bestPractices +
			metrics.lighthouse.seo) /
		4;
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
	<!-- Lighthouse 総合スコア -->
	<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<h3 class="mb-2 text-lg font-semibold">Lighthouse 総合</h3>
		<div class="text-3xl font-bold text-blue-600">
			{Math.round(lighthouseAverage)}
		</div>
		<div class="mt-1 text-sm text-gray-600">目標: 90+</div>
	</div>

	<!-- Core Web Vitals -->
	<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<h3 class="mb-2 text-lg font-semibold">Core Web Vitals</h3>
		<div class="space-y-2">
			<div class="flex justify-between">
				<span>LCP</span>
				<span class={metrics.coreWebVitals.lcp <= 2.5 ? 'text-green-600' : 'text-red-600'}>
					{metrics.coreWebVitals.lcp}s
				</span>
			</div>
			<div class="flex justify-between">
				<span>FID</span>
				<span class={metrics.coreWebVitals.fid <= 100 ? 'text-green-600' : 'text-red-600'}>
					{metrics.coreWebVitals.fid}ms
				</span>
			</div>
			<div class="flex justify-between">
				<span>CLS</span>
				<span class={metrics.coreWebVitals.cls <= 0.1 ? 'text-green-600' : 'text-red-600'}>
					{metrics.coreWebVitals.cls}
				</span>
			</div>
		</div>
	</div>

	<!-- テスト結果 -->
	<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<h3 class="mb-2 text-lg font-semibold">テスト結果</h3>
		<div class="space-y-2">
			<div class="flex justify-between">
				<span>Unit</span>
				<span
					class={metrics.testResults.unit.failed === 0
						? 'text-green-600'
						: 'text-red-600'}
				>
					{metrics.testResults.unit.passed}/{metrics.testResults.unit.total}
				</span>
			</div>
			<div class="flex justify-between">
				<span>Integration</span>
				<span
					class={metrics.testResults.integration.failed === 0
						? 'text-green-600'
						: 'text-red-600'}
				>
					{metrics.testResults.integration.passed}/{metrics.testResults.integration.total}
				</span>
			</div>
			<div class="flex justify-between">
				<span>E2E</span>
				<span
					class={metrics.testResults.e2e.failed === 0 ? 'text-green-600' : 'text-red-600'}
				>
					{metrics.testResults.e2e.passed}/{metrics.testResults.e2e.total}
				</span>
			</div>
		</div>
	</div>

	<!-- パフォーマンス -->
	<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<h3 class="mb-2 text-lg font-semibold">パフォーマンス</h3>
		<div class="space-y-2">
			<div class="flex justify-between">
				<span>Bundle Size</span>
				<span>{Math.round(metrics.performance.bundleSize / 1024)}KB</span>
			</div>
			<div class="flex justify-between">
				<span>Load Time</span>
				<span>{metrics.performance.loadTime}ms</span>
			</div>
			<div class="flex justify-between">
				<span>TTFB</span>
				<span>{metrics.performance.ttfb}ms</span>
			</div>
		</div>
	</div>
</div>
```

**推移グラフ:**

```svelte
<!-- src/routes/admin/quality/components/LighthouseChart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { QualityMetrics } from '$lib/types/quality-metrics';

	export let metricsHistory: QualityMetrics[];

	let chartCanvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		const ctx = chartCanvas.getContext('2d');

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: metricsHistory.map((m) => m.timestamp.toLocaleDateString()),
				datasets: [
					{
						label: 'Performance',
						data: metricsHistory.map((m) => m.lighthouse.performance),
						borderColor: 'rgb(59, 130, 246)',
						backgroundColor: 'rgba(59, 130, 246, 0.1)'
					},
					{
						label: 'Accessibility',
						data: metricsHistory.map((m) => m.lighthouse.accessibility),
						borderColor: 'rgb(16, 185, 129)',
						backgroundColor: 'rgba(16, 185, 129, 0.1)'
					},
					{
						label: 'Best Practices',
						data: metricsHistory.map((m) => m.lighthouse.bestPractices),
						borderColor: 'rgb(245, 158, 11)',
						backgroundColor: 'rgba(245, 158, 11, 0.1)'
					},
					{
						label: 'SEO',
						data: metricsHistory.map((m) => m.lighthouse.seo),
						borderColor: 'rgb(139, 92, 246)',
						backgroundColor: 'rgba(139, 92, 246, 0.1)'
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true,
						max: 100
					}
				}
			}
		});
	});
</script>

<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
	<h3 class="mb-4 text-lg font-semibold">Lighthouse スコア推移</h3>
	<canvas bind:this={chartCanvas}></canvas>
</div>
```

### 5. CI/CDとの統合

**GitHub Actions での品質メトリクス収集:**

```yaml
# .github/workflows/quality-metrics.yml
name: Quality Metrics Collection

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main, develop]

jobs:
    collect-metrics:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'pnpm'

            - name: Install dependencies
              run: pnpm install --frozen-lockfile

            - name: Run tests and collect metrics
              run: |
                  pnpm run test:coverage
                  pnpm run test:integration
                  pnpm run test:e2e
                  pnpm run lighthouse:collect
              env:
                  CI: true

            - name: Upload metrics to dashboard
              run: node scripts/upload-metrics.js
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
                  QUALITY_DASHBOARD_URL: ${{ secrets.QUALITY_DASHBOARD_URL }}
```

**メトリクス収集スクリプト:**

```javascript
// scripts/upload-metrics.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectAndUploadMetrics() {
	const metrics = {
		timestamp: new Date(),
		commitHash: execSync('git rev-parse HEAD').toString().trim(),
		branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),

		// Lighthouse results
		lighthouse: JSON.parse(fs.readFileSync('.lighthouseci/results.json', 'utf8')),

		// Test results
		testResults: {
			unit: JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8')),
			integration: JSON.parse(fs.readFileSync('test-results/integration.json', 'utf8')),
			e2e: JSON.parse(fs.readFileSync('test-results/e2e.json', 'utf8'))
		},

		// Performance metrics
		performance: {
			bundleSize: fs.statSync('dist/bundle.js').size
			// その他のメトリクス
		}
	};

	// ダッシュボードAPIに送信
	await fetch(`${process.env.QUALITY_DASHBOARD_URL}/api/metrics`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(metrics)
	});
}

collectAndUploadMetrics().catch(console.error);
```

## 完了基準

### 基本機能

- [ ] 品質ダッシュボード画面が実装されている
- [ ] 品質メトリクスの保存・取得ができる
- [ ] 推移グラフが表示される
- [ ] テスト結果が表示される

### データ収集

- [ ] CI/CDからのメトリクス収集が動作する
- [ ] 品質メトリクスが自動保存される
- [ ] 履歴データが蓄積される

### 可視化

- [ ] Lighthouse スコア推移グラフ
- [ ] Core Web Vitals 推移グラフ
- [ ] テスト結果サマリー
- [ ] パフォーマンス指標推移

### アラート機能

- [ ] 品質基準を下回った場合の通知
- [ ] テスト失敗時の通知
- [ ] パフォーマンス劣化時の通知

## 関連ファイル

### 新規作成

- `src/routes/admin/quality/`
- `src/lib/types/quality-metrics.ts`
- `src/lib/server/quality-metrics.ts`
- `scripts/upload-metrics.js`
- `.github/workflows/quality-metrics.yml`

### 既存ファイル修正

- `src/lib/server/db/schema.ts`
- `package.json`

## 影響範囲

- 管理画面
- データベーススキーマ
- CI/CDパイプライン
- 品質保証プロセス

## 備考

- Chart.js を使用したグラフ表示
- 品質メトリクスの長期保存
- 品質トレンドの可視化
- 継続的品質改善の支援
