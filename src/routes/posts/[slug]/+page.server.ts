import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PostDetail } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const postsDirectory = join(process.cwd(), 'src/posts');
		const filePath = join(postsDirectory, `${params.slug}.md`);

		const fileContent = await readFile(filePath, 'utf-8');
		const { data, content } = matter(fileContent);

		const post: PostDetail = {
			slug: params.slug,
			title: data.title || 'Untitled',
			publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
			description: data.description || '',
			categories: data.categories || [],
			content
		};

		return {
			post
		};
	} catch (err) {
		console.error(`Error loading post ${params.slug}:`, err);
		throw error(404, 'Post not found');
	}
};
