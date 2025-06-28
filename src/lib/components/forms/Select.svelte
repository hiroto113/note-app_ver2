<script lang="ts">
	export let id: string;
	export let label: string;
	export let value: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let error: string = '';
	export let options: Array<{ value: string; label: string }> = [];
	export let placeholder: string = '選択してください';

	let selectElement: HTMLSelectElement;

	export function focus() {
		selectElement?.focus();
	}
</script>

<div class="space-y-1">
	<label for={id} class="block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>

	<select
		bind:this={selectElement}
		{id}
		{required}
		{disabled}
		bind:value
		class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
		class:border-red-300={error}
		class:focus:border-red-500={error}
		class:focus:ring-red-500={error}
		on:change
		on:blur
		on:focus
	>
		{#if placeholder}
			<option value="" disabled selected={value === ''}>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>
