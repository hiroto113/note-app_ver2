<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	
	export let data;
	
	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/admin" class="text-xl font-bold text-gray-900">
							管理画面
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/admin"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname === '/admin' ? 'border-b-2 border-blue-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
						>
							ダッシュボード
						</a>
						<a
							href="/admin/posts"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname.startsWith('/admin/posts') ? 'border-b-2 border-blue-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
						>
							記事管理
						</a>
						<a
							href="/admin/categories"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname.startsWith('/admin/categories') ? 'border-b-2 border-blue-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
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
						class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						ログアウト
					</button>
					<a
						href="/"
						class="text-gray-500 hover:text-gray-700 text-sm"
						target="_blank"
					>
						サイトを表示
					</a>
				</div>
			</div>
		</div>
	</nav>
	
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>