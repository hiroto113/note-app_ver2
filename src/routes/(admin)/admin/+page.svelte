<script lang="ts">
	// Currently unused but may be needed for future dashboard data
	export let data;
	// Suppress unused warning
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	data;
</script>

<svelte:head>
	<title>管理画面 - My Notes</title>
</svelte:head>

<div class="px-4 sm:px-0">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">管理画面</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">記事とカテゴリの管理を行えます</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg
							class="h-6 w-6 text-gray-400 dark:text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt
								class="truncate text-sm font-medium text-gray-500 dark:text-gray-400"
							>
								総記事数
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-gray-100">0</dd>
						</dl>
					</div>
				</div>
			</div>
			<div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
				<div class="text-sm">
					<a
						href="/admin/posts"
						class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						記事管理へ
					</a>
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg
							class="h-6 w-6 text-gray-400 dark:text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt
								class="truncate text-sm font-medium text-gray-500 dark:text-gray-400"
							>
								総カテゴリ数
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-gray-100">0</dd>
						</dl>
					</div>
				</div>
			</div>
			<div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
				<div class="text-sm">
					<a
						href="/admin/categories"
						class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						カテゴリ管理へ
					</a>
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg
							class="h-6 w-6 text-gray-400 dark:text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt
								class="truncate text-sm font-medium text-gray-500 dark:text-gray-400"
							>
								公開記事数
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-gray-100">0</dd>
						</dl>
					</div>
				</div>
			</div>
			<div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
				<div class="text-sm">
					<a
						href="/"
						target="_blank"
						class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						サイトを表示
					</a>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-8">
		<div class="rounded-lg bg-white shadow dark:bg-gray-800">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
					クイックアクション
				</h3>
				<div class="mt-5">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<a
							href="/admin/posts/new"
							class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							新しい記事を作成
						</a>
						<a
							href="/admin/categories/new"
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							新しいカテゴリを作成
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
