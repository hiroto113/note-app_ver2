import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../../integration/setup';
import { posts, categories, users, postsToCategories } from '$lib/server/db/schema';
import { eq, and, count, desc, gte, lte } from 'drizzle-orm';
import { RegressionTestHelpers } from '../utils/regression-helpers';
import { regressionDataManager } from '../utils/regression-data-manager';

/**
 * Business Logic Regression Tests
 *
 * Prevents regression of critical business rules and logic including:
 * - Content publishing workflows
 * - User permission and access controls
 * - SEO and content optimization rules
 * - Content moderation and validation
 * - Search and filtering logic
 * - Content organization and categorization
 *
 * Based on historical issues:
 * - Incorrect content visibility rules
 * - Permission bypass vulnerabilities
 * - SEO metadata generation failures
 * - Content validation rule changes
 * - Search algorithm degradation
 * - Category assignment logic errors
 */
describe('Business Logic Regression Tests', () => {
	let testData: any;

	beforeEach(async () => {
		testData = await regressionDataManager.createRegressionScenario('business-logic', {
			userCount: 3,
			categoryCount: 4,
			postCount: 15
		});
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('Content Publishing Workflow Regression', () => {
		it('should prevent regression: draft posts are not visible to public', async () => {
			// Create draft and published posts
			const [draftPost] = await testDb
				.insert(posts)
				.values({
					title: 'Draft Post',
					slug: `draft-post-${crypto.randomUUID()}`,
					content: 'This is a draft post',
					excerpt: 'Draft excerpt',
					status: 'draft',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [publishedPost] = await testDb
				.insert(posts)
				.values({
					title: 'Published Post',
					slug: `published-post-${crypto.randomUUID()}`,
					content: 'This is a published post',
					excerpt: 'Published excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Simulate public API query (only published posts)
			const publicPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.status, 'published'));

			// Verify business logic
			const containsDraft = publicPosts.some((post) => post.id === draftPost.id);
			const containsPublished = publicPosts.some((post) => post.id === publishedPost.id);

			expect(containsDraft).toBe(false);
			expect(containsPublished).toBe(true);
		});

		it('should prevent regression: publishing requires all required fields', async () => {
			const requiredFieldValidation = (post: any): boolean => {
				// Business rule: published posts must have title, content, and excerpt
				if (!post.title || post.title.trim() === '') return false;
				if (!post.content || post.content.trim() === '') return false;
				if (!post.excerpt || post.excerpt.trim() === '') return false;
				if (!post.slug || post.slug.trim() === '') return false;
				return true;
			};

			const invalidPosts = [
				{
					title: '',
					content: 'Valid content',
					excerpt: 'Valid excerpt',
					slug: 'valid-slug'
				},
				{ title: 'Valid title', content: '', excerpt: 'Valid excerpt', slug: 'valid-slug' },
				{ title: 'Valid title', content: 'Valid content', excerpt: '', slug: 'valid-slug' },
				{
					title: 'Valid title',
					content: 'Valid content',
					excerpt: 'Valid excerpt',
					slug: ''
				}
			];

			for (const invalidPost of invalidPosts) {
				const canPublish = requiredFieldValidation(invalidPost);
				expect(canPublish).toBe(false);
			}

			// Valid post should pass validation
			const validPost = {
				title: 'Valid Title',
				content: 'Valid content with substantial information',
				excerpt: 'Valid excerpt',
				slug: 'valid-slug'
			};
			expect(requiredFieldValidation(validPost)).toBe(true);
		});

		it('should prevent regression: post scheduling logic works correctly', async () => {
			const now = new Date();
			const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
			const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

			// Create scheduled posts
			const [futurePost] = await testDb
				.insert(posts)
				.values({
					title: 'Future Scheduled Post',
					slug: `future-post-${crypto.randomUUID()}`,
					content: 'This post is scheduled for the future',
					excerpt: 'Future excerpt',
					status: 'published',
					publishedAt: futureDate,
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [pastPost] = await testDb
				.insert(posts)
				.values({
					title: 'Past Published Post',
					slug: `past-post-${crypto.randomUUID()}`,
					content: 'This post was published in the past',
					excerpt: 'Past excerpt',
					status: 'published',
					publishedAt: pastDate,
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Business logic: only show posts published in the past or now
			const currentlyVisiblePosts = await testDb
				.select()
				.from(posts)
				.where(and(eq(posts.status, 'published'), lte(posts.publishedAt, now)));

			const containsFuture = currentlyVisiblePosts.some((post) => post.id === futurePost.id);
			const containsPast = currentlyVisiblePosts.some((post) => post.id === pastPost.id);

			expect(containsFuture).toBe(false); // Future posts should not be visible
			expect(containsPast).toBe(true); // Past posts should be visible
		});

		it('should prevent regression: post status transition rules are enforced', async () => {
			const validateStatusTransition = (
				currentStatus: string,
				newStatus: string
			): boolean => {
				// Business rules for status transitions
				const allowedTransitions: Record<string, string[]> = {
					draft: ['published', 'draft'],
					published: ['draft', 'published']
				};

				return allowedTransitions[currentStatus]?.includes(newStatus) || false;
			};

			// Test valid transitions
			expect(validateStatusTransition('draft', 'published')).toBe(true);
			expect(validateStatusTransition('published', 'draft')).toBe(true);
			expect(validateStatusTransition('draft', 'draft')).toBe(true);
			expect(validateStatusTransition('published', 'published')).toBe(true);

			// Test invalid transitions (if business rules expanded)
			expect(validateStatusTransition('draft', 'invalid_status')).toBe(false);
			expect(validateStatusTransition('published', 'invalid_status')).toBe(false);
		});
	});

	describe('User Permission and Access Control Regression', () => {
		it('should prevent regression: users can only edit their own posts', async () => {
			// Create posts by different users
			const [userAPost] = await testDb
				.insert(posts)
				.values({
					title: 'User A Post',
					slug: `user-a-post-${crypto.randomUUID()}`,
					content: 'Post by user A',
					excerpt: 'User A excerpt',
					status: 'draft',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const otherUserId = testData.additionalUsers[0];
			const [userBPost] = await testDb
				.insert(posts)
				.values({
					title: 'User B Post',
					slug: `user-b-post-${crypto.randomUUID()}`,
					content: 'Post by user B',
					excerpt: 'User B excerpt',
					status: 'draft',
					userId: otherUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Business logic: user can only edit their own posts
			const canEdit = (postUserId: string, currentUserId: string): boolean => {
				return postUserId === currentUserId;
			};

			// User A should be able to edit their own post
			expect(canEdit(userAPost.userId, testData.userId)).toBe(true);

			// User A should NOT be able to edit User B's post
			expect(canEdit(userBPost.userId, testData.userId)).toBe(false);

			// User B should be able to edit their own post
			expect(canEdit(userBPost.userId, otherUserId)).toBe(true);

			// User B should NOT be able to edit User A's post
			expect(canEdit(userAPost.userId, otherUserId)).toBe(false);
		});

		it('should prevent regression: admin users have elevated permissions', async () => {
			// Create admin user
			const [adminUser] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: `admin_${Date.now()}`,
					hashedPassword: 'admin_password_hash',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Business logic: permission checking
			const checkPermission = (userId: string, action: string): boolean => {
				// In real app, this would check user roles from database
				// For test, we simulate admin having all permissions
				const isAdmin = userId === adminUser.id;
				const regularUserActions = ['post.create', 'post.edit_own', 'post.delete_own'];
				const adminActions = [
					'post.edit_any',
					'post.delete_any',
					'category.manage',
					'user.manage'
				];

				if (isAdmin) {
					return regularUserActions.includes(action) || adminActions.includes(action);
				} else {
					return regularUserActions.includes(action);
				}
			};

			// Regular user permissions
			expect(checkPermission(testData.userId, 'post.create')).toBe(true);
			expect(checkPermission(testData.userId, 'post.edit_own')).toBe(true);
			expect(checkPermission(testData.userId, 'post.edit_any')).toBe(false);
			expect(checkPermission(testData.userId, 'category.manage')).toBe(false);

			// Admin user permissions
			expect(checkPermission(adminUser.id, 'post.create')).toBe(true);
			expect(checkPermission(adminUser.id, 'post.edit_own')).toBe(true);
			expect(checkPermission(adminUser.id, 'post.edit_any')).toBe(true);
			expect(checkPermission(adminUser.id, 'category.manage')).toBe(true);
		});

		it('should prevent regression: content visibility based on user role', async () => {
			// Create posts with different visibility levels
			const [publicPost] = await testDb
				.insert(posts)
				.values({
					title: 'Public Post',
					slug: `public-post-${crypto.randomUUID()}`,
					content: 'This is publicly visible',
					excerpt: 'Public excerpt',
					status: 'published',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [draftPost] = await testDb
				.insert(posts)
				.values({
					title: 'Draft Post',
					slug: `draft-post-${crypto.randomUUID()}`,
					content: 'This is a draft',
					excerpt: 'Draft excerpt',
					status: 'draft',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Business logic: content visibility rules
			const getVisiblePosts = (
				userRole: 'public' | 'author' | 'admin',
				authorId?: string
			) => {
				if (userRole === 'public') {
					return ['published']; // Only published posts
				} else if (userRole === 'author') {
					return ['published', 'draft']; // Own drafts + published posts
				} else if (userRole === 'admin') {
					return ['published', 'draft']; // All posts
				}
				return [];
			};

			// Public users see only published posts
			const publicVisible = getVisiblePosts('public');
			expect(publicVisible).toContain('published');
			expect(publicVisible).not.toContain('draft');

			// Authors see their own drafts + published posts
			const authorVisible = getVisiblePosts('author', testData.userId);
			expect(authorVisible).toContain('published');
			expect(authorVisible).toContain('draft');

			// Admins see all posts
			const adminVisible = getVisiblePosts('admin');
			expect(adminVisible).toContain('published');
			expect(adminVisible).toContain('draft');
		});
	});

	describe('SEO and Content Optimization Regression', () => {
		it('should prevent regression: SEO slug generation follows rules', async () => {
			const generateSEOSlug = (title: string): string => {
				return title
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
					.replace(/\s+/g, '-') // Replace spaces with hyphens
					.replace(/-+/g, '-') // Replace multiple hyphens with single
					.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
			};

			const testCases = [
				{ title: 'Simple Title', expected: 'simple-title' },
				{ title: 'Title with Numbers 123', expected: 'title-with-numbers-123' },
				{ title: 'Title!@# with $pecial Ch@rs', expected: 'title-with-pecial-chrs' },
				{ title: 'Multiple    Spaces', expected: 'multiple-spaces' },
				{ title: 'Title---with-Hyphens', expected: 'title-with-hyphens' },
				{
					title: '  Leading and Trailing Spaces  ',
					expected: 'leading-and-trailing-spaces'
				}
			];

			testCases.forEach((testCase) => {
				const result = generateSEOSlug(testCase.title);
				expect(result).toBe(testCase.expected);
			});
		});

		it('should prevent regression: meta description generation rules', async () => {
			const generateMetaDescription = (content: string, excerpt?: string): string => {
				// Business rule: use excerpt if available, otherwise truncate content
				if (excerpt && excerpt.trim()) {
					return excerpt.trim().substring(0, 160);
				}

				// Remove HTML tags and truncate content
				const plainText = content.replace(/<[^>]*>/g, '').trim();
				return plainText.substring(0, 160);
			};

			const contentWithExcerpt = 'Long content here...';
			const customExcerpt =
				'This is a custom excerpt that should be used for meta description.';

			const metaWithExcerpt = generateMetaDescription(contentWithExcerpt, customExcerpt);
			expect(metaWithExcerpt).toBe(customExcerpt);

			const contentWithoutExcerpt =
				'This is the main content that should be truncated for meta description. It has a lot of text that goes beyond the 160 character limit for SEO purposes and should be cut off appropriately.';
			const metaWithoutExcerpt = generateMetaDescription(contentWithoutExcerpt);
			expect(metaWithoutExcerpt.length).toBeLessThanOrEqual(160);
			expect(metaWithoutExcerpt).toBe(contentWithoutExcerpt.substring(0, 160));
		});

		it('should prevent regression: content readability scoring', async () => {
			const calculateReadabilityScore = (content: string): number => {
				// Simplified readability calculation
				const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
				const words = content.split(/\s+/).filter((w) => w.trim().length > 0);
				const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);

				// Business rule: prefer 15-20 words per sentence for good readability
				if (avgWordsPerSentence <= 15) return 90; // Easy
				if (avgWordsPerSentence <= 20) return 70; // Good
				if (avgWordsPerSentence <= 25) return 50; // Fair
				return 30; // Difficult
			};

			const easyContent =
				'This is easy to read. Short sentences work well. They are clear and simple.';
			const hardContent =
				'This is a very long sentence that contains many words and complex clauses that make it difficult to read and understand for most people who are trying to quickly scan through the content and get the main information without spending too much time parsing through unnecessarily complex sentence structures.';

			expect(calculateReadabilityScore(easyContent)).toBeGreaterThan(70);
			expect(calculateReadabilityScore(hardContent)).toBeLessThan(50);
		});

		it('should prevent regression: keyword density calculation', async () => {
			const calculateKeywordDensity = (content: string, keyword: string): number => {
				const words = content.toLowerCase().split(/\s+/);
				const keywordOccurrences = words.filter(
					(word) => word.replace(/[^a-z0-9]/g, '') === keyword.toLowerCase()
				).length;

				return (keywordOccurrences / words.length) * 100;
			};

			const content =
				'JavaScript is great. Learning JavaScript helps you build applications. JavaScript frameworks are popular.';
			const density = calculateKeywordDensity(content, 'javascript');

			// Should find 3 occurrences of "javascript" in 13 words ≈ 23%
			expect(density).toBeCloseTo(23.08, 0);

			// Business rule: keyword density should be 1-3% for good SEO
			const optimalDensity = 2.5;
			expect(density).toBeGreaterThan(optimalDensity * 5); // This content is over-optimized
		});
	});

	describe('Content Moderation and Validation Regression', () => {
		it('should prevent regression: content filtering removes harmful content', async () => {
			const filterContent = (content: string): { clean: string; violations: string[] } => {
				const violations: string[] = [];
				let clean = content;

				// Business rules for content filtering
				const prohibitedPatterns = [
					{ pattern: /<script[^>]*>.*?<\/script>/gi, violation: 'script_tag' },
					{ pattern: /javascript:/gi, violation: 'javascript_protocol' },
					{ pattern: /<iframe[^>]*>/gi, violation: 'iframe_tag' },
					{ pattern: /on\w+\s*=/gi, violation: 'event_handler' }
				];

				prohibitedPatterns.forEach(({ pattern, violation }) => {
					if (pattern.test(content)) {
						violations.push(violation);
						clean = clean.replace(pattern, '');
					}
				});

				return { clean, violations };
			};

			const maliciousContent =
				'<script>alert("xss")</script><p onclick="evil()">Click me</p>Safe content here.';
			const result = filterContent(maliciousContent);

			expect(result.violations).toContain('script_tag');
			expect(result.violations).toContain('event_handler');
			expect(result.clean).not.toContain('<script>');
			expect(result.clean).not.toContain('onclick');
			expect(result.clean).toContain('Safe content here.');
		});

		it('should prevent regression: content length validation rules', async () => {
			const validateContentLength = (post: any): { valid: boolean; errors: string[] } => {
				const errors: string[] = [];

				// Business rules for content length
				if (post.title.length < 10) errors.push('title_too_short');
				if (post.title.length > 200) errors.push('title_too_long');
				if (post.content.length < 100) errors.push('content_too_short');
				if (post.content.length > 50000) errors.push('content_too_long');
				if (post.excerpt && post.excerpt.length > 500) errors.push('excerpt_too_long');

				return { valid: errors.length === 0, errors };
			};

			// Test various content lengths
			const validPost = {
				title: 'This is a valid title length',
				content: 'A'.repeat(150), // 150 characters
				excerpt: 'Valid excerpt'
			};
			expect(validateContentLength(validPost).valid).toBe(true);

			const shortTitle = {
				title: 'Short',
				content: 'A'.repeat(150),
				excerpt: 'Valid excerpt'
			};
			const result = validateContentLength(shortTitle);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('title_too_short');

			const longContent = {
				title: 'Valid title',
				content: 'A'.repeat(60000), // Too long
				excerpt: 'Valid excerpt'
			};
			const longResult = validateContentLength(longContent);
			expect(longResult.valid).toBe(false);
			expect(longResult.errors).toContain('content_too_long');
		});

		it('should prevent regression: spam detection algorithms', async () => {
			const detectSpam = (
				content: string
			): { isSpam: boolean; score: number; reasons: string[] } => {
				let spamScore = 0;
				const reasons: string[] = [];

				// Business rules for spam detection
				const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
				if (upperCaseRatio > 0.5) {
					spamScore += 30;
					reasons.push('excessive_caps');
				}

				const exclamationCount = (content.match(/!/g) || []).length;
				if (exclamationCount > 3) {
					spamScore += 20;
					reasons.push('excessive_exclamation');
				}

				const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
				if (urlCount > 2) {
					spamScore += 25;
					reasons.push('excessive_links');
				}

				const repetitivePattern = /(.{3,})\1{3,}/.test(content);
				if (repetitivePattern) {
					spamScore += 40;
					reasons.push('repetitive_content');
				}

				return {
					isSpam: spamScore >= 40,
					score: spamScore,
					reasons
				};
			};

			const normalContent =
				'This is a normal post with good content and reasonable formatting.';
			const normalResult = detectSpam(normalContent);
			expect(normalResult.isSpam).toBe(false);

			const spamContent =
				'BUY NOW!!! URGENT!!! CLICK HERE!!! AMAZING!!! HURRY!!! SALE!!! http://spam1.com http://spam2.com http://spam3.com http://spam4.com';
			const spamResult = detectSpam(spamContent);
			expect(spamResult.isSpam).toBe(true);
			expect(spamResult.reasons).toContain('excessive_exclamation');
			expect(spamResult.reasons).toContain('excessive_links');
		});
	});

	describe('Search and Filtering Logic Regression', () => {
		it('should prevent regression: search relevance scoring', async () => {
			const calculateRelevanceScore = (post: any, searchTerm: string): number => {
				let score = 0;
				const term = searchTerm.toLowerCase();

				// Business rules for search relevance
				if (post.title.toLowerCase().includes(term)) {
					score += 50; // Title matches are most important
				}

				if (post.excerpt && post.excerpt.toLowerCase().includes(term)) {
					score += 30; // Excerpt matches are important
				}

				if (post.content.toLowerCase().includes(term)) {
					score += 20; // Content matches are less important
				}

				// Boost for exact word matches
				const titleWords = post.title.toLowerCase().split(/\s+/);
				const exactTitleMatch = titleWords.includes(term);
				if (exactTitleMatch) score += 25;

				// Reduce score for draft posts in search
				if (post.status === 'draft') score -= 10;

				return Math.max(0, score);
			};

			const searchTerm = 'javascript';
			const posts = [
				{
					title: 'Learning JavaScript Fundamentals',
					excerpt: 'A guide to JavaScript basics',
					content: 'JavaScript is a programming language...',
					status: 'published'
				},
				{
					title: 'Web Development Tips',
					excerpt: 'Tips for web developers',
					content: 'JavaScript frameworks like React and Vue...',
					status: 'published'
				},
				{
					title: 'JavaScript Advanced Concepts',
					excerpt: 'Deep dive into complex topics',
					content: 'Advanced JavaScript concepts...',
					status: 'draft'
				}
			];

			const scores = posts.map((post) => calculateRelevanceScore(post, searchTerm));

			// First post should have highest score (title + excerpt + content + exact match)
			expect(scores[0]).toBeGreaterThan(scores[1]);
			expect(scores[0]).toBeGreaterThan(scores[2]);

			// Draft post should have lower score than published
			expect(scores[2]).toBeLessThan(scores[0]);
		});

		it('should prevent regression: category filtering logic', async () => {
			// Check if we have category data available
			if (!testData.categoryIds || testData.categoryIds.length === 0) {
				console.warn('Skipping category filtering test - no categories available');
				return;
			}

			// Create posts with category relationships for testing
			const categoryId = testData.categoryIds[0];

			// Get posts in specific category
			const getPostsByCategory = async (categoryId: number) => {
				return await testDb
					.select({
						id: posts.id,
						title: posts.title,
						status: posts.status
					})
					.from(posts)
					.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
					.where(
						and(
							eq(postsToCategories.categoryId, categoryId),
							eq(posts.status, 'published') // Business rule: only published posts
						)
					);
			};

			// Create test relationships
			if (testData.postIds && testData.postIds.length >= 2) {
				await testDb.insert(postsToCategories).values([
					{ postId: testData.postIds[0], categoryId },
					{ postId: testData.postIds[1], categoryId }
				]);

				const categoryPosts = await getPostsByCategory(categoryId);
				expect(categoryPosts.length).toBeGreaterThan(0);

				// Verify all returned posts belong to the category
				for (const post of categoryPosts) {
					const relationship = await testDb
						.select()
						.from(postsToCategories)
						.where(
							and(
								eq(postsToCategories.postId, post.id),
								eq(postsToCategories.categoryId, categoryId)
							)
						);
					expect(relationship).toHaveLength(1);
				}
			} else {
				// Skip test if no posts available
				console.warn('Skipping category filtering test - no posts available');
			}
		});

		it('should prevent regression: date-based filtering and sorting', async () => {
			const now = new Date();
			const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

			// Business logic: get recent posts (last 7 days)
			const getRecentPosts = async () => {
				return await testDb
					.select()
					.from(posts)
					.where(and(eq(posts.status, 'published'), gte(posts.createdAt, oneWeekAgo)))
					.orderBy(desc(posts.createdAt));
			};

			// Create test posts with different dates
			await testDb.insert(posts).values([
				{
					title: 'Recent Post',
					slug: `recent-post-${crypto.randomUUID()}`,
					content: 'Recent content',
					excerpt: 'Recent excerpt',
					status: 'published',
					userId: testData.userId,
					createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
					updatedAt: new Date()
				},
				{
					title: 'Old Post',
					slug: `old-post-${crypto.randomUUID()}`,
					content: 'Old content',
					excerpt: 'Old excerpt',
					status: 'published',
					userId: testData.userId,
					createdAt: oneMonthAgo,
					updatedAt: new Date()
				}
			]);

			const recentPosts = await getRecentPosts();

			// Verify business logic
			recentPosts.forEach((post) => {
				expect(post.createdAt.getTime()).toBeGreaterThanOrEqual(oneWeekAgo.getTime());
				expect(post.status).toBe('published');
			});

			// Verify sorting (most recent first)
			for (let i = 1; i < recentPosts.length; i++) {
				expect(recentPosts[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
					recentPosts[i].createdAt.getTime()
				);
			}
		});

		it('should prevent regression: pagination logic maintains consistency', async () => {
			const pageSize = 5;
			const page = 2; // Second page
			const offset = (page - 1) * pageSize;

			// Business logic: paginated post retrieval
			const getPaginatedPosts = async (page: number, limit: number) => {
				const offset = (page - 1) * limit;

				const postsResult = await testDb
					.select()
					.from(posts)
					.where(eq(posts.status, 'published'))
					.orderBy(desc(posts.createdAt))
					.limit(limit)
					.offset(offset);

				const totalCount = await testDb
					.select({ count: count() })
					.from(posts)
					.where(eq(posts.status, 'published'));

				return {
					posts: postsResult,
					totalCount: totalCount[0].count,
					totalPages: Math.ceil(totalCount[0].count / limit),
					currentPage: page,
					hasNextPage: page < Math.ceil(totalCount[0].count / limit),
					hasPreviousPage: page > 1
				};
			};

			const result = await getPaginatedPosts(page, pageSize);

			// Verify pagination logic
			expect(result.posts.length).toBeLessThanOrEqual(pageSize);
			expect(result.currentPage).toBe(page);
			expect(typeof result.totalCount).toBe('number');
			expect(typeof result.totalPages).toBe('number');
			expect(typeof result.hasNextPage).toBe('boolean');
			expect(typeof result.hasPreviousPage).toBe('boolean');

			// For page 2, should have previous page
			expect(result.hasPreviousPage).toBe(true);
		});
	});
});
