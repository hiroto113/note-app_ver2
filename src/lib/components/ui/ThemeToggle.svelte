<script lang="ts">
	import { themeStore } from '$lib/stores/theme';

	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showText = false;

	// サイズに応じたクラス
	const sizeClasses = {
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-base',
		lg: 'h-12 w-12 text-lg'
	};

	// テーマ切り替え
	function toggleTheme() {
		themeStore.toggle();
	}

	// キーボード操作対応
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleTheme();
		}
	}
</script>

<button
	type="button"
	class="inline-flex items-center justify-center rounded-md p-2 transition-colors duration-200
		   hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
		   dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 {sizeClasses[size]}"
	on:click={toggleTheme}
	on:keydown={handleKeydown}
	aria-label="テーマを切り替え"
	title="ライト/ダークモードを切り替え"
>
	{#if $themeStore.current === 'light'}
		<!-- 月アイコン（ダークモードに切り替え） -->
		<svg
			class="h-5 w-5 text-gray-600 dark:text-gray-300"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	{:else}
		<!-- 太陽アイコン（ライトモードに切り替え） -->
		<svg
			class="h-5 w-5 text-gray-600 dark:text-gray-300"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>
	{/if}

	{#if showText}
		<span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
			{$themeStore.current === 'light' ? 'ダーク' : 'ライト'}
		</span>
	{/if}
</button>
