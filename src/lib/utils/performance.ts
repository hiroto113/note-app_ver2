/**
 * パフォーマンス測定ユーティリティ
 */

export interface PerformanceMetrics {
	fcp?: number; // First Contentful Paint
	lcp?: number; // Largest Contentful Paint
	fid?: number; // First Input Delay
	cls?: number; // Cumulative Layout Shift
	ttfb?: number; // Time to First Byte
}

/**
 * Core Web Vitalsを測定
 */
export function measureCoreWebVitals(): Promise<PerformanceMetrics> {
	return new Promise((resolve) => {
		const metrics: PerformanceMetrics = {};

		// Web Vitals APIが利用可能な場合
		if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
			try {
				// FCP (First Contentful Paint)
				new PerformanceObserver((entryList) => {
					const entries = entryList.getEntriesByName('first-contentful-paint');
					if (entries.length > 0) {
						metrics.fcp = entries[0].startTime;
					}
				}).observe({ entryTypes: ['paint'] });

				// LCP (Largest Contentful Paint)
				new PerformanceObserver((entryList) => {
					const entries = entryList.getEntries();
					if (entries.length > 0) {
						const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
						metrics.lcp = lastEntry.startTime;
					}
				}).observe({ entryTypes: ['largest-contentful-paint'] });

				// FID (First Input Delay)
				new PerformanceObserver((entryList) => {
					const entries = entryList.getEntries();
					entries.forEach((entry) => {
						if ((entry as any).name === 'first-input') {
							metrics.fid = (entry as any).processingStart - entry.startTime;
						}
					});
				}).observe({ entryTypes: ['first-input'] });

				// CLS (Cumulative Layout Shift)
				let clsValue = 0;
				new PerformanceObserver((entryList) => {
					const entries = entryList.getEntries();
					entries.forEach((entry) => {
						if (!(entry as any).hadRecentInput) {
							clsValue += (entry as any).value;
						}
					});
					metrics.cls = clsValue;
				}).observe({ entryTypes: ['layout-shift'] });

				// Navigation Timing API でTTFBを取得
				const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
				if (navigationEntry) {
					metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
				}

			} catch (error) {
				console.warn('Performance measurement failed:', error);
			}
		}

		// フォールバック: 基本的なタイミング情報
		if (typeof window !== 'undefined' && window.performance) {
			const timing = window.performance.timing;
			if (timing.loadEventEnd && timing.navigationStart) {
				// Page Load Time
				const loadTime = timing.loadEventEnd - timing.navigationStart;
				console.log(`Page Load Time: ${loadTime}ms`);
			}
		}

		// 3秒後に現在の測定値を返す
		setTimeout(() => {
			resolve(metrics);
		}, 3000);
	});
}

/**
 * パフォーマンス情報をコンソールに出力
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics) {
	console.group('🚀 Performance Metrics');
	
	if (metrics.fcp) {
		console.log(`📊 FCP: ${Math.round(metrics.fcp)}ms ${getScoreColor(metrics.fcp, 1800, 3000)}`);
	}
	
	if (metrics.lcp) {
		console.log(`📊 LCP: ${Math.round(metrics.lcp)}ms ${getScoreColor(metrics.lcp, 2500, 4000)}`);
	}
	
	if (metrics.fid) {
		console.log(`📊 FID: ${Math.round(metrics.fid)}ms ${getScoreColor(metrics.fid, 100, 300)}`);
	}
	
	if (metrics.cls) {
		console.log(`📊 CLS: ${metrics.cls.toFixed(3)} ${getScoreColor(metrics.cls * 1000, 100, 250)}`);
	}
	
	if (metrics.ttfb) {
		console.log(`📊 TTFB: ${Math.round(metrics.ttfb)}ms ${getScoreColor(metrics.ttfb, 800, 1800)}`);
	}
	
	console.groupEnd();
}

/**
 * スコアに基づいて色分けを取得
 */
function getScoreColor(value: number, goodThreshold: number, needsImprovementThreshold: number): string {
	if (value <= goodThreshold) {
		return '🟢 Good';
	} else if (value <= needsImprovementThreshold) {
		return '🟡 Needs Improvement';
	} else {
		return '🔴 Poor';
	}
}

/**
 * リソース読み込み時間を測定
 */
export function measureResourceTiming() {
	if (typeof window === 'undefined' || !window.performance) return;

	const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
	const resourceData = resources.map(resource => ({
		name: resource.name,
		duration: Math.round(resource.duration),
		size: resource.transferSize || 0,
		type: getResourceType(resource.name)
	}));

	// サイズでソート
	resourceData.sort((a, b) => b.size - a.size);

	console.group('📦 Resource Loading Times');
	resourceData.slice(0, 10).forEach(resource => {
		console.log(`${resource.type}: ${resource.name.split('/').pop()} - ${resource.duration}ms (${formatBytes(resource.size)})`);
	});
	console.groupEnd();
}

/**
 * リソースタイプを判定
 */
function getResourceType(url: string): string {
	if (url.includes('.js')) return '📜 JS';
	if (url.includes('.css')) return '🎨 CSS';
	if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return '🖼️ IMG';
	if (url.includes('.woff')) return '🔤 Font';
	return '📄 Other';
}

/**
 * バイト数をフォーマット
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 開発環境でのパフォーマンス監視を開始
 */
export function startPerformanceMonitoring() {
	if (typeof window === 'undefined') return;

	// ページロード完了後に測定開始
	window.addEventListener('load', async () => {
		await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
		
		const metrics = await measureCoreWebVitals();
		logPerformanceMetrics(metrics);
		measureResourceTiming();
	});
}