/**
 * API呼び出しのモック
 */

interface MockResponse {
	status: number;
	body: any;
	headers?: Record<string, string>;
}

interface MockEndpoint {
	method: string;
	path: string | RegExp;
	response: MockResponse | ((req: Request) => MockResponse | Promise<MockResponse>);
}

export class ApiMock {
	private endpoints: MockEndpoint[] = [];
	private defaultResponse: MockResponse = {
		status: 404,
		body: { error: 'Not Found' }
	};

	/**
	 * エンドポイントを登録
	 */
	register(endpoint: MockEndpoint): void {
		this.endpoints.push(endpoint);
	}

	/**
	 * 複数のエンドポイントを一括登録
	 */
	registerMany(endpoints: MockEndpoint[]): void {
		this.endpoints.push(...endpoints);
	}

	/**
	 * デフォルトレスポンスを設定
	 */
	setDefaultResponse(response: MockResponse): void {
		this.defaultResponse = response;
	}

	/**
	 * リクエストを処理
	 */
	async handle(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const method = req.method;
		const path = url.pathname;

		// Find matching endpoint
		const endpoint = this.endpoints.find((e) => {
			if (e.method !== method) return false;
			if (typeof e.path === 'string') {
				return e.path === path;
			} else {
				return e.path.test(path);
			}
		});

		// Get response
		let response: MockResponse;
		if (endpoint) {
			if (typeof endpoint.response === 'function') {
				response = await endpoint.response(req);
			} else {
				response = endpoint.response;
			}
		} else {
			response = this.defaultResponse;
		}

		// Create Response object
		return new Response(JSON.stringify(response.body), {
			status: response.status,
			headers: {
				'Content-Type': 'application/json',
				...response.headers
			}
		});
	}

	/**
	 * エンドポイントをクリア
	 */
	clear(): void {
		this.endpoints = [];
	}

	/**
	 * 共通のエンドポイントを設定
	 */
	setupCommonEndpoints(): void {
		// Posts API
		this.register({
			method: 'GET',
			path: '/api/posts',
			response: {
				status: 200,
				body: {
					posts: [
						{
							id: 1,
							slug: 'test-post-1',
							title: 'Test Post 1',
							excerpt: 'Test excerpt 1',
							publishedAt: new Date().toISOString(),
							status: 'published',
							categories: [{ id: 1, name: 'Test Category' }]
						}
					],
					pagination: {
						page: 1,
						limit: 10,
						total: 1,
						totalPages: 1
					}
				}
			}
		});

		// Single post API
		this.register({
			method: 'GET',
			path: /^\/api\/posts\/(.+)$/,
			response: (req) => {
				const url = new URL(req.url);
				const slug = url.pathname.split('/').pop();
				return {
					status: 200,
					body: {
						post: {
							id: 1,
							slug,
							title: `Post: ${slug}`,
							content: `# ${slug}\n\nTest content`,
							excerpt: 'Test excerpt',
							publishedAt: new Date().toISOString(),
							status: 'published',
							categories: [{ id: 1, name: 'Test Category' }]
						}
					}
				};
			}
		});

		// Categories API
		this.register({
			method: 'GET',
			path: '/api/categories',
			response: {
				status: 200,
				body: {
					categories: [
						{
							id: 1,
							name: 'Test Category',
							slug: 'test-category',
							description: 'Test description',
							postCount: 5
						}
					]
				}
			}
		});

		// Admin posts API
		this.register({
			method: 'GET',
			path: '/api/admin/posts',
			response: async (req) => {
				// Check authentication
				const authHeader = req.headers.get('authorization');
				if (!authHeader || !authHeader.startsWith('Bearer ')) {
					return {
						status: 401,
						body: { error: 'Unauthorized' }
					};
				}

				return {
					status: 200,
					body: {
						posts: [
							{
								id: 1,
								slug: 'admin-post-1',
								title: 'Admin Post 1',
								excerpt: 'Admin excerpt',
								status: 'draft',
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString()
							}
						],
						pagination: {
							page: 1,
							limit: 10,
							total: 1,
							totalPages: 1
						}
					}
				};
			}
		});

		// Create post API
		this.register({
			method: 'POST',
			path: '/api/admin/posts',
			response: async (req) => {
				const body = await req.json();
				return {
					status: 201,
					body: {
						success: true,
						post: {
							id: Math.floor(Math.random() * 1000),
							...body,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString()
						}
					}
				};
			}
		});

		// Update post API
		this.register({
			method: 'PUT',
			path: /^\/api\/admin\/posts\/(\d+)$/,
			response: async (req) => {
				const body = await req.json();
				const id = parseInt(req.url.split('/').pop()!);
				return {
					status: 200,
					body: {
						success: true,
						post: {
							id,
							...body,
							updatedAt: new Date().toISOString()
						}
					}
				};
			}
		});

		// Delete post API
		this.register({
			method: 'DELETE',
			path: /^\/api\/admin\/posts\/(\d+)$/,
			response: {
				status: 200,
				body: { success: true }
			}
		});
	}
}

/**
 * グローバルなApiMockインスタンス
 */
export const apiMock = new ApiMock();

/**
 * fetchのモック化
 */
export function mockFetch(mock: ApiMock = apiMock): void {
	global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const req = new Request(input, init);
		return mock.handle(req);
	};
}

/**
 * fetchのモックを解除
 */
export function unmockFetch(): void {
	// @ts-ignore
	delete global.fetch;
}
