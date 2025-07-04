<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TextInput from '$lib/components/forms/TextInput.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import MarkdownEditorWithPreview from '$lib/components/editor/MarkdownEditorWithPreview.svelte';
	import type { Post, Category } from '$lib/server/db/schema';

	export let post: Partial<Post> = {};
	export let categories: Category[] = [];
	export let isEditing: boolean = false;
	export let loading: boolean = false;

	const dispatch = createEventDispatcher<{
		submit: {
			title: string;
			content: string;
			excerpt: string;
			status: 'draft' | 'published';
			categoryIds: number[];
		};
		cancel: void;
	}>();

	let title = post.title || '';
	let content = post.content || '';
	let excerpt = post.excerpt || '';
	let status = post.status || 'draft';
	let selectedCategories: number[] = [];

	let errors: Record<string, string> = {};

	// Category selection state
	let categoryCheckboxes: Record<number, boolean> = {};

	$: {
		// Initialize category checkboxes
		categories.forEach((cat) => {
			if (!(cat.id in categoryCheckboxes)) {
				categoryCheckboxes[cat.id] = false;
			}
		});
	}

	$: selectedCategories = Object.entries(categoryCheckboxes)
		.filter(([, checked]) => checked)
		.map(([id]) => parseInt(id));

	function validateForm() {
		errors = {};

		if (!title.trim()) {
			errors.title = 'タイトルは必須です';
		}

		if (!content.trim()) {
			errors.content = '本文は必須です';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		// Auto-generate excerpt if not provided
		const finalExcerpt = excerpt.trim() || content.substring(0, 200) + '...';

		dispatch('submit', {
			title: title.trim(),
			content: content.trim(),
			excerpt: finalExcerpt,
			status: status as 'draft' | 'published',
			categoryIds: selectedCategories
		});
	}

	function handleCancel() {
		dispatch('cancel');
	}

	// Auto-save functionality (placeholder for future implementation)
	let autoSaveTimeout: ReturnType<typeof setTimeout>;

	function scheduleAutoSave() {
		clearTimeout(autoSaveTimeout);
		autoSaveTimeout = setTimeout(() => {
			// Auto-save logic will be implemented here
			console.log('Auto-save triggered');
		}, 5000);
	}

	$: if (title || content || excerpt) {
		scheduleAutoSave();
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6" aria-label="記事作成フォーム">
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow">
		<div class="space-y-6">
			<!-- Title -->
			<TextInput
				id="title"
				label="タイトル"
				bind:value={title}
				placeholder="記事のタイトルを入力してください"
				required
				error={errors.title}
				disabled={loading}
			/>

			<!-- Content -->
			<MarkdownEditorWithPreview
				bind:value={content}
				label="本文"
				placeholder="記事の内容をMarkdown形式で入力してください"
				required
				error={errors.content}
				disabled={loading}
				height="500px"
			/>

			<!-- Excerpt -->
			<MarkdownEditorWithPreview
				bind:value={excerpt}
				label="概要"
				placeholder="記事の概要（省略可）。空の場合は本文の冒頭から自動生成されます"
				disabled={loading}
				height="150px"
				showPreview={false}
			/>
		</div>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow">
		<h3 class="mb-4 text-lg font-medium text-gray-900">設定</h3>

		<div class="space-y-6">
			<!-- Status -->
			<Select
				id="status"
				label="ステータス"
				bind:value={status}
				options={[
					{ value: 'draft', label: '下書き' },
					{ value: 'published', label: '公開' }
				]}
				disabled={loading}
			/>

			<!-- Categories -->
			{#if categories.length > 0}
				<div class="space-y-3">
					<fieldset>
						<legend class="block text-sm font-medium text-gray-700"> カテゴリ </legend>
						<div
							class="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3"
						>
							{#each categories as category}
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={categoryCheckboxes[category.id]}
										disabled={loading}
										class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
									/>
									<span class="ml-2 text-sm text-gray-700">
										{category.name}
										{#if category.description}
											<span class="text-gray-500"
												>- {category.description}</span
											>
										{/if}
									</span>
								</label>
							{/each}
						</div>
						{#if selectedCategories.length > 0}
							<p class="text-xs text-gray-500">
								{selectedCategories.length} カテゴリ選択中
							</p>
						{/if}
					</fieldset>
				</div>
			{:else}
				<div class="text-sm text-gray-500">
					カテゴリがありません。
					<a href="/admin/categories" class="text-blue-600 hover:text-blue-500">
						カテゴリを作成
					</a>
					してください。
				</div>
			{/if}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center justify-end space-x-4 rounded-lg bg-gray-50 px-6 py-3">
		<button
			type="button"
			on:click={handleCancel}
			disabled={loading}
			class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		>
			キャンセル
		</button>

		<button
			type="submit"
			disabled={loading}
			class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<svg
					class="-ml-1 mr-3 h-4 w-4 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				保存中...
			{:else}
				{isEditing ? '更新' : '作成'}
			{/if}
		</button>
	</div>
</form>
