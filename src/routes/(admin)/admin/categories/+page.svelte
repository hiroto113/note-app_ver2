<script lang="ts">
	import { goto } from '$app/navigation';
	import CategoryList from '$lib/components/admin/CategoryList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function handleCategoryEdit(categoryId: number) {
		goto(`/admin/categories/${categoryId}/edit`);
	}

	async function handleCategoryDelete(categoryId: number) {
		if (
			!confirm(
				'このカテゴリを削除してもよろしいですか？関連付けられた投稿からもカテゴリが削除されます。'
			)
		) {
			return;
		}

		try {
			const response = await fetch('/api/admin/categories', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id: categoryId })
			});

			if (response.ok) {
				// Reload the page to refresh the category list
				window.location.reload();
			} else {
				const errorData = await response.json();
				alert(`削除に失敗しました: ${errorData.error || '不明なエラー'}`);
			}
		} catch (err) {
			console.error('Delete category error:', err);
			alert('削除中にエラーが発生しました');
		}
	}
</script>

<svelte:head>
	<title>カテゴリ管理 - 管理画面</title>
</svelte:head>

<div class="px-4 sm:px-0">
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">カテゴリ管理</h1>
				<p class="mt-2 text-gray-600">記事のカテゴリを管理します</p>
			</div>
			<div class="flex items-center space-x-3">
				<a
					href="/admin"
					class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					← 管理画面に戻る
				</a>
				<a
					href="/admin/categories/new"
					class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					新しいカテゴリを作成
				</a>
			</div>
		</div>
	</div>

	<CategoryList
		categories={data.categories}
		on:edit={(event) => handleCategoryEdit(event.detail)}
		on:delete={(event) => handleCategoryDelete(event.detail)}
	/>
</div>
