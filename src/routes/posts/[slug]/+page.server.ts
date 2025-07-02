import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { publicApi } from '$lib/api';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// 公開用APIから記事詳細を取得
		const data = await publicApi.getPost(params.slug);

		return {
			post: data.post
		};
	} catch (err) {
		console.error(`Error loading post ${params.slug}:`, err);

		// APIエラーの場合は適切なステータスコードで応答
		if (err instanceof Error && 'status' in err) {
			throw error(err.status as number, err.message);
		}

		// その他のエラーは404として処理（記事が見つからない）
		throw error(404, 'Post not found');
	}
};
