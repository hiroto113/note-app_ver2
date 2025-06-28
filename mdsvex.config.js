import { createHighlighter } from 'shiki';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** @type {import('mdsvex').MdsvexOptions} */
export default {
	extensions: ['.md'],
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const highlighter = await createHighlighter({
				themes: ['github-dark'],
				langs: ['javascript', 'typescript', 'svelte', 'html', 'css', 'bash', 'json']
			});
			await highlighter.loadLanguage(
				'javascript',
				'typescript',
				'svelte',
				'html',
				'css',
				'bash',
				'json'
			);
			const html = highlighter.codeToHtml(code, {
				lang,
				theme: 'github-dark'
			});
			return `{@html \`${html}\`}`;
		}
	},
	rehypePlugins: [
		rehypeSlug,
		[
			rehypeAutolinkHeadings,
			{
				behavior: 'wrap',
				properties: {
					className: ['heading-link']
				}
			}
		]
	]
};
