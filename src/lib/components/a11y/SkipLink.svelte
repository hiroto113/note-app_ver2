<script lang="ts">
	export let href = '#main-content';
	export let text = 'メインコンテンツにスキップ';
</script>

<a
	{href}
	class="skip-link absolute left-2 top-2 z-50 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500"
>
	{text}
</a>

<style>
	.skip-link {
		transform: translateY(-100%);
	}

	.skip-link:focus {
		transform: translateY(0);
	}
</style>
