import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define schema directly in script
const qualityMetrics = sqliteTable('quality_metrics', {
	id: text('id').primaryKey(),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	commitHash: text('commit_hash').notNull(),
	branch: text('branch').notNull(),

	// Lighthouse scores
	lighthousePerformance: integer('lighthouse_performance'),
	lighthouseAccessibility: integer('lighthouse_accessibility'),
	lighthouseBestPractices: integer('lighthouse_best_practices'),
	lighthouseSeo: integer('lighthouse_seo'),
	lighthousePwa: integer('lighthouse_pwa'),

	// Core Web Vitals
	lcp: integer('lcp'),
	fid: integer('fid'),
	cls: integer('cls'),

	// Test results
	testUnitTotal: integer('test_unit_total'),
	testUnitPassed: integer('test_unit_passed'),
	testUnitFailed: integer('test_unit_failed'),
	testUnitCoverage: integer('test_unit_coverage'),
	testIntegrationTotal: integer('test_integration_total'),
	testIntegrationPassed: integer('test_integration_passed'),
	testIntegrationFailed: integer('test_integration_failed'),
	testIntegrationCoverage: integer('test_integration_coverage'),
	testE2eTotal: integer('test_e2e_total'),
	testE2ePassed: integer('test_e2e_passed'),
	testE2eFailed: integer('test_e2e_failed'),
	testE2eCoverage: integer('test_e2e_coverage'),

	// Performance metrics
	bundleSize: integer('bundle_size'),
	loadTime: integer('load_time'),
	ttfb: integer('ttfb'),

	// Accessibility
	wcagScore: integer('wcag_score'),
	axeViolations: integer('axe_violations'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// サンプル品質メトリクスデータ
const sampleMetrics = [
	{
		id: 'sample-1',
		timestamp: new Date('2024-01-15'),
		commitHash: 'abc123def',
		branch: 'main',
		lighthousePerformance: 85,
		lighthouseAccessibility: 92,
		lighthouseBestPractices: 88,
		lighthouseSeo: 95,
		lighthousePwa: 80,
		lcp: 1200,
		fid: 80,
		cls: 50,
		testUnitTotal: 120,
		testUnitPassed: 115,
		testUnitFailed: 5,
		testUnitCoverage: 7800, // 78%
		testIntegrationTotal: 25,
		testIntegrationPassed: 24,
		testIntegrationFailed: 1,
		testIntegrationCoverage: 6500, // 65%
		testE2eTotal: 15,
		testE2ePassed: 14,
		testE2eFailed: 1,
		testE2eCoverage: 5500, // 55%
		bundleSize: 524288, // 512KB
		loadTime: 1150,
		ttfb: 200,
		wcagScore: 9200, // 92%
		axeViolations: 2
	},
	{
		id: 'sample-2',
		timestamp: new Date('2024-01-14'),
		commitHash: 'def456ghi',
		branch: 'main',
		lighthousePerformance: 82,
		lighthouseAccessibility: 90,
		lighthouseBestPractices: 85,
		lighthouseSeo: 93,
		lighthousePwa: 78,
		lcp: 1300,
		fid: 90,
		cls: 60,
		testUnitTotal: 118,
		testUnitPassed: 110,
		testUnitFailed: 8,
		testUnitCoverage: 7500, // 75%
		testIntegrationTotal: 24,
		testIntegrationPassed: 22,
		testIntegrationFailed: 2,
		testIntegrationCoverage: 6200, // 62%
		testE2eTotal: 15,
		testE2ePassed: 13,
		testE2eFailed: 2,
		testE2eCoverage: 5200, // 52%
		bundleSize: 540672, // 528KB
		loadTime: 1250,
		ttfb: 220,
		wcagScore: 9000, // 90%
		axeViolations: 3
	},
	{
		id: 'sample-3',
		timestamp: new Date('2024-01-13'),
		commitHash: 'ghi789jkl',
		branch: 'main',
		lighthousePerformance: 88,
		lighthouseAccessibility: 94,
		lighthouseBestPractices: 90,
		lighthouseSeo: 97,
		lighthousePwa: 82,
		lcp: 1100,
		fid: 70,
		cls: 40,
		testUnitTotal: 125,
		testUnitPassed: 122,
		testUnitFailed: 3,
		testUnitCoverage: 8200, // 82%
		testIntegrationTotal: 26,
		testIntegrationPassed: 25,
		testIntegrationFailed: 1,
		testIntegrationCoverage: 6800, // 68%
		testE2eTotal: 16,
		testE2ePassed: 15,
		testE2eFailed: 1,
		testE2eCoverage: 5800, // 58%
		bundleSize: 507904, // 496KB
		loadTime: 1050,
		ttfb: 180,
		wcagScore: 9400, // 94%
		axeViolations: 1
	}
];

async function seedQualityMetrics() {
	try {
		const client = createClient({
			url: process.env.DATABASE_URL || 'file:./local.db'
		});
		const db = drizzle(client);

		console.log('品質メトリクスのサンプルデータを投入します...');

		for (const metric of sampleMetrics) {
			await db.insert(qualityMetrics).values(metric);
			console.log(`✓ メトリクス投入完了: ${metric.id} (${metric.commitHash})`);
		}

		console.log('\n🎉 品質メトリクスのサンプルデータ投入が完了しました!');
		console.log('\n次の手順:');
		console.log('1. ブラウザで http://localhost:5173/admin/quality にアクセス');
		console.log('2. 管理者でログイン (admin / admin123)');
		console.log('3. 品質ダッシュボードでメトリクスを確認');
	} catch (error) {
		console.error('❌ サンプルデータ投入エラー:', error);
		process.exit(1);
	}
}

seedQualityMetrics();
