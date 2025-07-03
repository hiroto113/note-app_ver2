<script lang="ts">
	import { onMount } from 'svelte';

	let isOnline = true;

	onMount(() => {
		// オンライン状態を監視
		isOnline = navigator.onLine;

		const handleOnline = () => {
			isOnline = true;
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			window.location.href = '/';
		}
	}

	function retry() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>オフライン - My Notes</title>
	<meta name="description" content="インターネット接続がありません" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
>
	<div class="w-full max-w-md space-y-8 text-center">
		<!-- オフライン/オンラインアイコン -->
		<div class="flex justify-center">
			{#if isOnline}
				<div class="rounded-full bg-green-100 p-3 dark:bg-green-900">
					<svg
						class="h-16 w-16 text-green-600 dark:text-green-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
						/>
					</svg>
				</div>
			{:else}
				<div class="rounded-full bg-red-100 p-3 dark:bg-red-900">
					<svg
						class="h-16 w-16 text-red-600 dark:text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M18.364 5.636L5.636 18.364m0-12.728L18.364 18.364M9 9h6m-6 6h6"
						/>
					</svg>
				</div>
			{/if}
		</div>

		<!-- メッセージ -->
		<div>
			{#if isOnline}
				<h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
					接続が復旧しました
				</h1>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
					インターネット接続が復旧しました。ページを再読み込みしてください。
				</p>
			{:else}
				<h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
					オフラインです
				</h1>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
					インターネット接続を確認してから、もう一度お試しください。
				</p>
			{/if}
		</div>

		<!-- 詳細情報 -->
		<div class="rounded-lg bg-white px-6 py-4 shadow dark:bg-gray-800">
			<h2 class="mb-3 text-lg font-medium text-gray-900 dark:text-gray-100">できること</h2>
			<ul class="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
				<li class="flex items-center">
					<svg
						class="mr-2 h-4 w-4 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					キャッシュされたページの閲覧
				</li>
				<li class="flex items-center">
					<svg
						class="mr-2 h-4 w-4 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					保存された記事の読み返し
				</li>
				<li class="flex items-center text-gray-400">
					<svg class="mr-2 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
					新しい記事の作成（オンライン復旧後に同期）
				</li>
			</ul>
		</div>

		<!-- アクションボタン -->
		<div class="space-y-3">
			{#if isOnline}
				<button
					on:click={retry}
					class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					ページを再読み込み
				</button>
			{:else}
				<button
					on:click={retry}
					class="flex w-full justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					再試行
				</button>
			{/if}

			<button
				on:click={goBack}
				class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
			>
				前のページに戻る
			</button>

			<a
				href="/"
				class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
			>
				ホームページへ
			</a>
		</div>

		<!-- 接続状態の詳細 -->
		<div class="text-xs text-gray-500 dark:text-gray-400">
			<p>
				接続状態: <span class="font-medium {isOnline ? 'text-green-600' : 'text-red-600'}">
					{isOnline ? 'オンライン' : 'オフライン'}
				</span>
			</p>
			<p class="mt-1">
				最終更新: {new Date().toLocaleString('ja-JP')}
			</p>
		</div>
	</div>
</div>
