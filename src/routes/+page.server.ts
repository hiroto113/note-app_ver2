import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { publicApi } from '$lib/api';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// クエリパラメータを取得
		const page = parseInt(url.searchParams.get('page') || '1');
		const category = url.searchParams.get('category') || undefined;
		const limit = 10; // 公開側では固定

		// 公開用APIから記事一覧を取得
		const data = await publicApi.getPosts({
			page,
			limit,
			category
		});

		// カテゴリ一覧も取得
		const categoriesData = await publicApi.getCategories();

		return {
			posts: data.posts,
			pagination: data.pagination,
			categories: categoriesData.categories,
			currentCategory: category
		};
	} catch (err) {
		console.error('Error loading posts:', err);
		console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');

		// APIエラーの場合は適切なステータスコードで応答
		if (err instanceof Error && 'status' in err) {
			throw error(err.status as number, err.message);
		}

		// その他のエラーは500として処理
		throw error(500, 'Failed to load posts');
	}
};
