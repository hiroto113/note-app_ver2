// API client utilities

export interface ApiError {
	message: string;
	status: number;
	details?: unknown;
}

export class ApiClientError extends Error {
	status: number;
	details?: unknown;

	constructor(message: string, status: number, details?: unknown) {
		super(message);
		this.name = 'ApiClientError';
		this.status = status;
		this.details = details;
	}
}

/**
 * APIクライアントの基本設定
 */
export interface ApiClientOptions {
	baseUrl?: string;
	headers?: Record<string, string>;
}

/**
 * 共通のAPI呼び出し関数
 */
export async function apiCall<T = unknown>(
	endpoint: string,
	options: RequestInit & { baseUrl?: string } = {}
): Promise<T> {
	const { baseUrl = '', ...fetchOptions } = options;

	// サーバーサイドでは絶対URLが必要
	const isServer = typeof window === 'undefined';
	const fullUrl =
		isServer && !baseUrl && !endpoint.startsWith('http')
			? `http://localhost:5173${endpoint}`
			: `${baseUrl}${endpoint}`;

	try {
		const response = await fetch(fullUrl, {
			headers: {
				'Content-Type': 'application/json',
				...fetchOptions.headers
			},
			...fetchOptions
		});

		if (!response.ok) {
			let errorMessage = `HTTP ${response.status}`;
			let errorDetails;

			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || errorMessage;
				errorDetails = errorData.details || errorData;
			} catch {
				// JSONパースに失敗した場合はデフォルトメッセージを使用
			}

			throw new ApiClientError(errorMessage, response.status, errorDetails);
		}

		// レスポンスが空の場合（204 No Content等）
		if (response.status === 204 || response.headers.get('content-length') === '0') {
			return {} as T;
		}

		return await response.json();
	} catch (error) {
		if (error instanceof ApiClientError) {
			throw error;
		}

		// ネットワークエラーやその他のエラー
		throw new ApiClientError(
			error instanceof Error ? error.message : 'Network error',
			0,
			error
		);
	}
}

/**
 * 公開API用のクライアント
 */
export const publicApi = {
	/**
	 * 記事一覧を取得
	 */
	getPosts: async (
		params: {
			page?: number;
			limit?: number;
			category?: string;
		} = {}
	) => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append('page', params.page.toString());
		if (params.limit) searchParams.append('limit', params.limit.toString());
		if (params.category) searchParams.append('category', params.category);

		const query = searchParams.toString();
		const endpoint = `/api/posts${query ? `?${query}` : ''}`;

		return apiCall<{
			posts: Array<{
				id: number;
				title: string;
				slug: string;
				excerpt: string;
				status: string;
				publishedAt: string;
				author: { id: string; username: string };
				categories: Array<{ id: number; name: string }>;
			}>;
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(endpoint);
	},

	/**
	 * 記事詳細を取得
	 */
	getPost: async (slug: string) => {
		return apiCall<{
			post: {
				id: number;
				title: string;
				slug: string;
				content: string;
				excerpt: string;
				status: string;
				publishedAt: string;
				author: { id: string; username: string };
				categories: Array<{ id: number; name: string; slug: string }>;
			};
		}>(`/api/posts/${slug}`);
	},

	/**
	 * カテゴリ一覧を取得
	 */
	getCategories: async () => {
		return apiCall<{
			categories: Array<{
				id: number;
				name: string;
				slug: string;
				description: string | null;
			}>;
		}>('/api/categories');
	}
};

/**
 * 管理API用のクライアント
 */
export const adminApi = {
	/**
	 * 管理用記事一覧を取得
	 */
	getPosts: async (
		params: {
			page?: number;
			limit?: number;
			status?: string;
		} = {}
	) => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append('page', params.page.toString());
		if (params.limit) searchParams.append('limit', params.limit.toString());
		if (params.status) searchParams.append('status', params.status);

		const query = searchParams.toString();
		const endpoint = `/api/admin/posts${query ? `?${query}` : ''}`;

		return apiCall<{
			posts: Array<{
				id: number;
				title: string;
				slug: string;
				excerpt: string;
				status: string;
				publishedAt: string | null;
				createdAt: string;
				updatedAt: string;
				author: { id: string; username: string };
				categories: Array<{ id: number; name: string }>;
			}>;
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(endpoint);
	},

	/**
	 * 記事を作成
	 */
	createPost: async (data: {
		title: string;
		content: string;
		excerpt?: string;
		status?: 'draft' | 'published';
		categoryIds?: number[];
		publishedAt?: string;
	}) => {
		return apiCall('/api/admin/posts', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	},

	/**
	 * 記事を更新
	 */
	updatePost: async (
		id: number,
		data: {
			title: string;
			content: string;
			excerpt?: string;
			status?: 'draft' | 'published';
			categoryIds?: number[];
		}
	) => {
		return apiCall(`/api/admin/posts/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	},

	/**
	 * 記事を削除
	 */
	deletePost: async (id: number) => {
		return apiCall(`/api/admin/posts/${id}`, {
			method: 'DELETE'
		});
	},

	/**
	 * カテゴリ一覧を取得
	 */
	getCategories: async () => {
		return apiCall<{
			categories: Array<{
				id: number;
				name: string;
				slug: string;
				description: string | null;
				createdAt: string;
				updatedAt: string;
			}>;
		}>('/api/admin/categories');
	},

	/**
	 * カテゴリを作成
	 */
	createCategory: async (data: { name: string; description?: string }) => {
		return apiCall('/api/admin/categories', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	},

	/**
	 * カテゴリを更新
	 */
	updateCategory: async (data: { id: number; name: string; description?: string }) => {
		return apiCall('/api/admin/categories', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	},

	/**
	 * カテゴリを削除
	 */
	deleteCategory: async (id: number) => {
		return apiCall('/api/admin/categories', {
			method: 'DELETE',
			body: JSON.stringify({ id })
		});
	},

	/**
	 * ファイルをアップロード
	 */
	uploadFile: async (file: File, type: 'image' | 'document' = 'image') => {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);

		return apiCall<{
			success: boolean;
			file: {
				id: number;
				url: string;
				name: string;
				filename: string;
				size: number;
				type: string;
				uploadedAt: string;
			};
		}>('/api/admin/upload', {
			method: 'POST',
			body: formData,
			headers: {} // Content-Typeは自動設定されるため削除
		});
	},

	/**
	 * アップロード済みファイル一覧を取得
	 */
	getUploadedFiles: async (params: { page?: number; limit?: number; type?: string } = {}) => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append('page', params.page.toString());
		if (params.limit) searchParams.append('limit', params.limit.toString());
		if (params.type) searchParams.append('type', params.type);

		const query = searchParams.toString();
		const endpoint = `/api/admin/upload${query ? `?${query}` : ''}`;

		return apiCall<{
			files: Array<{
				id: number;
				filename: string;
				originalName: string;
				mimeType: string;
				size: number;
				url: string;
				uploadedAt: string;
			}>;
			pagination: {
				page: number;
				limit: number;
				total: number;
			};
		}>(endpoint);
	}
};
