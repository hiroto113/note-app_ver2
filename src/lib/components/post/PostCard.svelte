<script lang="ts">
	import { shouldAnimate } from '$lib/utils/animations';
	import ScreenReaderOnly from '$lib/components/a11y/ScreenReaderOnly.svelte';

	/** @type {import('$lib/types').Post} */
	export let post;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	// カテゴリ表示処理
	const displayCategories = (categories: unknown[]) => {
		if (!categories || categories.length === 0) return [];
		// API response の形式に応じて調整
		return categories.map((cat) =>
			typeof cat === 'string' ? cat : (cat as { name?: string }).name || cat
		);
	};

	// アニメーションを有効にするかどうか
	const animationsEnabled = shouldAnimate();
	const hoverClasses = animationsEnabled
		? 'transform transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl'
		: 'transition-shadow duration-200 hover:shadow-lg';

	// アクセシブルなタイトルIDを生成
	const titleId = `post-title-${post.id || post.slug}`;
	const metaId = `post-meta-${post.id || post.slug}`;
</script>

<article
	class="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800 {hoverClasses}"
	aria-labelledby={titleId}
	aria-describedby={metaId}
>
	<a href="/posts/{post.slug}" class="block" aria-label="記事「{post.title}」を読む">
		<h2
			id={titleId}
			class="mb-2 text-lg font-bold text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400 md:text-xl"
		>
			{post.title}
		</h2>

		<p class="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300 md:text-base">
			{post.excerpt || post.description || ''}
		</p>

		<div
			id={metaId}
			class="flex flex-col space-y-2 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
		>
			<time datetime={post.publishedAt || post.createdAt}>
				{formatDate(post.publishedAt || post.createdAt)}
			</time>

			<div class="flex flex-wrap gap-1 sm:gap-2">
				{#each displayCategories(post.categories) as category}
					<span
						class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
						aria-label="カテゴリ: {category}"
					>
						{category}
					</span>
				{/each}
			</div>
		</div>
	</a>

	<!-- スクリーンリーダー用の追加情報 -->
	<ScreenReaderOnly>
		記事の概要: {post.excerpt || post.description || 'なし'}
		投稿日: {formatDate(post.publishedAt || post.createdAt)}
		{#if displayCategories(post.categories).length > 0}
			カテゴリ: {displayCategories(post.categories).join(', ')}
		{/if}
	</ScreenReaderOnly>
</article>
