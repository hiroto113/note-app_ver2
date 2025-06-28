<script lang="ts">
	import PostList from '$lib/components/admin/PostList.svelte';
	import type { PageData } from './$types';
	
	export let data: PageData;
</script>

<svelte:head>
	<title>記事管理 - 管理画面</title>
</svelte:head>

<PostList posts={data.posts} />