// Database types imported for type definitions (used in comments)
import {
	users,
	categories,
	posts,
	sessions,
	media,
	postsToCategories,
	qualityMetrics,
	type NewUser,
	type NewCategory,
	type NewPost,
	type NewSession,
	type NewMedia,
	type NewQualityMetrics,
	type User,
	type Category,
	type Post
} from '../server/db/schema';
import { factories, createTechPostData, createAiMlPostData } from './factories';

/**
 * Test Fixtures for Database Integration
 * 2025 Best Practice: Type-safe, reusable test data creation
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestDatabase = any;

export class TestFixtures {
	private db: TestDatabase;

	constructor(database: TestDatabase) {
		this.db = database;
	}

	/**
	 * Create a single user
	 */
	async createUser(userData: Partial<NewUser> = {}): Promise<User> {
		const user = factories.user.build(userData);
		const [created] = await this.db.insert(users).values(user).returning();
		return created;
	}

	/**
	 * Create an admin user
	 */
	async createAdminUser(userData: Partial<NewUser> = {}): Promise<User> {
		const adminUser = factories.adminUser.build(userData);
		const [created] = await this.db.insert(users).values(adminUser).returning();
		return created;
	}

	/**
	 * Create multiple users
	 */
	async createUsers(count: number, userData: Partial<NewUser> = {}): Promise<User[]> {
		const userList = factories.user.buildList(count, userData);
		return await this.db.insert(users).values(userList).returning();
	}

	/**
	 * Create a single category
	 */
	async createCategory(categoryData: Partial<NewCategory> = {}): Promise<Category> {
		const category = factories.category.build(categoryData);
		const [created] = await this.db.insert(categories).values(category).returning();
		return created;
	}

	/**
	 * Create default categories (Technology, AI/ML)
	 */
	async createDefaultCategories(): Promise<{ tech: Category; aiMl: Category }> {
		const techCategory = factories.techCategory.build();
		const aiMlCategory = factories.aiCategory.build();

		const [tech] = await this.db.insert(categories).values(techCategory).returning();
		const [aiMl] = await this.db.insert(categories).values(aiMlCategory).returning();

		return { tech, aiMl };
	}

	/**
	 * Create a single post
	 */
	async createPost(postData: Partial<NewPost> = {}, authorId?: string): Promise<Post> {
		// Ensure we have an author
		let userId = authorId;
		if (!userId) {
			const author = await this.createUser();
			userId = author.id;
		}

		const post = factories.post.build({ ...postData, userId });
		const [created] = await this.db.insert(posts).values(post).returning();
		return created;
	}

	/**
	 * Create a published post
	 */
	async createPublishedPost(postData: Partial<NewPost> = {}, authorId?: string): Promise<Post> {
		return this.createPost(
			{ ...postData, status: 'published', publishedAt: new Date() },
			authorId
		);
	}

	/**
	 * Create a draft post
	 */
	async createDraftPost(postData: Partial<NewPost> = {}, authorId?: string): Promise<Post> {
		return this.createPost({ ...postData, status: 'draft', publishedAt: null }, authorId);
	}

	/**
	 * Create a post with categories
	 */
	async createPostWithCategories(
		postData: Partial<NewPost> = {},
		categoryIds: number[] = [],
		authorId?: string
	): Promise<{ post: Post; categoryIds: number[] }> {
		const post = await this.createPost(postData, authorId);

		// If no category IDs provided, create default categories
		let finalCategoryIds = categoryIds;
		if (finalCategoryIds.length === 0) {
			const { tech } = await this.createDefaultCategories();
			finalCategoryIds = [tech.id];
		}

		// Create post-category relationships
		for (const categoryId of finalCategoryIds) {
			await this.db.insert(postsToCategories).values({
				postId: post.id,
				categoryId
			});
		}

		return { post, categoryIds: finalCategoryIds };
	}

	/**
	 * Create a realistic tech blog post
	 */
	async createTechPost(authorId?: string): Promise<Post> {
		const techPostData = createTechPostData();
		return this.createPost(techPostData, authorId);
	}

	/**
	 * Create a realistic AI/ML blog post
	 */
	async createAiMlPost(authorId?: string): Promise<Post> {
		const aiMlPostData = createAiMlPostData();
		return this.createPost(aiMlPostData, authorId);
	}

	/**
	 * Create a complete blog setup (user, categories, posts)
	 */
	async createBlogSetup(): Promise<{
		admin: User;
		categories: { tech: Category; aiMl: Category };
		posts: { techPost: Post; aiMlPost: Post; draftPost: Post };
	}> {
		// Create admin user
		const admin = await this.createAdminUser();

		// Create categories
		const categories = await this.createDefaultCategories();

		// Create posts
		const techPost = await this.createTechPost(admin.id);
		const aiMlPost = await this.createAiMlPost(admin.id);
		const draftPost = await this.createDraftPost(
			{ title: 'Work in Progress', slug: 'work-in-progress' },
			admin.id
		);

		// Associate posts with categories
		await this.db.insert(postsToCategories).values([
			{ postId: techPost.id, categoryId: categories.tech.id },
			{ postId: aiMlPost.id, categoryId: categories.aiMl.id }
		]);

		return {
			admin,
			categories,
			posts: { techPost, aiMlPost, draftPost }
		};
	}

	/**
	 * Create session for user
	 */
	async createSession(userId: string, sessionData: Partial<NewSession> = {}) {
		const session = factories.session.build({ ...sessionData, userId });
		const [created] = await this.db.insert(sessions).values(session).returning();
		return created;
	}

	/**
	 * Create media file
	 */
	async createMedia(uploadedBy: string, mediaData: Partial<NewMedia> = {}) {
		const mediaItem = factories.media.build({ ...mediaData, uploadedBy });
		const [created] = await this.db.insert(media).values(mediaItem).returning();
		return created;
	}

	/**
	 * Create quality metrics
	 */
	async createQualityMetrics(metricsData: Partial<NewQualityMetrics> = {}) {
		const metrics = factories.qualityMetrics.build(metricsData);
		const [created] = await this.db.insert(qualityMetrics).values(metrics).returning();
		return created;
	}

	/**
	 * Create high quality metrics (for positive test scenarios)
	 */
	async createHighQualityMetrics(metricsData: Partial<NewQualityMetrics> = {}) {
		const metrics = factories.highQualityMetrics.build(metricsData);
		const [created] = await this.db.insert(qualityMetrics).values(metrics).returning();
		return created;
	}

	/**
	 * Create multiple quality metrics for trend analysis
	 */
	async createQualityMetricsTrend(
		count: number = 5,
		startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
	) {
		const metrics = [];
		for (let i = 0; i < count; i++) {
			const timestamp = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000); // 1 day apart
			const metric = await this.createQualityMetrics({
				timestamp,
				commitHash: `commit-${i + 1}`,
				// Simulate improving metrics over time
				lighthousePerformance: 85 + i * 2,
				testUnitCoverage: 70 + i * 3
			});
			metrics.push(metric);
		}
		return metrics;
	}

	/**
	 * Clean all test data (useful for test cleanup)
	 */
	async cleanAll(): Promise<void> {
		// Order matters due to foreign key constraints
		await this.db.delete(postsToCategories);
		await this.db.delete(media);
		await this.db.delete(sessions);
		await this.db.delete(posts);
		await this.db.delete(categories);
		await this.db.delete(users);
		await this.db.delete(qualityMetrics);
	}

	/**
	 * Get counts for verification
	 */
	async getCounts() {
		const userResults = await this.db.select().from(users);
		const categoryResults = await this.db.select().from(categories);
		const postResults = await this.db.select().from(posts);
		const sessionResults = await this.db.select().from(sessions);
		const mediaResults = await this.db.select().from(media);
		const metricsResults = await this.db.select().from(qualityMetrics);

		return {
			users: userResults.length,
			categories: categoryResults.length,
			posts: postResults.length,
			sessions: sessionResults.length,
			media: mediaResults.length,
			qualityMetrics: metricsResults.length
		};
	}
}

