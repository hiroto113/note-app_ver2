<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView } from '@codemirror/view';
	import { EditorState, Compartment } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { markdown } from '@codemirror/lang-markdown';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { search } from '@codemirror/search';

	export let value: string = '';
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let theme: 'light' | 'dark' = 'light';
	export let error: string = '';
	export let label: string = '';
	export let required: boolean = false;
	export let height: string = '300px';

	let editorContainer: HTMLDivElement;
	let editorView: EditorView | null = null;
	let readOnlyCompartment = new Compartment();

	// Create editor state
	function createEditorState() {
		const extensions = [
			basicSetup,
			markdown(),
			search(),
			EditorView.updateListener.of((update) => {
				if (update.docChanged && !disabled) {
					value = update.state.doc.toString();
				}
			}),
			EditorView.theme({
				'&': {
					height: height,
					fontSize: '14px'
				},
				'.cm-editor': {
					height: '100%'
				},
				'.cm-scroller': {
					fontFamily:
						'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Menlo", monospace'
				},
				'.cm-focused': {
					outline: 'none'
				},
				'.cm-editor.cm-focused': {
					outline: 'none'
				}
			}),
			readOnlyCompartment.of(EditorState.readOnly.of(disabled))
		];

		if (theme === 'dark') {
			extensions.push(oneDark);
		}

		return EditorState.create({
			doc: value,
			extensions: extensions
		});
	}

	// Initialize editor
	function initializeEditor() {
		if (!editorContainer) return;

		const state = createEditorState();
		editorView = new EditorView({
			state,
			parent: editorContainer
		});
	}

	// Update editor content when value changes externally
	$: if (editorView && value !== editorView.state.doc.toString()) {
		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: value
			}
		});
	}

	// Update editor theme
	$: if (editorView) {
		const state = createEditorState();
		editorView.setState(state);
	}

	// Update disabled state
	$: if (editorView) {
		editorView.dispatch({
			effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled))
		});
	}

	onMount(() => {
		initializeEditor();
	});

	onDestroy(() => {
		if (editorView) {
			editorView.destroy();
		}
	});

	export function focus() {
		if (editorView) {
			editorView.focus();
		}
	}

	export function getEditorView() {
		return editorView;
	}
</script>

<div class="space-y-1">
	{#if label}
		<div class="mb-1 block text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</div>
	{/if}

	{#if placeholder && !value}
		<div
			class="pointer-events-none absolute inset-0 flex items-start pl-3 pt-3 text-sm text-gray-400"
		>
			{placeholder}
		</div>
	{/if}

	<div class="relative">
		<div
			bind:this={editorContainer}
			class="overflow-hidden rounded-md border transition-colors duration-200"
			class:border-gray-300={!error}
			class:border-red-300={error}
			class:bg-gray-50={disabled}
			class:cursor-not-allowed={disabled}
		></div>
	</div>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>

<style>
	:global(.cm-editor) {
		border-radius: 0;
	}

	:global(.cm-scroller) {
		padding: 12px;
	}

	:global(.cm-line) {
		line-height: 1.6;
	}

	:global(.cm-selectionBackground) {
		background-color: #3b82f6 !important;
		opacity: 0.3;
	}

	:global(.cm-focused .cm-selectionBackground) {
		background-color: #3b82f6 !important;
		opacity: 0.3;
	}

	:global(.cm-searchMatch) {
		background-color: #fbbf24;
		border-radius: 2px;
	}

	:global(.cm-searchMatch.cm-searchMatch-selected) {
		background-color: #f59e0b;
	}
</style>
