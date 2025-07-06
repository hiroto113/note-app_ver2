<script lang="ts">
	import PostCard from './PostCard.svelte';
	import type { Post } from '$lib/server/db/schema';

	export let posts: Array<Post & { author: { id: string; username: string } }>;

	let searchTerm = '';
	let statusFilter = 'all';

	$: filteredPosts = posts.filter((post) => {
		const matchesSearch =
			searchTerm === '' ||
			post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	$: publishedCount = posts.filter((p) => p.status === 'published').length;
	$: draftCount = posts.filter((p) => p.status === 'draft').length;
</script>

<div class="space-y-6">
	<!-- Header with stats and actions -->
	<div
		class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
	>
		<div>
			<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">記事管理</h1>
			<p class="mt-1 text-sm text-gray-600">
				全 {posts.length} 件（公開: {publishedCount}件、下書き: {draftCount}件）
			</p>
		</div>

		<div class="flex items-center space-x-3">
			<a
				href="/admin/posts/new"
				data-testid="create-post-button"
				class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:px-4"
				aria-label="新しい記事を作成"
			>
				<span class="hidden sm:inline">新しい記事を作成</span>
				<span class="sm:hidden">新規作成</span>
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="rounded-lg border border-gray-200 bg-white p-4 shadow">
		<div
			class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0"
		>
			<div class="flex-1">
				<label for="search" class="sr-only">記事を検索</label>
				<input
					id="search"
					type="text"
					placeholder="タイトルや内容で検索..."
					bind:value={searchTerm}
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				/>
			</div>

			<div class="flex items-center space-x-3">
				<label for="status-filter" class="text-sm font-medium text-gray-700">
					ステータス:
				</label>
				<select
					id="status-filter"
					bind:value={statusFilter}
					class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				>
					<option value="all">すべて</option>
					<option value="published">公開</option>
					<option value="draft">下書き</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Posts list -->
	{#if filteredPosts.length > 0}
		<div
			class="posts-list grid gap-6"
			data-testid="posts-list"
			role="list"
			aria-label="記事一覧"
		>
			{#each filteredPosts as post}
				<PostCard {post} />
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center">
			<div class="mx-auto h-12 w-12 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
			<h3 class="mt-2 text-sm font-medium text-gray-900">記事が見つかりません</h3>
			<p class="mt-1 text-sm text-gray-500">
				{#if searchTerm || statusFilter !== 'all'}
					検索条件に一致する記事がありません。
				{:else}
					最初の記事を作成してみましょう。
				{/if}
			</p>
			{#if !searchTerm && statusFilter === 'all'}
				<div class="mt-6">
					<a
						href="/admin/posts/new"
						class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						新しい記事を作成
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
