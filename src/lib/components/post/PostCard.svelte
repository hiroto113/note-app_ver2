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

<article class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
	<a href="/posts/{post.slug}" class="block">
		<h2 class="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
			{post.title}
		</h2>
		
		<p class="text-gray-600 mb-4 line-clamp-3">
			{post.description}
		</p>
		
		<div class="flex items-center justify-between text-sm text-gray-500">
			<time datetime={post.publishedAt}>
				{formatDate(post.publishedAt)}
			</time>
			
			<div class="flex gap-2">
				{#each post.categories as category}
					<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
						{category}
					</span>
				{/each}
			</div>
		</div>
	</a>
</article>