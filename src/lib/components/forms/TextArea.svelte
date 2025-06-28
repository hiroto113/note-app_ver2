<script lang="ts">
	export let id: string;
	export let label: string;
	export let value: string = '';
	export let placeholder: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let error: string = '';
	export let rows: number = 3;
	export let resize: boolean = true;

	let textareaElement: HTMLTextAreaElement;

	export function focus() {
		textareaElement?.focus();
	}
</script>

<div class="space-y-1">
	<label for={id} class="block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>

	<textarea
		bind:this={textareaElement}
		{id}
		{placeholder}
		{required}
		{disabled}
		{rows}
		bind:value
		class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
		class:border-red-300={error}
		class:focus:border-red-500={error}
		class:focus:ring-red-500={error}
		class:resize-none={!resize}
		on:input
		on:blur
		on:change
		on:focus
	></textarea>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>
