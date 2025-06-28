<script lang="ts">
	export let content: string = '';
	export let height: string = '300px';

	let previewContainer: HTMLDivElement;
	let compiledHtml: string = '';

	// Compile markdown to HTML using simple parser
	function compileMarkdown(markdown: string) {
		if (!markdown.trim()) {
			compiledHtml =
				'<p class="text-gray-500 italic">プレビューするコンテンツがありません</p>';
			return;
		}

		// Use simple markdown-like rendering
		compiledHtml = simpleMarkdownToHtml(markdown);
	}

	// Simple markdown to HTML converter as fallback
	function simpleMarkdownToHtml(markdown: string): string {
		let html = markdown;

		// Headers
		html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>');
		html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-4">$1</h2>');
		html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

		// Bold and italic
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
		html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

		// Code blocks
		html = html.replace(
			/```([\s\S]*?)```/g,
			'<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto my-4"><code class="text-sm">$1</code></pre>'
		);

		// Inline code
		html = html.replace(
			/`(.*?)`/g,
			'<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
		);

		// Links
		html = html.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
		);

		// Lists
		html = html.replace(/^\* (.*$)/gm, '<li class="ml-4">$1</li>');
		html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-4">$1</ul>');

		// Paragraphs
		html = html.replace(/\n\n/g, '</p><p class="mb-4">');
		html = '<p class="mb-4">' + html + '</p>';

		// Line breaks
		html = html.replace(/\n/g, '<br>');

		return html;
	}

	// Update preview when content changes
	$: {
		compileMarkdown(content);
	}
</script>

<div class="space-y-1">
	<div
		bind:this={previewContainer}
		class="prose prose-sm max-w-none overflow-y-auto rounded-md border border-gray-300 bg-white p-4"
		style="height: {height};"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html compiledHtml}
	</div>
</div>

<style>
	:global(.prose h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		color: #111827;
	}

	:global(.prose h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		color: #111827;
	}

	:global(.prose h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #111827;
	}

	:global(.prose p) {
		margin-bottom: 1rem;
		color: #374151;
		line-height: 1.5;
	}

	:global(.prose ul) {
		list-style-type: disc;
		margin-left: 1.5rem;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	:global(.prose ol) {
		list-style-type: decimal;
		margin-left: 1.5rem;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	:global(.prose li) {
		color: #374151;
		margin-bottom: 0.25rem;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #d1d5db;
		padding-left: 1rem;
		font-style: italic;
		margin-top: 1rem;
		margin-bottom: 1rem;
		color: #6b7280;
	}

	:global(.prose code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: ui-monospace, SFMono-Regular, Monaco, Consolas, monospace;
		color: #1f2937;
	}

	:global(.prose pre) {
		background-color: #f3f4f6;
		padding: 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	:global(.prose pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.prose a) {
		color: #2563eb;
		text-decoration: underline;
	}

	:global(.prose a:hover) {
		color: #1d4ed8;
	}

	:global(.prose strong) {
		font-weight: 600;
		color: #111827;
	}

	:global(.prose em) {
		font-style: italic;
	}

	:global(.prose table) {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	:global(.prose th) {
		border: 1px solid #d1d5db;
		padding: 0.75rem;
		background-color: #f9fafb;
		font-weight: 600;
		text-align: left;
	}

	:global(.prose td) {
		border: 1px solid #d1d5db;
		padding: 0.75rem;
	}
</style>
