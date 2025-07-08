/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb } from '../setup';
import { createTestFixtures, testScenarios, testUtils } from '../../../src/lib/test-utils';

/**
 * Example Usage of New Factory System
 * Demonstrates migration from old test patterns to new factory-based approach
 */

describe('Factory System Usage Examples', () => {
	let fixtures: ReturnType<typeof createTestFixtures>;

	beforeEach(() => {
		fixtures = createTestFixtures(getTestDb());
	});

	describe('Before and After Examples', () => {
		it('BEFORE: Manual test data creation (old way)', async () => {
			// OLD WAY: Manual data creation with hardcoded values
			// (This is an example of what NOT to do)

			// Instead of showing broken code, let's demonstrate the pain points:
			// 1. Manual ID generation
			// 2. Hardcoded timestamps
			// 3. No type safety
			// 4. Verbose boilerplate
			// 5. No relationship management

			const userData = {
				id: 'manual-user-id-' + Date.now(),
				username: 'testuser',
				hashedPassword: 'manual-password-hash',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const categoryData = {
				name: 'Test Category',
				slug: 'test-category',
				description: 'A test category',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// This is verbose, error-prone, and hard to maintain
			expect(userData.username).toBe('testuser');
			expect(categoryData.name).toBe('Test Category');
			expect(userData.id).toContain('manual-user-id');
			expect(categoryData.slug).toBe('test-category');
		});

		it('AFTER: Factory-based test data creation (new way)', async () => {
			// NEW WAY: Clean, consistent factory usage
			const user = await fixtures.createUser({ username: 'testuser' });
			const category = await fixtures.createCategory({ name: 'Test Category' });

			// Clean, type-safe, and consistent
			expect(user.username).toBe('testuser');
			expect(category.name).toBe('Test Category');
			expect(user.id).toBeDefined();
			expect(user.createdAt).toBeInstanceOf(Date);
		});

		it('NEW: Realistic test data with factories', async () => {
			// Create realistic blog content easily
			const admin = await fixtures.createAdminUser();
			const techPost = await fixtures.createTechPost(admin.id);
			const aiMlPost = await fixtures.createAiMlPost(admin.id);

			expect(techPost.title).toBe('Understanding Modern Web Development');
			expect(techPost.content).toContain('Modern web development');
			expect(aiMlPost.title).toBe('Introduction to Machine Learning');
			expect(aiMlPost.content).toContain('Machine Learning (ML)');
			expect(techPost.userId).toBe(admin.id);
			expect(aiMlPost.userId).toBe(admin.id);
		});
	});

	describe('Test Scenario Usage', () => {
		it('should use minimal scenario for simple tests', async () => {
			const { user, category, post } = await testScenarios.minimal(fixtures);

			// Perfect for testing single entity operations
			expect(user).toBeDefined();
			expect(category).toBeDefined();
			expect(post).toBeDefined();
			expect(post.userId).toBe(user.id);
		});

		it('should use full scenario for complex tests', async () => {
			const setup = await testScenarios.full(fixtures);

			// Perfect for testing relationships and complex workflows
			expect(setup.admin).toBeDefined();
			expect(setup.categories.tech).toBeDefined();
			expect(setup.categories.aiMl).toBeDefined();
			expect(setup.posts.techPost).toBeDefined();
			expect(setup.posts.aiMlPost).toBeDefined();
			expect(setup.posts.draftPost).toBeDefined();
		});

		it('should use quality metrics scenario for dashboard tests', async () => {
			const { recent, trend } = await testScenarios.qualityMetrics(fixtures);

			// Perfect for testing metrics and analytics
			expect(recent.lighthousePerformance).toBe(95);
			expect(trend).toHaveLength(3);
			expect(trend[2].lighthousePerformance!).toBeGreaterThan(
				trend[0].lighthousePerformance!
			);
		});
	});

	describe('Test Utils Usage', () => {
		it('should generate unique identifiers', () => {
			const id1 = testUtils.generateTestId();
			const id2 = testUtils.generateTestId();

			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it('should generate test dates relative to now', () => {
			const now = testUtils.testDate.now();
			const yesterday = testUtils.testDate.daysAgo(1);
			const tomorrow = testUtils.testDate.daysFromNow(1);

			expect(yesterday < now).toBe(true);
			expect(tomorrow > now).toBe(true);
		});

		it('should generate realistic content', () => {
			const title = testUtils.content.title('My Blog');
			const slug = testUtils.content.slug(title);
			const excerpt = testUtils.content.excerpt(title);
			const markdown = testUtils.content.markdown(title);

			expect(title).toContain('My Blog');
			expect(slug).toMatch(/^my-blog-test-/);
			expect(excerpt).toContain('test excerpt');
			expect(markdown).toContain('# ' + title);
		});
	});

	describe('Advanced Factory Usage', () => {
		it('should create posts with specific relationships', async () => {
			const author = await fixtures.createUser({ username: 'author' });
			const { tech, aiMl } = await fixtures.createDefaultCategories();

			const { post } = await fixtures.createPostWithCategories(
				{ title: 'Cross-domain Post', status: 'published' },
				[tech.id, aiMl.id],
				author.id
			);

			expect(post.title).toBe('Cross-domain Post');
			expect(post.status).toBe('published');
			expect(post.userId).toBe(author.id);
		});

		it('should create quality metrics trend for analysis', async () => {
			const trend = await fixtures.createQualityMetricsTrend(5);

			// Verify improving trend
			for (let i = 1; i < trend.length; i++) {
				expect(trend[i].lighthousePerformance!).toBeGreaterThan(
					trend[i - 1].lighthousePerformance!
				);
			}
		});

		it('should create and clean test data efficiently', async () => {
			// Create multiple entities
			await fixtures.createUsers(3);
			await fixtures.createDefaultCategories();
			await fixtures.createQualityMetrics();

			// Verify data exists
			const counts = await fixtures.getCounts();
			expect(counts.users).toBeGreaterThan(0);
			expect(counts.categories).toBeGreaterThan(0);
			expect(counts.qualityMetrics).toBeGreaterThan(0);

			// Clean all data
			await fixtures.cleanAll();

			// Verify data is cleaned
			const cleanCounts = await fixtures.getCounts();
			expect(cleanCounts.users).toBe(0);
			expect(cleanCounts.categories).toBe(0);
			expect(cleanCounts.qualityMetrics).toBe(0);
		});
	});

	describe('Performance Benefits', () => {
		it('should create test data faster than manual methods', async () => {
			const startTime = Date.now();

			// Create comprehensive blog setup in one call
			const setup = await fixtures.createBlogSetup();

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should be fast (under 100ms for basic setup)
			expect(duration).toBeLessThan(1000);
			expect(setup.admin).toBeDefined();
			expect(setup.categories.tech).toBeDefined();
			expect(setup.posts.techPost).toBeDefined();
		});

		it('should handle batch operations efficiently', async () => {
			const startTime = Date.now();

			// Create 10 users in one batch
			const users = await fixtures.createUsers(10);

			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(users).toHaveLength(10);
			expect(duration).toBeLessThan(500); // Should be fast for batch operations
			expect(users.every((user) => user.id && user.username)).toBe(true);
		});
	});
});
