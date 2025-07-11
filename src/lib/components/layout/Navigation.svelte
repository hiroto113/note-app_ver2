<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { shouldAnimate } from '$lib/utils/animations';
	import { announce } from '$lib/stores/accessibility';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	let isMenuOpen = false;
	let isMobile = false;
	let menuButton: HTMLElement;

	// メニューの開閉
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;

		// スクリーンリーダーへアナウンス
		announce(isMenuOpen ? 'メニューが開かれました' : 'メニューが閉じられました');
	}

	// Escapeキーでメニューを閉じる
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isMenuOpen) {
			isMenuOpen = false;
			menuButton.focus();
			announce('メニューが閉じられました');
		}
	}

	// モバイル表示の判定
	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768; // md breakpoint
			if (!isMobile) {
				isMenuOpen = false; // デスクトップではメニューを閉じる
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<nav
	class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
	aria-label="メインナビゲーション"
>
	<div class="container mx-auto px-4 py-4 md:py-6">
		<div class="flex items-center justify-between">
			<!-- ロゴ -->
			<div class="flex items-center">
				<a
					href="/"
					class="text-xl font-bold text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 md:text-2xl"
					aria-label="My Notes ホームページ"
				>
					My Notes
				</a>
			</div>

			<!-- デスクトップナビゲーション -->
			<div class="hidden md:flex md:space-x-8" role="menubar">
				<a
					href="/"
					class="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
					role="menuitem"
				>
					記事一覧
				</a>
				<a
					href="/about"
					class="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
					role="menuitem"
				>
					学習ログ
				</a>
				<ThemeToggle size="sm" />
			</div>

			<!-- モバイルメニューボタン -->
			<div class="flex items-center space-x-2 md:hidden">
				<ThemeToggle size="sm" />
				<button
					bind:this={menuButton}
					type="button"
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
					aria-controls="mobile-menu"
					aria-expanded={isMenuOpen}
					aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
					on:click={toggleMenu}
				>
					<!-- ハンバーガーアイコン -->
					<svg
						class="block h-6 w-6"
						class:hidden={isMenuOpen}
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<!-- 閉じるアイコン -->
					<svg
						class="h-6 w-6"
						class:hidden={!isMenuOpen}
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- モバイルメニュー -->
		{#if isMenuOpen}
			<div
				id="mobile-menu"
				class="md:hidden"
				role="menu"
				aria-label="モバイルナビゲーションメニュー"
				transition:slide={{ duration: shouldAnimate() ? 200 : 0 }}
			>
				<div class="space-y-1 px-2 pb-3 pt-2 sm:px-3">
					<a
						href="/"
						class="block rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
						role="menuitem"
						on:click={() => (isMenuOpen = false)}
					>
						記事一覧
					</a>
					<a
						href="/about"
						class="block rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
						role="menuitem"
						on:click={() => (isMenuOpen = false)}
					>
						学習ログ
					</a>
				</div>
			</div>
		{/if}
	</div>
</nav>
