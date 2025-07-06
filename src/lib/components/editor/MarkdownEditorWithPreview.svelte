<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import MarkdownEditor from './MarkdownEditor.svelte';
	import MarkdownPreview from './MarkdownPreview.svelte';

	export let value: string = '';
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let error: string = '';
	export let label: string = '';
	export let required: boolean = false;
	export let height: string = '400px';
	export let showPreview: boolean = true;
	export let testId: string = '';

	const dispatch = createEventDispatcher<{
		input: string;
		blur: string;
		focus: string;
	}>();

	let viewMode: 'editor' | 'preview' | 'split' = 'split';
	let editorRef: MarkdownEditor;

	function handleInput() {
		dispatch('input', value);
	}

	function handleFocus() {
		dispatch('focus', value);
	}

	function handleBlur() {
		dispatch('blur', value);
	}

	export function focus() {
		if (editorRef) {
			editorRef.focus();
		}
	}

	// Auto-resize based on content
	function getEditorHeight(): string {
		if (viewMode === 'split') {
			return height;
		}
		return height;
	}
</script>

<div class="space-y-3">
	{#if label}
		<div class="flex items-center justify-between">
			<div class="block text-sm font-medium text-gray-700">
				{label}
				{#if required}
					<span class="text-red-500">*</span>
				{/if}
			</div>

			{#if showPreview}
				<div class="flex items-center space-x-1 rounded-md bg-gray-100 p-1">
					<button
						type="button"
						on:click={() => (viewMode = 'editor')}
						class="rounded px-3 py-1 text-xs font-medium transition-colors duration-200"
						class:bg-white={viewMode === 'editor'}
						class:text-blue-600={viewMode === 'editor'}
						class:shadow-sm={viewMode === 'editor'}
						class:text-gray-600={viewMode !== 'editor'}
						class:hover:text-gray-800={viewMode !== 'editor'}
					>
						編集
					</button>
					<button
						type="button"
						on:click={() => (viewMode = 'split')}
						class="rounded px-3 py-1 text-xs font-medium transition-colors duration-200"
						class:bg-white={viewMode === 'split'}
						class:text-blue-600={viewMode === 'split'}
						class:shadow-sm={viewMode === 'split'}
						class:text-gray-600={viewMode !== 'split'}
						class:hover:text-gray-800={viewMode !== 'split'}
					>
						分割
					</button>
					<button
						type="button"
						on:click={() => (viewMode = 'preview')}
						class="rounded px-3 py-1 text-xs font-medium transition-colors duration-200"
						class:bg-white={viewMode === 'preview'}
						class:text-blue-600={viewMode === 'preview'}
						class:shadow-sm={viewMode === 'preview'}
						class:text-gray-600={viewMode !== 'preview'}
						class:hover:text-gray-800={viewMode !== 'preview'}
					>
						プレビュー
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<div
		class="overflow-hidden rounded-md border border-gray-300"
		class:border-red-300={error}
		data-testid={testId}
	>
		{#if viewMode === 'editor'}
			<MarkdownEditor
				bind:this={editorRef}
				bind:value
				{placeholder}
				{disabled}
				height={getEditorHeight()}
				on:input={handleInput}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>
		{:else if viewMode === 'preview'}
			<MarkdownPreview content={value} height={getEditorHeight()} />
		{:else if viewMode === 'split'}
			<div class="grid grid-cols-2 divide-x divide-gray-300">
				<div>
					<div class="border-b border-gray-300 bg-gray-50 px-3 py-2">
						<span class="text-xs font-medium text-gray-700">編集</span>
					</div>
					<MarkdownEditor
						bind:this={editorRef}
						bind:value
						{placeholder}
						{disabled}
						height={getEditorHeight()}
						on:input={handleInput}
						on:focus={handleFocus}
						on:blur={handleBlur}
					/>
				</div>
				<div>
					<div class="border-b border-gray-300 bg-gray-50 px-3 py-2">
						<span class="text-xs font-medium text-gray-700">プレビュー</span>
					</div>
					<MarkdownPreview content={value} height={getEditorHeight()} />
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	<!-- Helpful shortcuts info -->
	{#if viewMode !== 'preview'}
		<div class="space-y-1 text-xs text-gray-500">
			<p>
				Markdownをサポートしています。ショートカット: <code class="rounded bg-gray-100 px-1"
					>Ctrl+F</code
				> 検索
			</p>
		</div>
	{/if}
</div>
