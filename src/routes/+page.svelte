<script lang="ts">
	import PostCard from '$lib/components/post/PostCard.svelte';
	import SlideUp from '$lib/components/ui/SlideUp.svelte';
	import FadeIn from '$lib/components/ui/FadeIn.svelte';
	import MetaHead from '$lib/components/seo/MetaHead.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getStaggerDelay } from '$lib/utils/animations';
	import { generateBreadcrumbs } from '$lib/utils/seo';

	/** @type {import('./$types').PageData} */
	export let data;

	// メタタグ用の情報
	const baseUrl = 'https://mynotes.example.com'; // TODO: 環境変数から取得
	const siteName = 'My Notes';
	
	$: pageTitle = data.currentCategory 
		? `${data.currentCategory}の記事一覧`
		: siteName;
		
	$: pageDescription = data.currentCategory
		? `${data.currentCategory}カテゴリの記事一覧ページです。最新の学習記録とメモをご覧いただけます。`
		: '個人的な学習記録とメモを公開しています。AI×開発に関する知見や技術的な発見を記録しています。';

	// パンくずリスト
	$: breadcrumbs = generateBreadcrumbs($page?.url?.pathname || '/', baseUrl);

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

<!-- SEOメタタグ -->
<MetaHead 
	title={pageTitle}
	description={pageDescription}
	type="website"
	keywords="学習記録,メモ,AI,開発,技術ブログ,プログラミング"
/>

<!-- 構造化データ -->
<StructuredData type="WebSite" />
<StructuredData type="BreadcrumbList" data={{ items: breadcrumbs }} />

<div class="space-y-8">
	<FadeIn>
		<header class="text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">My Notes</h1>
			<p class="text-lg text-gray-600 dark:text-gray-300">個人的な学習記録とメモ</p>
		</header>
	</FadeIn>

	<!-- カテゴリフィルタ -->
	{#if data.categories && data.categories.length > 0}
		<SlideUp delay={200}>
			<div class="flex justify-center">
				<div class="w-full max-w-xs sm:max-w-sm">
					<label
						for="category-filter"
						class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						カテゴリで絞り込み
					</label>
					<select
						id="category-filter"
						class="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
		</SlideUp>
	{/if}

	{#if data.posts.length > 0}
		<section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="記事一覧">
			{#each data.posts as post, index}
				<SlideUp delay={getStaggerDelay(index, 400, 100)}>
					<PostCard {post} />
				</SlideUp>
			{/each}
		</section>

		<!-- ページネーション -->
		{#if data.pagination && data.pagination.totalPages > 1}
			<SlideUp delay={getStaggerDelay(data.posts.length, 400, 100)}>
				<nav class="flex justify-center" aria-label="ページネーション">
					<div class="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
						<!-- 前のページ -->
						{#if data.pagination.page > 1}
							<button
								class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:px-3"
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
									class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:px-3"
									on:click={() => goToPage(pageNum)}
									aria-label="ページ {pageNum}"
								>
									{pageNum}
								</button>
							{:else if Math.abs(pageNum - data.pagination.page) === 3}
								<span
									class="px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:px-3"
									>...</span
								>
							{/if}
						{/each}

						<!-- 次のページ -->
						{#if data.pagination.page < data.pagination.totalPages}
							<button
								class="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:px-3"
								on:click={() => goToPage(data.pagination.page + 1)}
								aria-label="次のページ"
							>
								<span class="hidden sm:inline">次へ</span>
								<span class="sm:hidden">›</span>
							</button>
						{/if}
					</div>
				</nav>
			</SlideUp>
		{/if}
	{:else}
		<FadeIn delay={400}>
			<div class="py-12 text-center">
				<p class="text-gray-500 dark:text-gray-400">
					{data.currentCategory
						? 'このカテゴリの記事がありません。'
						: 'まだ記事がありません。'}
				</p>
			</div>
		</FadeIn>
	{/if}
</div>
