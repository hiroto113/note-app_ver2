<script lang="ts">
	import { goto } from '$app/navigation';
	import CategoryForm from '$lib/components/admin/CategoryForm.svelte';
	
	let loading = false;
	let error = '';
	
	async function handleSubmit(event: CustomEvent) {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/admin/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(event.detail)
			});
			
			if (response.ok) {
				const result = await response.json();
				// Redirect to categories list
				goto('/admin/categories');
			} else {
				const errorData = await response.json();
				error = errorData.error || 'カテゴリの作成に失敗しました';
			}
		} catch (err) {
			console.error('Create category error:', err);
			error = 'カテゴリの作成中にエラーが発生しました';
		} finally {
			loading = false;
		}
	}
	
	function handleCancel() {
		goto('/admin/categories');
	}
</script>

<svelte:head>
	<title>新しいカテゴリの作成 - 管理画面</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="bg-white border-b border-gray-200 px-4 py-5 sm:px-0">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">新しいカテゴリの作成</h1>
				<p class="mt-1 text-sm text-gray-600">
					カテゴリの情報を入力して、新しいカテゴリを作成します。
				</p>
			</div>
			
			<a
				href="/admin/categories"
				class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				← カテゴリ一覧に戻る
			</a>
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
	
	<CategoryForm
		{loading}
		on:submit={handleSubmit}
		on:cancel={handleCancel}
	/>
</div>