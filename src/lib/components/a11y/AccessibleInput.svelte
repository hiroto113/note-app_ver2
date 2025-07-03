<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let id: string;
	export let name: string = id;
	export let label: string;
	export let type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number' = 'text';
	export let value: string = '';
	export let placeholder: string = '';
	export let required = false;
	export let disabled = false;
	export let readonly = false;
	// autocomplete属性は必要に応じて親コンポーネントで直接指定
	export let pattern: string = '';
	export let minlength: number | undefined = undefined;
	export let maxlength: number | undefined = undefined;
	export let min: number | string | undefined = undefined;
	export let max: number | string | undefined = undefined;
	export let step: number | string | undefined = undefined;
	export let error: string = '';
	export let helpText: string = '';
	export let showLabel = true;
	export let labelClass = '';
	export let inputClass = '';
	export let hideRequired = false;

	const dispatch = createEventDispatcher<{
		input: Event;
		change: Event;
		focus: Event;
		blur: Event;
		keydown: KeyboardEvent;
		keyup: KeyboardEvent;
	}>();

	let inputElement: HTMLInputElement;
	let labelId = `${id}-label`;
	let errorId = `${id}-error`;
	let helpId = `${id}-help`;

	// aria-describedby の構築
	$: describedBy =
		[helpText ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;

	// 入力フィールドのクラス
	$: inputClassNames = [
		'accessible-input',
		error ? 'error' : '',
		disabled ? 'disabled' : '',
		inputClass
	]
		.filter(Boolean)
		.join(' ');

	// ラベルのクラス
	$: labelClassNames = [
		'accessible-label',
		required && !hideRequired ? 'required' : '',
		labelClass
	]
		.filter(Boolean)
		.join(' ');

	// 外部からフォーカスを設定できるようにする
	export function focus() {
		inputElement?.focus();
	}

	export function blur() {
		inputElement?.blur();
	}

	export function select() {
		inputElement?.select();
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('input', event);
	}

	function handleChange(event: Event) {
		dispatch('change', event);
	}

	function handleFocus(event: Event) {
		dispatch('focus', event);
	}

	function handleBlur(event: Event) {
		dispatch('blur', event);
	}

	function handleKeydown(event: KeyboardEvent) {
		dispatch('keydown', event);
	}

	function handleKeyup(event: KeyboardEvent) {
		dispatch('keyup', event);
	}
</script>

<div class="input-container">
	<!-- Label -->
	{#if showLabel}
		<label id={labelId} for={id} class={labelClassNames}>
			{label}
			{#if required && !hideRequired}
				<span class="required-indicator" aria-label="必須">*</span>
			{/if}
		</label>
	{/if}

	<!-- Input Field -->
	<input
		bind:this={inputElement}
		{id}
		{name}
		{type}
		{value}
		{placeholder}
		{required}
		{disabled}
		{readonly}
		{pattern}
		{minlength}
		{maxlength}
		{min}
		{max}
		{step}
		class={inputClassNames}
		aria-labelledby={showLabel ? labelId : undefined}
		aria-label={showLabel ? undefined : label}
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : 'false'}
		aria-required={required ? 'true' : 'false'}
		on:input={handleInput}
		on:change={handleChange}
		on:focus={handleFocus}
		on:blur={handleBlur}
		on:keydown={handleKeydown}
		on:keyup={handleKeyup}
	/>

	<!-- Help Text -->
	{#if helpText}
		<div id={helpId} class="help-text">
			{helpText}
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div id={errorId} role="alert" aria-live="polite" class="error-message">
			<svg class="error-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
			{error}
		</div>
	{/if}
</div>

<style>
	.input-container {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.accessible-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(17 24 39);
		line-height: 1.5;
	}

	:global(.dark) .accessible-label {
		color: rgb(243 244 246);
	}

	.accessible-label.required {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.required-indicator {
		color: rgb(239 68 68);
		font-weight: 600;
	}

	.accessible-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgb(209 213 219);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: rgb(17 24 39);
		background-color: white;
		transition: all 0.15s ease;
	}

	.accessible-input:focus {
		outline: none;
		border-color: rgb(59 130 246);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.accessible-input:hover:not(:disabled) {
		border-color: rgb(156 163 175);
	}

	.accessible-input.error {
		border-color: rgb(239 68 68);
	}

	.accessible-input.error:focus {
		border-color: rgb(239 68 68);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.accessible-input.disabled {
		background-color: rgb(249 250 251);
		color: rgb(107 114 128);
		cursor: not-allowed;
	}

	.accessible-input::placeholder {
		color: rgb(156 163 175);
	}

	/* Dark mode styles */
	:global(.dark) .accessible-input {
		background-color: rgb(31 41 55);
		border-color: rgb(75 85 99);
		color: rgb(243 244 246);
	}

	:global(.dark) .accessible-input:focus {
		border-color: rgb(59 130 246);
	}

	:global(.dark) .accessible-input:hover:not(:disabled) {
		border-color: rgb(107 114 128);
	}

	:global(.dark) .accessible-input.disabled {
		background-color: rgb(17 24 39);
		color: rgb(107 114 128);
	}

	:global(.dark) .accessible-input::placeholder {
		color: rgb(107 114 128);
	}

	.help-text {
		font-size: 0.75rem;
		color: rgb(107 114 128);
		line-height: 1.5;
	}

	:global(.dark) .help-text {
		color: rgb(156 163 175);
	}

	.error-message {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: rgb(239 68 68);
		line-height: 1.5;
	}

	.error-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.accessible-input {
			border-width: 2px;
		}

		.accessible-input:focus {
			outline: 2px solid;
			outline-offset: 2px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.accessible-input {
			transition: none;
		}
	}

	/* Touch-friendly sizing for mobile */
	@media (pointer: coarse) {
		.accessible-input {
			min-height: 44px;
			padding: 0.75rem;
		}
	}
</style>
