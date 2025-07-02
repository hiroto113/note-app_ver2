<script lang="ts">
	import PostCard from '$lib/components/post/PostCard.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	// カテゴリフィルタ変更時の処理
	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const category = target.value;

		const url = new URL($page.url);
		if (category) {
			url.searchParams.set('category', category);
		} else {
			url.searchParams.delete('category');
		}
		url.searchParams.delete('page'); // カテゴリ変更時はページをリセット

		goto(url.toString());
	}

	// ページネーション
	function goToPage(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>My Notes</title>
	<meta name="description" content="個人的な学習記録とメモ" />
</svelte:head>

<div class="space-y-8">
	<header class="text-center">
		<h1 class="mb-4 text-4xl font-bold text-gray-900">My Notes</h1>
		<p class="text-lg text-gray-600">個人的な学習記録とメモ</p>
	</header>

	<!-- カテゴリフィルタ -->
	{#if data.categories && data.categories.length > 0}
		<div class="flex justify-center">
			<div class="w-full max-w-xs sm:max-w-sm">
				<label for="category-filter" class="mb-2 block text-sm font-medium text-gray-700">
					カテゴリで絞り込み
				</label>
				<select
					id="category-filter"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={data.currentCategory || ''}
					on:change={handleCategoryChange}
				>
					<option value="">すべてのカテゴリ</option>
					{#each data.categories as category}
						<option value={category.slug}>{category.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	{#if data.posts.length > 0}
		<section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.posts as post}
				<PostCard {post} />
			{/each}
		</section>

		<!-- ページネーション -->
		{#if data.pagination && data.pagination.totalPages > 1}
			<nav class="flex justify-center" aria-label="ページネーション">
				<div class="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
					<!-- 前のページ -->
					{#if data.pagination.page > 1}
						<button
							class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 sm:px-3"
							on:click={() => goToPage(data.pagination.page - 1)}
							aria-label="前のページ"
						>
							<span class="hidden sm:inline">前へ</span>
							<span class="sm:hidden">‹</span>
						</button>
					{/if}

					<!-- ページ番号 -->
					{#each Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1) as pageNum}
						{#if pageNum === data.pagination.page}
							<span
								class="rounded-md border border-indigo-600 bg-indigo-600 px-2 py-2 text-sm font-medium text-white sm:px-3"
								aria-current="page"
							>
								{pageNum}
							</span>
						{:else if Math.abs(pageNum - data.pagination.page) <= 2 || pageNum === 1 || pageNum === data.pagination.totalPages}
							<button
								class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 sm:px-3"
								on:click={() => goToPage(pageNum)}
								aria-label="ページ {pageNum}"
							>
								{pageNum}
							</button>
						{:else if Math.abs(pageNum - data.pagination.page) === 3}
							<span class="px-2 py-2 text-sm font-medium text-gray-500 sm:px-3"
								>...</span
							>
						{/if}
					{/each}

					<!-- 次のページ -->
					{#if data.pagination.page < data.pagination.totalPages}
						<button
							class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 sm:px-3"
							on:click={() => goToPage(data.pagination.page + 1)}
							aria-label="次のページ"
						>
							<span class="hidden sm:inline">次へ</span>
							<span class="sm:hidden">›</span>
						</button>
					{/if}
				</div>
			</nav>
		{/if}
	{:else}
		<div class="py-12 text-center">
			<p class="text-gray-500">
				{data.currentCategory
					? 'このカテゴリの記事がありません。'
					: 'まだ記事がありません。'}
			</p>
		</div>
	{/if}
</div>
