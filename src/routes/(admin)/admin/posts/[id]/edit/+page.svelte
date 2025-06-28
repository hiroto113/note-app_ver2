<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PostForm from '$lib/components/admin/PostForm.svelte';
	import type { PageData } from './$types';
	
	export let data: PageData;
	
	let loading = false;
	let error = '';
	
	$: postId = $page.params.id;
	
	// Initialize category selection based on post's existing categories
	$: initialCategoryIds = data.post.categories?.map((cat: any) => cat.id) || [];
	
	async function handleSubmit(event: CustomEvent) {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/admin/posts/${postId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(event.detail)
			});
			
			if (response.ok) {
				const result = await response.json();
				// Redirect to posts list
				goto('/admin/posts');
			} else {
				const errorData = await response.json();
				error = errorData.error || '記事の更新に失敗しました';
			}
		} catch (err) {
			console.error('Update post error:', err);
			error = '記事の更新中にエラーが発生しました';
		} finally {
			loading = false;
		}
	}
	
	function handleCancel() {
		goto('/admin/posts');
	}
</script>

<svelte:head>
	<title>記事の編集: {data.post.title} - 管理画面</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="bg-white border-b border-gray-200 px-4 py-5 sm:px-0">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">記事の編集</h1>
				<p class="mt-1 text-sm text-gray-600">
					「{data.post.title}」を編集しています。
				</p>
			</div>
			
			<div class="flex items-center space-x-3">
				<a
					href="/posts/{data.post.slug}"
					target="_blank"
					class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					記事を表示
				</a>
				
				<a
					href="/admin/posts"
					class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					← 記事一覧に戻る
				</a>
			</div>
		</div>
	</div>
	
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			</div>
		</div>
	{/if}
	
	<PostForm
		post={data.post}
		categories={data.categories}
		isEditing={true}
		{loading}
		on:submit={handleSubmit}
		on:cancel={handleCancel}
	/>
</div>