<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';

	export let data;

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<a href="/admin" class="text-xl font-bold text-gray-900"> 管理画面 </a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/admin"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url
								.pathname === '/admin'
								? 'border-b-2 border-blue-500 text-gray-900'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							ダッシュボード
						</a>
						<a
							href="/admin/posts"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname.startsWith(
								'/admin/posts'
							)
								? 'border-b-2 border-blue-500 text-gray-900'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							記事管理
						</a>
						<a
							href="/admin/categories"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname.startsWith(
								'/admin/categories'
							)
								? 'border-b-2 border-blue-500 text-gray-900'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							カテゴリ管理
						</a>
					</div>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-700">
						{data.session.user?.name || 'ユーザー'}
					</span>
					<button
						on:click={handleSignOut}
						class="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
					>
						ログアウト
					</button>
					<a href="/" class="text-sm text-gray-500 hover:text-gray-700" target="_blank">
						サイトを表示
					</a>
				</div>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>
