import type { Post, Category, User, Session } from '$lib/server/db/schema';

export interface TestDataSet {
	posts: Partial<Post>[];
	categories: Partial<Category>[];
	users: Partial<User>[];
	sessions: Partial<Session>[];
}

/**
 * テスト用のサンプルデータを生成
 */
export function createTestData(): TestDataSet {
	const now = new Date();
	const yesterday = new Date(now.getTime() - 86400000);

	return {
		users: [
			{
				id: 'test-user-1',
				username: 'testuser',
				hashedPassword: '$2b$10$test.hash.value',
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'test-admin-1',
				username: 'testadmin',
				hashedPassword: '$2b$10$test.admin.hash',
				createdAt: now,
				updatedAt: now
			}
		],
		categories: [
			{
				id: 1,
				name: 'Test Category 1',
				slug: 'test-category-1',
				description: 'Test category description 1',
				createdAt: now,
				updatedAt: now
			},
			{
				id: 2,
				name: 'Test Category 2',
				slug: 'test-category-2',
				description: 'Test category description 2',
				createdAt: now,
				updatedAt: now
			}
		],
		posts: [
			{
				id: 1,
				title: 'Published Test Post',
				slug: 'published-test-post',
				content: '# Published Test Post\n\nThis is a published test post.',
				excerpt: 'This is a published test post excerpt.',
				status: 'published',
				publishedAt: yesterday,
				createdAt: yesterday,
				updatedAt: yesterday,
				userId: 'test-user-1'
			},
			{
				id: 2,
				title: 'Draft Test Post',
				slug: 'draft-test-post',
				content: '# Draft Test Post\n\nThis is a draft test post.',
				excerpt: 'This is a draft test post excerpt.',
				status: 'draft',
				publishedAt: null,
				createdAt: now,
				updatedAt: now,
				userId: 'test-user-1'
			},
			{
				id: 3,
				title: 'Future Test Post',
				slug: 'future-test-post',
				content: '# Future Test Post\n\nThis is a future test post.',
				excerpt: 'This is a future test post excerpt.',
				status: 'published',
				publishedAt: new Date(now.getTime() + 86400000), // Tomorrow
				createdAt: now,
				updatedAt: now,
				userId: 'test-admin-1'
			}
		],
		sessions: [
			{
				id: 'test-session-1',
				userId: 'test-user-1',
				expiresAt: new Date(now.getTime() + 86400000), // Tomorrow
				createdAt: now
			}
		]
	};
}

/**
 * 特定のテストシナリオ用のデータを生成
 */
export function createScenarioData(scenario: 'empty' | 'minimal' | 'full'): TestDataSet {
	const baseData = createTestData();

	switch (scenario) {
		case 'empty':
			return {
				users: [],
				categories: [],
				posts: [],
				sessions: []
			};

		case 'minimal':
			return {
				users: [baseData.users[0]],
				categories: [baseData.categories[0]],
				posts: [baseData.posts[0]],
				sessions: []
			};

		case 'full':
			// Generate more test data
			const posts: Partial<Post>[] = [];
			const categories: Partial<Category>[] = [...baseData.categories];

			// Add more categories
			for (let i = 3; i <= 5; i++) {
				categories.push({
					id: i,
					name: `Category ${i}`,
					slug: `category-${i}`,
					description: `Description for category ${i}`,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}

			// Add more posts
			for (let i = 1; i <= 20; i++) {
				posts.push({
					id: i,
					title: `Test Post ${i}`,
					slug: `test-post-${i}`,
					content: `# Test Post ${i}\n\nContent for test post ${i}.`,
					excerpt: `Excerpt for test post ${i}`,
					status: i % 3 === 0 ? 'draft' : 'published',
					publishedAt: i % 3 === 0 ? null : new Date(Date.now() - i * 86400000),
					createdAt: new Date(Date.now() - i * 86400000),
					updatedAt: new Date(Date.now() - i * 86400000),
					userId: i % 2 === 0 ? 'test-user-1' : 'test-admin-1'
				});
			}

			return {
				users: baseData.users,
				categories,
				posts,
				sessions: baseData.sessions
			};
	}
}

/**
 * ランダムなテストデータを生成
 */
export function generateRandomPost(overrides: Partial<Post> = {}): Partial<Post> {
	const id = Math.floor(Math.random() * 10000);
	const now = new Date();

	return {
		id,
		title: `Random Post ${id}`,
		slug: `random-post-${id}`,
		content: `# Random Post ${id}\n\nThis is randomly generated content.`,
		excerpt: `Random excerpt for post ${id}`,
		status: Math.random() > 0.5 ? 'published' : 'draft',
		publishedAt: Math.random() > 0.5 ? now : null,
		createdAt: now,
		updatedAt: now,
		userId: 'test-user-1',
		...overrides
	};
}
