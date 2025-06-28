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
</script>

<article
	class="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg"
>
	<a href="/posts/{post.slug}" class="block">
		<h2 class="mb-2 text-xl font-bold text-gray-900 transition-colors hover:text-blue-600">
			{post.title}
		</h2>

		<p class="mb-4 line-clamp-3 text-gray-600">
			{post.description}
		</p>

		<div class="flex items-center justify-between text-sm text-gray-500">
			<time datetime={post.publishedAt}>
				{formatDate(post.publishedAt)}
			</time>

			<div class="flex gap-2">
				{#each post.categories as category}
					<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
						{category}
					</span>
				{/each}
			</div>
		</div>
	</a>
</article>
