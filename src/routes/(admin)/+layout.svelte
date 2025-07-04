<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { onMount } from 'svelte';

	export let data;

	let isAdminRoute = false;

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}

	// 管理画面の重要でないコンポーネントを遅延読み込み
	const loadAdminComponents = () =>
		Promise.all([
			// 将来的にダッシュボードウィジェットなどを遅延読み込み
			Promise.resolve()
		]);

	onMount(() => {
		isAdminRoute = $page.url.pathname.startsWith('/admin');

		// 管理画面の場合、追加コンポーネントを事前読み込み
		if (isAdminRoute) {
			loadAdminComponents();
		}
	});
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<nav class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" role="navigation" aria-label="メインナビゲーション">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<a
							href="/admin"
							class="text-lg font-bold text-gray-900 dark:text-gray-100 md:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
							aria-label="管理画面ホームに移動"
						>
							管理画面
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-4 md:space-x-8">
						<a
							href="/admin"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded {$page.url
								.pathname === '/admin'
								? 'border-b-2 border-blue-500 text-gray-900 dark:text-gray-100'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
							aria-current={$page.url.pathname === '/admin' ? 'page' : undefined}
							aria-label="ダッシュボードページ"
						>
							ダッシュボード
						</a>
						<a
							href="/admin/posts"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded {$page.url.pathname.startsWith(
								'/admin/posts'
							)
								? 'border-b-2 border-blue-500 text-gray-900 dark:text-gray-100'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
							aria-current={$page.url.pathname.startsWith('/admin/posts') ? 'page' : undefined}
							aria-label="記事管理ページ"
						>
							記事管理
						</a>
						<a
							href="/admin/categories"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded {$page.url.pathname.startsWith(
								'/admin/categories'
							)
								? 'border-b-2 border-blue-500 text-gray-900 dark:text-gray-100'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
							aria-current={$page.url.pathname.startsWith('/admin/categories') ? 'page' : undefined}
							aria-label="カテゴリ管理ページ"
						>
							カテゴリ管理
						</a>
					</div>
				</div>
				<div class="flex items-center space-x-2 sm:space-x-4">
					<span class="hidden text-sm text-gray-700 dark:text-gray-300 sm:inline">
						{data.session.user?.name || 'ユーザー'}
					</span>
					<ThemeToggle size="sm" />
					<button
						on:click={handleSignOut}
						class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:px-3 sm:py-2 sm:text-sm"
						aria-label="ログアウトしてログインページに移動"
					>
						ログアウト
					</button>
					<a
						href="/"
						class="text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-gray-400 dark:hover:text-gray-200 sm:text-sm"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="新しいタブでサイトを表示"
					>
						<span class="hidden sm:inline">サイトを表示</span>
						<span class="sm:hidden">サイト</span>
					</a>
				</div>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8" role="main" aria-label="メインコンテンツ">
		<slot />
	</main>
</div>
