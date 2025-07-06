<script lang="ts">
	import { page } from '$app/stores';
	import { generateOGPImageUrl, optimizeOGPTitle, optimizeOGPDescription } from '$lib/utils/ogp';

	// Props
	export let title: string;
	export let description: string;
	export let type: 'website' | 'article' = 'website';
	export let image: string | undefined = undefined;
	export let siteName: string = 'My Notes';
	export let locale: string = 'ja_JP';
	export let publishedTime: string | undefined = undefined;
	export let modifiedTime: string | undefined = undefined;
	export let author: string | undefined = undefined;
	export let section: string | undefined = undefined;
	export let slug: string | undefined = undefined;

	// 現在のURLを取得（SSR対応）
	$: currentUrl = $page?.url?.href || '';
	$: baseUrl = $page?.url?.origin || '';

	// OGPタイトルと説明文を最適化
	$: optimizedTitle = optimizeOGPTitle(title, siteName);
	$: optimizedDescription = optimizeOGPDescription(description);

	// 使用する画像URL（カスタム画像がない場合は動的生成）
	$: ogImage =
		image ||
		generateOGPImageUrl(baseUrl, {
			title,
			category: section,
			type: type === 'article' ? 'article' : 'default',
			slug
		});

	// 絶対URLに変換
	$: absoluteImageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
</script>

<svelte:head>
	<!-- Basic meta tags -->
	<title>{optimizedTitle}</title>
	<meta name="description" content={optimizedDescription} />
	
	<!-- Basic OGP Tags -->
	<meta property="og:title" content={optimizedTitle} />
	<meta property="og:description" content={optimizedDescription} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={currentUrl} />
	<meta property="og:image" content={absoluteImageUrl} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content={locale} />

	<!-- Article specific OGP tags -->
	{#if type === 'article'}
		{#if publishedTime}
			<meta property="article:published_time" content={publishedTime} />
		{/if}
		{#if modifiedTime}
			<meta property="article:modified_time" content={modifiedTime} />
		{/if}
		{#if author}
			<meta property="article:author" content={author} />
		{/if}
		{#if section}
			<meta property="article:section" content={section} />
		{/if}
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={optimizedTitle} />
	<meta name="twitter:description" content={optimizedDescription} />
	<meta name="twitter:image" content={absoluteImageUrl} />

	<!-- Additional image properties -->
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
</svelte:head>
