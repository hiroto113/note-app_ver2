<script lang="ts">
	import { onMount } from 'svelte';
	import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let componentLoader: () => Promise<{ default: any }>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let fallback: any = LoadingSpinner;
	export let errorMessage = 'コンポーネントの読み込みに失敗しました';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let component: any = null;
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			const module = await componentLoader();
			component = module.default || module;
			loading = false;
		} catch (err) {
			console.error('Component loading failed:', err);
			error = errorMessage;
			loading = false;
		}
	});
</script>

{#if loading}
	<svelte:component this={fallback} />
{:else if error}
	<div class="flex items-center justify-center p-8">
		<div class="text-center">
			<div class="mb-2 text-red-500">
				<svg
					class="mx-auto h-12 w-12"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
			</div>
			<p class="text-gray-600 dark:text-gray-400">{error}</p>
			<button
				on:click={() => window.location.reload()}
				class="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
			>
				再読み込み
			</button>
		</div>
	</div>
{:else if component}
	<svelte:component this={component} {$$props} {$$restProps}>
		<slot />
	</svelte:component>
{/if}
