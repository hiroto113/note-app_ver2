<script>
	import { onMount } from 'svelte';
	import '../app.css';
	import Navigation from '$lib/components/layout/Navigation.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import ThemeProvider from '$lib/components/ui/ThemeProvider.svelte';
	import SkipLink from '$lib/components/a11y/SkipLink.svelte';
	import Announce from '$lib/components/a11y/Announce.svelte';
	import { setupKeyboardShortcuts, initializeA11yPreferences } from '$lib/stores/accessibility';
	import { preloadFonts, observeFontLoading } from '$lib/utils/fonts';
	import { loadNonCriticalCSS, optimizeCSSLoading } from '$lib/utils/critical-css';
	import { startPerformanceMonitoring } from '$lib/utils/performance';
	import { registerServiceWorker, setupOfflineMonitoring } from '$lib/utils/sw';
	import { dev } from '$app/environment';

	onMount(() => {
		// アクセシビリティ機能の初期化
		setupKeyboardShortcuts();
		initializeA11yPreferences();

		// パフォーマンス最適化
		preloadFonts();
		optimizeCSSLoading();

		// フォント読み込み完了後の処理
		observeFontLoading(() => {
			document.documentElement.classList.add('fonts-loaded');
		});

		// 非クリティカルCSSの遅延読み込み
		setTimeout(() => {
			loadNonCriticalCSS('/css/non-critical.css');
		}, 100);

		// 開発環境でのパフォーマンス監視
		if (dev) {
			startPerformanceMonitoring();
		}

		// Service Worker登録とオフライン監視
		registerServiceWorker();
		setupOfflineMonitoring();
	});
</script>

<ThemeProvider>
	<!-- スキップリンク -->
	<SkipLink href="#main-content" />

	<div class="flex min-h-screen flex-col bg-white dark:bg-gray-900">
		<!-- ナビゲーション -->
		<header>
			<Navigation />
		</header>

		<!-- メインコンテンツ -->
		<main id="main-content" class="container mx-auto flex-grow px-4 py-6 md:py-8" tabindex="-1">
			<slot />
		</main>

		<!-- フッター -->
		<footer>
			<Footer />
		</footer>
	</div>

	<!-- トースト通知 -->
	<ToastContainer />

	<!-- スクリーンリーダー用アナウンス -->
	<Announce />
</ThemeProvider>
