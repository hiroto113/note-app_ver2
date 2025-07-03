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

	onMount(() => {
		// アクセシビリティ機能の初期化
		setupKeyboardShortcuts();
		initializeA11yPreferences();
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
