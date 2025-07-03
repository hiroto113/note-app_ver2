<script>
	import '../app.css';
	import Navigation from '$lib/components/layout/Navigation.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import ThemeProvider from '$lib/components/ui/ThemeProvider.svelte';
</script>

<ThemeProvider>
	<div class="flex min-h-screen flex-col bg-white dark:bg-gray-900">
		<Navigation />

		<main class="container mx-auto flex-grow px-4 py-6 md:py-8">
			<slot />
		</main>

		<Footer />
	</div>

	<ToastContainer />
</ThemeProvider>
