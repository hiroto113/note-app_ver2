<script lang="ts">
	import { announcements } from '$lib/stores/accessibility';

	// aria-live領域でスクリーンリーダーに動的コンテンツを通知
</script>

<div class="sr-only" aria-live="polite" aria-atomic="true">
	{#each $announcements as announcement}
		<div>{announcement}</div>
	{/each}
</div>

<style>
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
