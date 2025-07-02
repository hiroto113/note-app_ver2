<script lang="ts">
	import { onMount } from 'svelte';

	let isMenuOpen = false;
	let isMobile = false;

	// メニューの開閉
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
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

	// キーボード操作対応
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isMenuOpen) {
			isMenuOpen = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<nav class="border-b border-gray-200 bg-white">
	<div class="container mx-auto px-4 py-4 md:py-6">
		<div class="flex items-center justify-between">
			<!-- ロゴ -->
			<div class="flex items-center">
				<a href="/" class="text-xl font-bold text-gray-900 hover:text-gray-700 md:text-2xl">
					My Notes
				</a>
			</div>

			<!-- デスクトップナビゲーション -->
			<div class="hidden md:flex md:space-x-8">
				<a href="/" class="text-gray-600 transition-colors hover:text-gray-900">
					記事一覧
				</a>
				<a href="/about" class="text-gray-600 transition-colors hover:text-gray-900">
					学習ログ
				</a>
			</div>

			<!-- モバイルメニューボタン -->
			<div class="md:hidden">
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
					aria-controls="mobile-menu"
					aria-expanded={isMenuOpen}
					aria-label="メインメニュー"
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
			<div id="mobile-menu" class="md:hidden">
				<div class="space-y-1 px-2 pb-3 pt-2 sm:px-3">
					<a
						href="/"
						class="block rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
						on:click={() => (isMenuOpen = false)}
					>
						記事一覧
					</a>
					<a
						href="/about"
						class="block rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
						on:click={() => (isMenuOpen = false)}
					>
						学習ログ
					</a>
				</div>
			</div>
		{/if}
	</div>
</nav>
