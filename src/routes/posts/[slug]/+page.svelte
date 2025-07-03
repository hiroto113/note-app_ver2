<script lang="ts">
	import { onMount } from 'svelte';
	import MetaHead from '$lib/components/seo/MetaHead.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { page } from '$app/stores';
	import { generateBreadcrumbs, generateMetaFromContent } from '$lib/utils/seo';

	/** @type {import('./$types').PageData} */
	export let data;

	// メタタグ用の情報
	const baseUrl = 'https://mynotes.example.com'; // TODO: 環境変数から取得

	// 記事の内容からメタ情報を生成
	$: metaInfo = generateMetaFromContent(data.post.content, data.post.title);
	
	// SEO用の情報
	$: seoDescription = data.post.description || metaInfo.description;
	$: seoKeywords = metaInfo.keywords;

	// パンくずリスト
	$: breadcrumbs = generateBreadcrumbs($page.url.pathname, baseUrl);

	// 構造化データ用の記事情報
	$: articleData = {
		title: data.post.title,
		description: seoDescription,
		publishedTime: data.post.publishedAt,
		modifiedTime: data.post.updatedAt,
		author: 'サイト管理者',
		image: `${baseUrl}/api/og/${data.post.slug}` // 動的OGP画像
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	let contentElement: HTMLElement;

	onMount(async () => {
		// For now, render as plain HTML with basic markdown parsing
		if (contentElement) {
			// Simple markdown to HTML conversion
			let html = data.post.content
				.replace(/^# (.*$)/gim, '<h1>$1</h1>')
				.replace(/^## (.*$)/gim, '<h2>$1</h2>')
				.replace(/^### (.*$)/gim, '<h3>$1</h3>')
				.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
				.replace(/`([^`]*)`/g, '<code>$1</code>')
				.replace(/\n/g, '<br>');

			contentElement.innerHTML = html;
		}
	});
</script>

<svelte:head>
	<title>{data.post.title} - My Notes</title>
	<meta name="description" content={seoDescription} />
</svelte:head>

<!-- TODO: 一時的に無効化 - CI問題調査のため
<MetaHead 
	title={data.post.title}
	description={seoDescription}
	type="article"
	keywords={seoKeywords}
	image={articleData.image}
	publishedTime={data.post.publishedAt}
	modifiedTime={data.post.updatedAt}
	author={articleData.author}
/>

<StructuredData type="Article" data={articleData} />
<StructuredData type="BreadcrumbList" data={{ items: breadcrumbs }} />
-->

<article class="mx-auto max-w-4xl">
	<header class="mb-8">
		<h1 class="mb-4 text-4xl font-bold text-gray-900">
			{data.post.title}
		</h1>

		<div class="mb-4 flex items-center gap-4 text-sm text-gray-600">
			<time datetime={data.post.publishedAt}>
				{formatDate(data.post.publishedAt)}
			</time>

			<div class="flex gap-2">
				{#each data.post.categories as category}
					<span class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
						{category}
					</span>
				{/each}
			</div>
		</div>

		{#if data.post.description}
			<p class="text-lg italic text-gray-600">
				{data.post.description}
			</p>
		{/if}
	</header>

	<div class="prose prose-lg max-w-none" bind:this={contentElement}>
		<!-- Content will be dynamically rendered here -->
	</div>

	<footer class="mt-12 border-t border-gray-200 pt-8">
		<a
			href="/"
			class="inline-flex items-center text-blue-600 transition-colors hover:text-blue-800"
		>
			← 記事一覧に戻る
		</a>
	</footer>
</article>

<style>
	:global(.prose) {
		color: #374151;
		line-height: 1.7;
	}

	:global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
		color: #111827;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	:global(.prose h2) {
		font-size: 1.875rem;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	:global(.prose h3) {
		font-size: 1.5rem;
	}

	:global(.prose code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}

	:global(.prose pre) {
		background-color: #1f2937;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.prose pre code) {
		background-color: transparent;
		padding: 0;
		color: #e5e7eb;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: #6b7280;
	}

	:global(.prose a) {
		color: #2563eb;
		text-decoration: underline;
	}

	:global(.prose a:hover) {
		color: #1d4ed8;
	}

	:global(.heading-link) {
		text-decoration: none;
		color: inherit;
	}

	:global(.heading-link:hover) {
		color: #2563eb;
	}
</style>
