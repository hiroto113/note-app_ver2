<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import LiveRegion from './LiveRegion.svelte';
	
	export let id: string;
	export let title: string;
	export let description: string = '';
	export let errors: Record<string, string> = {};
	export let isSubmitting = false;
	export let submitLabel = '送信';
	export let cancelLabel = 'キャンセル';
	export let showCancel = false;
	export let autocomplete: 'on' | 'off' = 'on';
	export let novalidate = false;
	
	const dispatch = createEventDispatcher<{
		submit: Event;
		cancel: Event;
	}>();
	
	let liveRegion: LiveRegion;
	let errorMessageId = `${id}-errors`;
	let descriptionId = `${id}-description`;
	
	// エラーメッセージを音声で通知
	$: if (Object.keys(errors).length > 0 && liveRegion) {
		const errorCount = Object.keys(errors).length;
		const errorText = `${errorCount}件のエラーがあります。${Object.values(errors).join('。')}`;
		liveRegion.announce(errorText);
	}
	
	function handleSubmit(event: Event) {
		dispatch('submit', event);
	}
	
	function handleCancel(event: Event) {
		dispatch('cancel', event);
	}
	
	// エラーメッセージの要約を生成
	$: errorSummary = Object.keys(errors).length > 0
		? `フォームに${Object.keys(errors).length}件のエラーがあります`
		: '';
</script>

<!-- Live Region for form announcements -->
<LiveRegion bind:this={liveRegion} />

<form
	{id}
	on:submit|preventDefault={handleSubmit}
	{autocomplete}
	{novalidate}
	aria-labelledby="{id}-title"
	aria-describedby="{description ? descriptionId : ''} {Object.keys(errors).length > 0 ? errorMessageId : ''}"
	class="accessible-form"
>
	<!-- Form Title -->
	<h2 id="{id}-title" class="form-title">
		{title}
	</h2>
	
	<!-- Form Description -->
	{#if description}
		<p id={descriptionId} class="form-description">
			{description}
		</p>
	{/if}
	
	<!-- Error Summary -->
	{#if Object.keys(errors).length > 0}
		<div
			id={errorMessageId}
			role="alert"
			aria-live="assertive"
			class="error-summary"
		>
			<h3 class="error-summary-title">
				<svg class="error-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				{errorSummary}
			</h3>
			<ul class="error-list">
				{#each Object.entries(errors) as [field, message]}
					<li>
						<a href="#{field}" class="error-link">
							{message}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	
	<!-- Form Content -->
	<div class="form-content">
		<slot />
	</div>
	
	<!-- Form Actions -->
	<div class="form-actions">
		<button
			type="submit"
			disabled={isSubmitting}
			class="submit-button"
			aria-describedby={isSubmitting ? `${id}-submitting` : ''}
		>
			{#if isSubmitting}
				<svg class="spinner" aria-hidden="true" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				送信中...
			{:else}
				{submitLabel}
			{/if}
		</button>
		
		{#if showCancel}
			<button
				type="button"
				on:click={handleCancel}
				disabled={isSubmitting}
				class="cancel-button"
			>
				{cancelLabel}
			</button>
		{/if}
		
		{#if isSubmitting}
			<span id="{id}-submitting" class="sr-only">
				フォームを送信しています。しばらくお待ちください。
			</span>
		{/if}
	</div>
</form>

<style>
	.accessible-form {
		max-width: 100%;
	}
	
	.form-title {
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(17 24 39);
	}
	
	:global(.dark) .form-title {
		color: rgb(243 244 246);
	}
	
	.form-description {
		margin-bottom: 1.5rem;
		color: rgb(107 114 128);
		line-height: 1.5;
	}
	
	:global(.dark) .form-description {
		color: rgb(156 163 175);
	}
	
	.error-summary {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: rgb(254 242 242);
		border: 1px solid rgb(252 165 165);
		border-radius: 0.375rem;
	}
	
	:global(.dark) .error-summary {
		background-color: rgb(127 29 29);
		border-color: rgb(185 28 28);
	}
	
	.error-summary-title {
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		color: rgb(153 27 27);
	}
	
	:global(.dark) .error-summary-title {
		color: rgb(252 165 165);
	}
	
	.error-icon {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: 0.5rem;
	}
	
	.error-list {
		margin: 0;
		padding-left: 1.25rem;
		list-style: disc;
	}
	
	.error-link {
		color: rgb(153 27 27);
		text-decoration: underline;
	}
	
	.error-link:hover {
		color: rgb(127 29 29);
	}
	
	.error-link:focus {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}
	
	:global(.dark) .error-link {
		color: rgb(252 165 165);
	}
	
	:global(.dark) .error-link:hover {
		color: rgb(254 202 202);
	}
	
	.form-content {
		margin-bottom: 1.5rem;
	}
	
	.form-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	
	.submit-button {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background-color: rgb(59 130 246);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	
	.submit-button:hover:not(:disabled) {
		background-color: rgb(37 99 235);
	}
	
	.submit-button:focus {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}
	
	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.cancel-button {
		padding: 0.5rem 1rem;
		background-color: transparent;
		color: rgb(107 114 128);
		border: 1px solid rgb(209 213 219);
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.cancel-button:hover:not(:disabled) {
		background-color: rgb(249 250 251);
		color: rgb(17 24 39);
	}
	
	.cancel-button:focus {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}
	
	.cancel-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	:global(.dark) .cancel-button {
		color: rgb(156 163 175);
		border-color: rgb(75 85 99);
	}
	
	:global(.dark) .cancel-button:hover:not(:disabled) {
		background-color: rgb(31 41 55);
		color: rgb(243 244 246);
	}
	
	.spinner {
		width: 1rem;
		height: 1rem;
		margin-right: 0.5rem;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>