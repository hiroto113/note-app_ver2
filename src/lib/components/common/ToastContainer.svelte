<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toast';
	import Toast from './Toast.svelte';
</script>

{#each $toasts as toast (toast.id)}
	<Toast
		message={toast.message}
		type={toast.type}
		duration={toast.duration}
		on:close={() => removeToast(toast.id)}
	/>
{/each}
