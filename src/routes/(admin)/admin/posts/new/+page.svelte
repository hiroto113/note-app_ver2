<script lang="ts">
	import { goto } from '$app/navigation';
	import PostForm from '$lib/components/admin/PostForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading = false;
	let error = '';

	async function handleSubmit(event: CustomEvent) {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/admin/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(event.detail)
			});

			if (response.ok) {
				// Redirect to posts list
				goto('/admin/posts');
			} else {
				let errorMessage = '記事の作成に失敗しました';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
					console.error('API Error:', errorData);
				} catch (e) {
					// JSONパースエラーの場合、テキストレスポンスを取得
					console.error('Response parse error:', e);
					errorMessage = `エラー: ステータス ${response.status}`;
				}
				error = errorMessage;
			}
		} catch (err) {
			console.error('Create post error:', err);
			error = '記事の作成中にエラーが発生しました';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/admin/posts');
	}
</script>

<svelte:head>
	<title>新しい記事の作成 - 管理画面</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6">
	<div class="border-b border-gray-200 bg-white px-4 py-5 sm:px-0">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">新しい記事の作成</h1>
				<p class="mt-1 text-sm text-gray-600">
					記事の情報を入力して、新しい記事を作成します。
				</p>
			</div>

			<a
				href="/admin/posts"
				class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				← 記事一覧に戻る
			</a>
		</div>
	</div>

	{#if error}
		<div class="rounded-md border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<PostForm
		categories={data.categories}
		{loading}
		on:submit={handleSubmit}
		on:cancel={handleCancel}
	/>
</div>
