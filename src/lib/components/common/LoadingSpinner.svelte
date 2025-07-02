<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let color = 'indigo';
	export let message = '';

	$: sizeClass = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	}[size];
</script>

<div class="flex flex-col items-center justify-center space-y-2">
	<div
		class="animate-spin rounded-full border-2 border-gray-300 border-t-{color}-600 {sizeClass}"
		class:border-t-indigo-600={color === 'indigo'}
		class:border-t-blue-600={color === 'blue'}
		class:border-t-green-600={color === 'green'}
		class:border-t-red-600={color === 'red'}
		class:border-t-yellow-600={color === 'yellow'}
	></div>
	{#if message}
		<p class="text-sm text-gray-600">{message}</p>
	{/if}
</div>
