import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types';

export const load: PageServerLoad = async () => {
	try {
		const postsDirectory = join(process.cwd(), 'src/posts');
		const files = await readdir(postsDirectory);
		const markdownFiles = files.filter((file: string) => file.endsWith('.md'));

		const posts: Post[] = await Promise.all(
			markdownFiles.map(async (file: string) => {
				const filePath = join(postsDirectory, file);
				const fileContent = await readFile(filePath, 'utf-8');
				const { data } = matter(fileContent);

				return {
					slug: file.replace('.md', ''),
					title: data.title || 'Untitled',
					publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
					description: data.description || '',
					categories: data.categories || []
				};
			})
		);

		// Sort by publishedAt in descending order (newest first)
		posts.sort(
			(a: Post, b: Post) =>
				new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
		);

		return {
			posts
		};
	} catch (error) {
		console.error('Error loading posts:', error);
		return {
			posts: []
		};
	}
};
