<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let message: string;
	export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
	export let duration = 5000; // 5秒で自動消去
	export let closeable = true;

	const dispatch = createEventDispatcher();

	let visible = true;

	onMount(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				visible = false;
				setTimeout(() => dispatch('close'), 300); // アニメーション後に削除
			}, duration);

			return () => clearTimeout(timer);
		}
	});

	function close() {
		visible = false;
		setTimeout(() => dispatch('close'), 300);
	}

	// タイプ別のスタイル
	$: bgColor = {
		success: 'bg-green-50 border-green-200',
		error: 'bg-red-50 border-red-200',
		warning: 'bg-yellow-50 border-yellow-200',
		info: 'bg-blue-50 border-blue-200'
	}[type];

	$: textColor = {
		success: 'text-green-800',
		error: 'text-red-800',
		warning: 'text-yellow-800',
		info: 'text-blue-800'
	}[type];

	$: iconColor = {
		success: 'text-green-400',
		error: 'text-red-400',
		warning: 'text-yellow-400',
		info: 'text-blue-400'
	}[type];
</script>

{#if visible}
	<div
		class="toast fixed right-4 top-4 z-50 w-full max-w-sm transform transition-all duration-300 {visible
			? 'translate-x-0 opacity-100'
			: 'translate-x-full opacity-0'}"
		role="alert"
	>
		<div class="rounded-lg border p-4 shadow-lg {bgColor}">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					{#if type === 'success'}
						<svg class="h-5 w-5 {iconColor}" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else if type === 'error'}
						<svg class="h-5 w-5 {iconColor}" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else if type === 'warning'}
						<svg class="h-5 w-5 {iconColor}" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<svg class="h-5 w-5 {iconColor}" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</div>
				<div class="ml-3 flex-1">
					<p class="text-sm font-medium {textColor}">
						{message}
					</p>
				</div>
				{#if closeable}
					<div class="ml-4 flex-shrink-0">
						<button
							type="button"
							class="inline-flex rounded-md {bgColor} {textColor} hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							on:click={close}
						>
							<span class="sr-only">Close</span>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.toast {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
