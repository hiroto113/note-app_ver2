<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/stores/theme';
	import { browser } from '$app/environment';

	// SSRとクライアントサイドでの初期化の差異を防ぐ
	let mounted = false;

	onMount(() => {
		mounted = true;
		
		// ブラウザ環境でのみ実行
		if (browser) {
			// 初期テーマの適用（重複防止のため）
			const root = document.documentElement;
			const isDark = $themeStore.current === 'dark';
			
			if (isDark && !root.classList.contains('dark')) {
				root.classList.add('dark');
			} else if (!isDark && root.classList.contains('dark')) {
				root.classList.remove('dark');
			}
		}
	});
</script>

<!-- 
  このコンポーネントはテーマの初期化のみを担当します。
  実際のテーマ切り替えロジックはthemeStore内で処理されます。
  SSRとクライアントサイドでの表示差異を最小限に抑えるため、
  マウント後にのみテーマを適用します。
-->

{#if mounted || !browser}
	<slot />
{:else}
	<!-- 初期ロード時の画面ちらつき防止用プレースホルダー -->
	<div class="min-h-screen bg-white">
		<slot />
	</div>
{/if}