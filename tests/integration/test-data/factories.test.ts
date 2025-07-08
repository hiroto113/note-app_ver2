import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb } from '../setup';
import {
	createTestFixtures,
	testScenarios,
	testUtils,
	TEST_CONSTANTS
} from '../../../src/lib/test-utils';

/**
 * Factory System Integration Tests
 * 2025 Best Practice: Comprehensive testing of data factories
 */

describe('Factory System Integration', () => {
	let fixtures: ReturnType<typeof createTestFixtures>;

	beforeEach(() => {
		fixtures = createTestFixtures(getTestDb());
	});

	describe('User Factories', () => {
		it('should create a basic user', async () => {
			const user = await fixtures.createUser();

			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.username).toMatch(/^user\d+$/);
			expect(user.hashedPassword).toBe(TEST_CONSTANTS.PASSWORDS.HASHED_DEFAULT);
			expect(user.createdAt).toBeInstanceOf(Date);
			expect(user.updatedAt).toBeInstanceOf(Date);
		});

		it('should create an admin user', async () => {
			const admin = await fixtures.createAdminUser();

			expect(admin.username).toBe('admin');
			expect(admin.hashedPassword).toBe(TEST_CONSTANTS.PASSWORDS.HASHED_DEFAULT);
		});

		it('should create multiple users', async () => {
			const users = await fixtures.createUsers(3);

			expect(users).toHaveLength(3);
			expect(users.every((user) => user.id && user.username)).toBe(true);
			// Ensure all usernames are unique
			const usernames = users.map((u) => u.username);
			expect(new Set(usernames).size).toBe(3);
		});

		it('should create user with custom data', async () => {
			const customUser = await fixtures.createUser({
				username: 'custom_user',
				hashedPassword: 'custom_password_hash'
			});

			expect(customUser.username).toBe('custom_user');
			expect(customUser.hashedPassword).toBe('custom_password_hash');
		});
	});

	describe('Category Factories', () => {
		it('should create a basic category', async () => {
			const category = await fixtures.createCategory();

			expect(category).toBeDefined();
			expect(category.id).toBeDefined();
			expect(category.name).toMatch(/^Category \d+$/);
			expect(category.slug).toMatch(/^category-\d+$/);
			expect(category.description).toContain('Description for');
		});

		it('should create default categories', async () => {
			const { tech, aiMl } = await fixtures.createDefaultCategories();

			expect(tech.name).toBe('Technology');
			expect(tech.slug).toBe('technology');
			expect(aiMl.name).toBe('AI & Machine Learning');
			expect(aiMl.slug).toBe('ai-ml');
		});

		it('should create category with custom data', async () => {
			const customCategory = await fixtures.createCategory({
				name: 'Custom Category',
				slug: 'custom-category',
				description: 'A custom test category'
			});

			expect(customCategory.name).toBe('Custom Category');
			expect(customCategory.slug).toBe('custom-category');
			expect(customCategory.description).toBe('A custom test category');
		});
	});

	describe('Post Factories', () => {
		it('should create a basic post', async () => {
			const post = await fixtures.createPost();

			expect(post).toBeDefined();
			expect(post.id).toBeDefined();
			expect(post.title).toMatch(/^Post Title \d+$/);
			expect(post.slug).toMatch(/^post-title-\d+$/);
			expect(post.content).toContain('# Post Title');
			expect(post.excerpt).toContain('This is the excerpt for');
			expect(post.status).toBe('draft');
			expect(post.userId).toBeDefined();
		});

		it('should create a published post', async () => {
			const post = await fixtures.createPublishedPost();

			expect(post.status).toBe('published');
			expect(post.publishedAt).toBeInstanceOf(Date);
		});

		it('should create a draft post', async () => {
			const post = await fixtures.createDraftPost();

			expect(post.status).toBe('draft');
			expect(post.publishedAt).toBeNull();
		});

		it('should create post with specific author', async () => {
			const author = await fixtures.createUser();
			const post = await fixtures.createPost({}, author.id);

			expect(post.userId).toBe(author.id);
		});

		it('should create tech blog post', async () => {
			const techPost = await fixtures.createTechPost();

			expect(techPost.title).toBe('Understanding Modern Web Development');
			expect(techPost.content).toContain('Modern web development');
			expect(techPost.status).toBe('published');
		});

		it('should create AI/ML blog post', async () => {
			const aiMlPost = await fixtures.createAiMlPost();

			expect(aiMlPost.title).toBe('Introduction to Machine Learning');
			expect(aiMlPost.content).toContain('Machine Learning (ML)');
			expect(aiMlPost.status).toBe('published');
		});
	});

	describe('Post with Categories', () => {
		it('should create post with categories', async () => {
			const { tech, aiMl } = await fixtures.createDefaultCategories();
			const { post, categoryIds } = await fixtures.createPostWithCategories(
				{ title: 'Multi-category Post' },
				[tech.id, aiMl.id]
			);

			expect(post.title).toBe('Multi-category Post');
			expect(categoryIds).toEqual([tech.id, aiMl.id]);
		});

		it('should create post with default category if none provided', async () => {
			const { post, categoryIds } = await fixtures.createPostWithCategories();

			expect(post).toBeDefined();
			expect(categoryIds).toHaveLength(1);
			expect(categoryIds[0]).toBeDefined();
		});
	});

	describe('Quality Metrics Factories', () => {
		it('should create quality metrics', async () => {
			const metrics = await fixtures.createQualityMetrics();

			expect(metrics).toBeDefined();
			expect(metrics.id).toBeDefined();
			expect(metrics.timestamp).toBeInstanceOf(Date);
			expect(metrics.commitHash).toBeDefined();
			expect(metrics.branch).toBe('main');
			expect(metrics.lighthousePerformance).toBeGreaterThanOrEqual(80);
			expect(metrics.lighthousePerformance).toBeLessThanOrEqual(100);
		});

		it('should create high quality metrics', async () => {
			const metrics = await fixtures.createHighQualityMetrics();

			expect(metrics.lighthousePerformance).toBe(95);
			expect(metrics.lighthouseAccessibility).toBe(98);
			expect(metrics.testUnitCoverage).toBe(95);
			expect(metrics.axeViolations).toBe(0);
		});

		it('should create quality metrics trend', async () => {
			const trend = await fixtures.createQualityMetricsTrend(3);

			expect(trend).toHaveLength(3);
			// Check that performance improves over time
			expect(trend[0].lighthousePerformance).toBe(85);
			expect(trend[1].lighthousePerformance).toBe(87);
			expect(trend[2].lighthousePerformance).toBe(89);
		});
	});

	describe('Complete Blog Setup', () => {
		it('should create complete blog setup', async () => {
			const setup = await fixtures.createBlogSetup();

			expect(setup.admin).toBeDefined();
			expect(setup.admin.username).toBe('admin');

			expect(setup.categories.tech).toBeDefined();
			expect(setup.categories.aiMl).toBeDefined();

			expect(setup.posts.techPost).toBeDefined();
			expect(setup.posts.aiMlPost).toBeDefined();
			expect(setup.posts.draftPost).toBeDefined();

			expect(setup.posts.techPost.status).toBe('published');
			expect(setup.posts.draftPost.status).toBe('draft');
		});
	});

	describe('Test Scenarios', () => {
		it('should run minimal test scenario', async () => {
			const { user, category, post } = await testScenarios.minimal(fixtures);

			expect(user).toBeDefined();
			expect(category).toBeDefined();
			expect(post).toBeDefined();
			expect(post.userId).toBe(user.id);
		});

		it('should run full test scenario', async () => {
			const setup = await testScenarios.full(fixtures);

			expect(setup.admin).toBeDefined();
			expect(setup.categories).toBeDefined();
			expect(setup.posts).toBeDefined();
		});

		it('should run post categories test scenario', async () => {
			const { admin, categories, post } = await testScenarios.postCategories(fixtures);

			expect(admin).toBeDefined();
			expect(categories.tech).toBeDefined();
			expect(categories.aiMl).toBeDefined();
			expect(post).toBeDefined();
			expect(post.title).toBe('Multi-category Post');
		});

		it('should run quality metrics test scenario', async () => {
			const { recent, trend } = await testScenarios.qualityMetrics(fixtures);

			expect(recent).toBeDefined();
			expect(trend).toHaveLength(3);
			expect(recent.lighthousePerformance).toBe(95);
		});
	});

	describe('Test Utils', () => {
		it('should generate unique test IDs', () => {
			const id1 = testUtils.generateTestId();
			const id2 = testUtils.generateTestId();

			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it('should generate test dates', () => {
			const now = testUtils.testDate.now();
			const hoursAgo = testUtils.testDate.hoursAgo(2);
			const daysFromNow = testUtils.testDate.daysFromNow(1);

			expect(hoursAgo < now).toBe(true);
			expect(daysFromNow > now).toBe(true);
		});

		it('should generate test content', () => {
			const title = testUtils.content.title('Blog');
			const slug = testUtils.content.slug(title);
			const excerpt = testUtils.content.excerpt(title);
			const markdown = testUtils.content.markdown(title);

			expect(title).toContain('Blog');
			expect(slug).toMatch(/^blog-test-/);
			expect(excerpt).toContain('test excerpt');
			expect(markdown).toContain('# ' + title);
		});

		it('should validate array properties', () => {
			const testObj = { name: 'test', id: 123, active: true };
			const hasRequired = testUtils.assert.hasRequiredProperties(testObj, ['name', 'id']);
			const missingRequired = testUtils.assert.hasRequiredProperties(testObj, [
				'name',
				'missing' as keyof typeof testObj
			]);

			expect(hasRequired).toBe(true);
			expect(missingRequired).toBe(false);
		});
	});

	describe('Cleanup', () => {
		it('should clean all test data', async () => {
			// Create some test data
			await fixtures.createUser();
			await fixtures.createCategory();
			await fixtures.createQualityMetrics();

			// Clean all data
			await fixtures.cleanAll();

			// Verify data is cleaned
			const counts = await fixtures.getCounts();
			expect(counts.users).toBe(0);
			expect(counts.categories).toBe(0);
			expect(counts.qualityMetrics).toBe(0);
		});
	});
});
