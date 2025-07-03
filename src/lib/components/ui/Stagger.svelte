<script lang="ts">
	import { onMount } from 'svelte';
	import { fadeInUp, shouldAnimate } from '$lib/utils/animations';
	import { inView } from '$lib/utils/intersection';

	// プロパティ
	export let duration = 300;
	export let delay = 0;
	export let distance = 20;
	export let threshold = 0.1;
	export let rootMargin = '0px 0px -50px 0px';

	// 内部状態
	let visible = false;
	let containerElement: HTMLElement;

	onMount(() => {
		if (!shouldAnimate()) {
			visible = true;
			return;
		}

		if (containerElement) {
			return inView(containerElement, {
				threshold,
				rootMargin,
				triggerOnce: true,
				onIntersect: () => {
					visible = true;
				}
			});
		}
	});
</script>

<div bind:this={containerElement}>
	{#if visible}
		<div in:fadeInUp={{ duration, delay, distance }}>
			<slot />
		</div>
	{:else}
		<!-- プレースホルダーで高さを維持 -->
		<div class="invisible">
			<slot />
		</div>
	{/if}
</div>
