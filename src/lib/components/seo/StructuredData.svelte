<script lang="ts">
	import { page } from '$app/stores';

	export let type: 'WebSite' | 'Article' | 'BreadcrumbList';
	export let data: Record<string, any> = {};

	const siteName = 'My Notes';
	const baseUrl = 'https://mynotes.example.com'; // TODO: 環境変数から取得

	// WebSiteスキーマ
	function getWebSiteSchema() {
		return {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: siteName,
			url: baseUrl,
			description: '個人的な学習記録とメモ',
			publisher: {
				'@type': 'Person',
				name: 'サイト管理者'
			},
			potentialAction: {
				'@type': 'SearchAction',
				target: {
					'@type': 'EntryPoint',
					urlTemplate: `${baseUrl}/search?q={search_term_string}`
				},
				'query-input': 'required name=search_term_string'
			}
		};
	}

	// Articleスキーマ
	function getArticleSchemaForPath(currentPath: string) {
		return {
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: data.title,
			description: data.description,
			url: `${baseUrl}${currentPath}`,
			datePublished: data.publishedTime,
			dateModified: data.modifiedTime || data.publishedTime,
			author: {
				'@type': 'Person',
				name: data.author || 'サイト管理者'
			},
			publisher: {
				'@type': 'Organization',
				name: siteName,
				logo: {
					'@type': 'ImageObject',
					url: `${baseUrl}/logo.png`
				}
			},
			image: data.image || `${baseUrl}/og-default.png`,
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': `${baseUrl}${currentPath}`
			}
		};
	}

	// BreadcrumbListスキーマ
	function getBreadcrumbListSchema() {
		const items = data.items || [];
		return {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: items.map((item: any, index: number) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				item: item.url
			}))
		};
	}

	// 現在のパスを取得
	$: currentPath = $page?.url?.pathname || '';

	// スキーマを選択
	$: schema = (() => {
		switch (type) {
			case 'WebSite':
				return getWebSiteSchema();
			case 'Article':
				return getArticleSchemaForPath(currentPath);
			case 'BreadcrumbList':
				return getBreadcrumbListSchema();
			default:
				return null;
		}
	})();

	$: schemaJson = schema ? JSON.stringify(schema) : '';
</script>

<svelte:head>
	{#if schemaJson}
		{@html `<script type="application/ld+json">${schemaJson}</script>`}
	{/if}
</svelte:head>