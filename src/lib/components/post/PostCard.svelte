<script lang="ts">
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
	const displayCategories = (categories: any[]) => {
		if (!categories || categories.length === 0) return [];
		// API response の形式に応じて調整
		return categories.map(cat => 
			typeof cat === 'string' ? cat : cat.name || cat
		);
	};
</script>

<article
	class="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg"
>
	<a href="/posts/{post.slug}" class="block">
		<h2 class="mb-2 text-lg font-bold text-gray-900 transition-colors hover:text-blue-600 md:text-xl">
			{post.title}
		</h2>

		<p class="mb-4 line-clamp-3 text-sm text-gray-600 md:text-base">
			{post.excerpt || post.description || ''}
		</p>

		<div class="flex flex-col space-y-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
			<time datetime={post.publishedAt || post.createdAt}>
				{formatDate(post.publishedAt || post.createdAt)}
			</time>

			<div class="flex flex-wrap gap-1 sm:gap-2">
				{#each displayCategories(post.categories) as category}
					<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
						{category}
					</span>
				{/each}
			</div>
		</div>
	</a>
</article>
