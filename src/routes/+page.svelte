<script lang="ts">
	import PostCard from '$lib/components/post/PostCard.svelte';
	
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>My Notes</title>
	<meta name="description" content="個人的な学習記録とメモ" />
</svelte:head>

<div class="space-y-8">
	<header class="text-center">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">My Notes</h1>
		<p class="text-lg text-gray-600">個人的な学習記録とメモ</p>
	</header>
	
	{#if data.posts.length > 0}
		<section class="space-y-6">
			{#each data.posts as post}
				<PostCard {post} />
			{/each}
		</section>
	{:else}
		<div class="text-center py-12">
			<p class="text-gray-500">まだ記事がありません。</p>
		</div>
	{/if}
</div>