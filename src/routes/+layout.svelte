<script>
	import '../app.css';
	import Navigation from '$lib/components/layout/Navigation.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
</script>

<div class="flex min-h-screen flex-col">
	<Navigation />

	<main class="container mx-auto flex-grow px-4 py-6 md:py-8">
		<slot />
	</main>

	<Footer />
</div>

<ToastContainer />
