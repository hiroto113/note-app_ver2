<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Category } from '$lib/server/db/schema';
	
	export let categories: Category[] = [];
	
	const dispatch = createEventDispatcher<{
		edit: number;
		delete: number;
	}>();
	
	let searchQuery = '';
	let filteredCategories: Category[] = [];
	
	// Filter categories based on search query
	$: {
		if (searchQuery.trim()) {
			filteredCategories = categories.filter(
				category =>
					category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		} else {
			filteredCategories = categories;
		}
	}
	
	function handleEdit(categoryId: number) {
		dispatch('edit', categoryId);
	}
	
	function handleDelete(categoryId: number) {
		dispatch('delete', categoryId);
	}
	
	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="bg-white shadow rounded-lg">
	<div class="px-4 py-5 sm:p-6">
		<!-- Search and Actions -->
		<div class="mb-6">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex-1 max-w-lg">
					<label for="search" class="sr-only">カテゴリを検索</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							id="search"
							type="text"
							bind:value={searchQuery}
							placeholder="カテゴリ名または説明で検索..."
							class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
				
				<div class="text-sm text-gray-500">
					{filteredCategories.length} / {categories.length} カテゴリ
				</div>
			</div>
		</div>
		
		{#if filteredCategories.length === 0}
			<div class="text-center py-12">
				{#if categories.length === 0}
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">カテゴリがありません</h3>
					<p class="mt-1 text-sm text-gray-500">最初のカテゴリを作成してみましょう。</p>
					<div class="mt-6">
						<a
							href="/admin/categories/new"
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							カテゴリを作成
						</a>
					</div>
				{:else}
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">検索結果が見つかりません</h3>
					<p class="mt-1 text-sm text-gray-500">検索条件を変更してもう一度お試しください。</p>
				{/if}
			</div>
		{:else}
			<!-- Categories Table -->
			<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
				<table class="min-w-full divide-y divide-gray-300">
					<thead class="bg-gray-50">
						<tr>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								カテゴリ名
							</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								説明
							</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								スラッグ
							</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								作成日
							</th>
							<th scope="col" class="relative px-6 py-3">
								<span class="sr-only">アクション</span>
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredCategories as category (category.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{category.name}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-500 max-w-xs truncate">
										{category.description || '説明なし'}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-500 font-mono">
										{category.slug}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-500">
										{formatDate(category.createdAt)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
									<button
										type="button"
										on:click={() => handleEdit(category.id)}
										class="text-blue-600 hover:text-blue-900 font-medium"
									>
										編集
									</button>
									<button
										type="button"
										on:click={() => handleDelete(category.id)}
										class="text-red-600 hover:text-red-900 font-medium"
									>
										削除
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>