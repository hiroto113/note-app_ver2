<script>
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
</script>

<div class="flex min-h-screen flex-col">
	<Header />

	<main class="container mx-auto flex-grow px-4 py-8">
		<slot />
	</main>

	<Footer />
</div>
