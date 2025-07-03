<script lang="ts">
	import { onMount } from 'svelte';
	import { inView } from '$lib/utils/intersection';
	import { fadeInUp, shouldAnimate } from '$lib/utils/animations';

	// プロパティ
	export let duration = 300;
	export let delay = 0;
	export let distance = 20;
	export let threshold = 0.1;
	export let rootMargin = '0px 0px -50px 0px';
	export let triggerOnce = true;

	// 内部状態
	let visible = false;
	let element: HTMLElement;

	onMount(() => {
		if (!shouldAnimate()) {
			visible = true;
			return;
		}

		if (element) {
			return inView(element, {
				threshold,
				rootMargin,
				triggerOnce,
				onIntersect: () => {
					visible = true;
				}
			});
		}
	});
</script>

<div bind:this={element}>
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
