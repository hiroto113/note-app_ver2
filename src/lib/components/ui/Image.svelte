<script lang="ts">
	import { onMount } from 'svelte';

	// Props
	export let src: string;
	export let alt: string;
	export let width: number | undefined = undefined;
	export let height: number | undefined = undefined;
	export let sizes: string = '100vw';
	export let lazy: boolean = true;
	export let webp: boolean = true;
	export let className: string = '';

	// Generate WebP source URL (currently unused but available for future use)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function generateWebPSrc(originalSrc: string): string {
		if (originalSrc.startsWith('http') || originalSrc.includes('.webp')) {
			return originalSrc;
		}
		const extension = originalSrc.split('.').pop();
		return originalSrc.replace(`.${extension}`, '.webp');
	}

	// Generate srcset for responsive images
	function generateSrcSet(baseSrc: string, format: 'webp' | 'original' = 'original'): string {
		const extension = baseSrc.split('.').pop();
		const baseName = baseSrc.replace(`.${extension}`, '');

		if (format === 'webp') {
			return [
				`${baseName}-480w.webp 480w`,
				`${baseName}-800w.webp 800w`,
				`${baseName}-1200w.webp 1200w`,
				`${baseName}.webp 1920w`
			].join(', ');
		}

		return [
			`${baseName}-480w.${extension} 480w`,
			`${baseName}-800w.${extension} 800w`,
			`${baseName}-1200w.${extension} 1200w`,
			`${baseName}.${extension} 1920w`
		].join(', ');
	}

	// Intersection Observer for lazy loading
	let imageElement: HTMLDivElement;
	let isLoaded = false;
	let isInView = false;

	onMount(() => {
		if (!lazy || !imageElement) {
			isInView = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting) {
					isInView = true;
					observer.disconnect();
				}
			},
			{
				rootMargin: '50px 0px',
				threshold: 0.1
			}
		);

		observer.observe(imageElement);

		return () => {
			observer.disconnect();
		};
	});

	function handleLoad() {
		isLoaded = true;
	}

	function handleError() {
		console.warn(`Failed to load image: ${src}`);
	}

	$: shouldLoad = !lazy || isInView;
</script>

<div class="relative overflow-hidden {className}" bind:this={imageElement}>
	{#if shouldLoad}
		{#if webp}
			<picture>
				<source type="image/webp" srcset={generateSrcSet(src, 'webp')} {sizes} />
				<img
					{src}
					{alt}
					{width}
					{height}
					srcset={generateSrcSet(src, 'original')}
					{sizes}
					loading={lazy ? 'lazy' : 'eager'}
					decoding="async"
					class="h-auto w-full transition-opacity duration-300 {isLoaded
						? 'opacity-100'
						: 'opacity-0'}"
					on:load={handleLoad}
					on:error={handleError}
				/>
			</picture>
		{:else}
			<img
				{src}
				{alt}
				{width}
				{height}
				srcset={generateSrcSet(src, 'original')}
				{sizes}
				loading={lazy ? 'lazy' : 'eager'}
				decoding="async"
				class="h-auto w-full transition-opacity duration-300 {isLoaded
					? 'opacity-100'
					: 'opacity-0'}"
				on:load={handleLoad}
				on:error={handleError}
			/>
		{/if}
	{:else}
		<!-- Placeholder while loading -->
		<div
			class="flex items-center justify-center bg-gray-200 dark:bg-gray-700"
			style="aspect-ratio: {width && height ? `${width}/${height}` : '16/9'}"
		>
			<div class="text-gray-400 dark:text-gray-500">
				<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		</div>
	{/if}
</div>