/**
 * Export commonly used test scenarios
 */
export const testScenarios = {
	/**
	 * Create a minimal blog setup for basic tests
	 */
	minimal: async (fixtures: TestFixtures) => {
		const user = await fixtures.createUser();
		const category = await fixtures.createCategory();
		const post = await fixtures.createPost({}, user.id);
		return { user, category, post };
	},

	/**
	 * Create a complete blog with multiple posts and categories
	 */
	full: async (fixtures: TestFixtures) => {
		return await fixtures.createBlogSetup();
	},

	/**
	 * Create data for testing post-category relationships
	 */
	postCategories: async (fixtures: TestFixtures) => {
		const admin = await fixtures.createAdminUser();
		const categories = await fixtures.createDefaultCategories();
		const { post } = await fixtures.createPostWithCategories(
			{ title: 'Multi-category Post' },
			[categories.tech.id, categories.aiMl.id],
			admin.id
		);
		return { admin, categories, post };
	},

	/**
	 * Create data for quality metrics testing
	 */
	qualityMetrics: async (fixtures: TestFixtures) => {
		const recent = await fixtures.createHighQualityMetrics();
		const trend = await fixtures.createQualityMetricsTrend(3);
		return { recent, trend };
	}
};

/**
 * Factory for creating TestFixtures instances
 */
export function createTestFixtures(database: TestDatabase): TestFixtures {
	return new TestFixtures(database);
}

export default TestFixtures;
