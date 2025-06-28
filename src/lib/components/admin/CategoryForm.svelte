<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import TextArea from '$lib/components/forms/TextArea.svelte';
	import type { Category } from '$lib/server/db/schema';
	
	export let category: Partial<Category> = {};
	export let isEditing: boolean = false;
	export let loading: boolean = false;
	
	const dispatch = createEventDispatcher<{
		submit: {
			name: string;
			description?: string;
		};
		cancel: void;
	}>();
	
	let name = category.name || '';
	let description = category.description || '';
	
	let errors: Record<string, string> = {};
	
	function validateForm() {
		errors = {};
		
		if (!name.trim()) {
			errors.name = 'カテゴリ名は必須です';
		} else if (name.trim().length > 50) {
			errors.name = 'カテゴリ名は50文字以内で入力してください';
		}
		
		if (description && description.trim().length > 200) {
			errors.description = '説明は200文字以内で入力してください';
		}
		
		return Object.keys(errors).length === 0;
	}
	
	function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		
		const formData = {
			name: name.trim(),
			description: description.trim() || undefined
		};
		
		dispatch('submit', formData);
	}
	
	function handleCancel() {
		dispatch('cancel');
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
	<div class="bg-white shadow rounded-lg border border-gray-200 p-6">
		<div class="space-y-6">
			<!-- Category Name -->
			<TextInput
				id="name"
				label="カテゴリ名"
				bind:value={name}
				placeholder="カテゴリの名前を入力してください"
				required
				error={errors.name}
				disabled={loading}
			/>
			
			<!-- Description -->
			<TextArea
				id="description"
				label="説明"
				bind:value={description}
				placeholder="カテゴリの説明（省略可）"
				rows={4}
				error={errors.description}
				disabled={loading}
			/>
		</div>
	</div>
	
	<!-- Metadata Display for Edit Mode -->
	{#if isEditing && category.slug}
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-900 mb-2">メタデータ</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
				<div>
					<span class="font-medium text-gray-700">スラッグ:</span>
					<span class="ml-2 text-gray-900 font-mono">{category.slug}</span>
				</div>
				{#if category.createdAt}
					<div>
						<span class="font-medium text-gray-700">作成日:</span>
						<span class="ml-2 text-gray-900">
							{new Date(category.createdAt).toLocaleDateString('ja-JP', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	
	<!-- Actions -->
	<div class="flex items-center justify-end space-x-4 bg-gray-50 px-6 py-3 rounded-lg">
		<button
			type="button"
			on:click={handleCancel}
			disabled={loading}
			class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			キャンセル
		</button>
		
		<button
			type="submit"
			disabled={loading}
			class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if loading}
				<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				保存中...
			{:else}
				{isEditing ? '更新' : '作成'}
			{/if}
		</button>
	</div>
</form>