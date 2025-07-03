<script lang="ts">
	import { page } from '$app/stores';

	export let title: string;
	export let description: string;
	export let keywords: string = '';
	export let type: 'website' | 'article' = 'website';
	export let image: string = '';
	export let publishedTime: string = '';
	export let modifiedTime: string = '';
	export let author: string = '';

	// サイト名とベースURL
	const siteName = 'My Notes';
	const baseUrl = 'https://mynotes.example.com'; // TODO: 環境変数から取得

	// 完全なタイトルを生成
	$: fullTitle = title === siteName ? title : `${title} | ${siteName}`;

	// Canonical URLを生成
	$: canonicalUrl = `${baseUrl}${$page.url.pathname}`;

	// デフォルトのOGP画像
	const defaultImage = `${baseUrl}/og-default.png`;
	$: ogImage = image || defaultImage;
</script>

<svelte:head>
	<!-- 基本メタタグ -->
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="ja_JP" />

	<!-- Article specific -->
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
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>