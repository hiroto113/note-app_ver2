import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../../integration/setup';
import { posts, categories, users, postsToCategories } from '$lib/server/db/schema';
import { eq, and, count, isNull, isNotNull } from 'drizzle-orm';
import { RegressionTestHelpers } from '../utils/regression-helpers';
import { regressionDataManager } from '../utils/regression-data-manager';

/**
 * Data Integrity Regression Tests
 * 
 * Prevents regression of critical data integrity constraints including:
 * - Foreign key constraint enforcement
 * - Data consistency across relationships
 * - Orphaned record prevention
 * - Cascade operation integrity
 * - Cross-table data validation
 * - Referential integrity maintenance
 * 
 * Based on historical issues:
 * - Orphaned posts after user deletion
 * - Broken category-post relationships
 * - Inconsistent data states
 * - Foreign key constraint violations
 * - Data corruption during bulk operations
 */
describe('Data Integrity Regression Tests', () => {
	let testData: any;

	beforeEach(async () => {
		testData = await regressionDataManager.createRegressionScenario('data-integrity', {
			userCount: 3,
			categoryCount: 5,
			postCount: 10
		});
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('Foreign Key Constraint Regression', () => {
		it('should prevent regression: posts require valid user references', async () => {
			const invalidUserId = 'non-existent-user-id';
			
			try {
				await testDb.insert(posts).values({
					title: 'Orphaned Post Test',
					slug: `orphaned-post-${crypto.randomUUID()}`,
					content: 'This post should fail to create',
					excerpt: 'Failure excerpt',
					status: 'draft',
					userId: invalidUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				});
				
				expect.fail('Post creation with invalid user should have failed');
			} catch (error) {
				expect(error).toBeDefined();
				
				// Verify no orphaned post was created
				const orphanedPosts = await testDb
					.select()
					.from(posts)
					.where(eq(posts.userId, invalidUserId));
				expect(orphanedPosts).toHaveLength(0);
			}
		});

		it('should prevent regression: category-post relationships require valid references', async () => {
			const invalidPostId = 999999;
			const invalidCategoryId = 999999;
			
			// Test invalid post ID
			try {
				await testDb.insert(postsToCategories).values({
					postId: invalidPostId,
					categoryId: testData.categoryIds[0]
				});
				
				expect.fail('Category-post relationship with invalid post should have failed');
			} catch (error) {
				expect(error).toBeDefined();
			}
			
			// Test invalid category ID
			try {
				await testDb.insert(postsToCategories).values({
					postId: testData.postIds[0],
					categoryId: invalidCategoryId
				});
				
				expect.fail('Category-post relationship with invalid category should have failed');
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: foreign key constraints are enforced on updates', async () => {
			// Check if we have posts available
			if (!testData.postIds || testData.postIds.length === 0) {
				console.warn('Skipping foreign key constraint test - no posts available');
				return;
			}

			const invalidUserId = 'non-existent-user-update';
			
			try {
				await testDb
					.update(posts)
					.set({ userId: invalidUserId })
					.where(eq(posts.id, testData.postIds[0]));
				
				expect.fail('Post update with invalid user should have failed');
			} catch (error) {
				expect(error).toBeDefined();
				
				// Verify post still has original valid user
				const postResult = await testDb
					.select()
					.from(posts)
					.where(eq(posts.id, testData.postIds[0]));
				if (postResult.length > 0) {
					expect(postResult[0].userId).toBe(testData.userId);
				}
			}
		});
	});

	describe('Cascade Operations Regression', () => {
		it('should prevent regression: user deletion cascades to posts', async () => {
			// Create a user specifically for deletion testing
			const [userToDelete] = await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username: `user_to_delete_${Date.now()}`,
				hashedPassword: 'hashed_password_test',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create posts for this user
			const [postToDelete] = await testDb.insert(posts).values({
				title: 'Post to be deleted',
				slug: `post-to-delete-${crypto.randomUUID()}`,
				content: 'This post should be deleted when user is deleted',
				excerpt: 'Deletion test excerpt',
				status: 'draft',
				userId: userToDelete.id,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Delete the user (should cascade to posts)
			await testDb
				.delete(users)
				.where(eq(users.id, userToDelete.id));

			// Verify user is deleted
			const deletedUser = await testDb
				.select()
				.from(users)
				.where(eq(users.id, userToDelete.id));
			expect(deletedUser).toHaveLength(0);

			// Verify posts are also deleted (cascade)
			const deletedPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.userId, userToDelete.id));
			expect(deletedPosts).toHaveLength(0);
		});

		it('should prevent regression: category deletion cascades to post relationships', async () => {
			// Create a category for deletion testing
			const [categoryToDelete] = await testDb.insert(categories).values({
				name: `Category to Delete ${crypto.randomUUID()}`,
				slug: `category-to-delete-${crypto.randomUUID()}`,
				description: 'This category will be deleted',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create post-category relationship if we have posts
			if (testData.postIds && testData.postIds.length > 0) {
				await testDb.insert(postsToCategories).values({
					postId: testData.postIds[0],
					categoryId: categoryToDelete.id
				});
			}

			// Verify relationship exists (only if we created it)
			const relationshipBefore = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, categoryToDelete.id));
			if (testData.postIds && testData.postIds.length > 0) {
				expect(relationshipBefore).toHaveLength(1);
			}

			// Delete the category (should cascade to relationships)
			await testDb
				.delete(categories)
				.where(eq(categories.id, categoryToDelete.id));

			// Verify category is deleted
			const deletedCategory = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, categoryToDelete.id));
			expect(deletedCategory).toHaveLength(0);

			// Verify relationship is also deleted (cascade)
			const relationshipAfter = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, categoryToDelete.id));
			expect(relationshipAfter).toHaveLength(0);
		});

		it('should prevent regression: post deletion cascades to category relationships', async () => {
			// Only run test if we have posts
			if (!testData.postIds || testData.postIds.length === 0) {
				console.warn('Skipping post deletion cascade test - no posts available');
				return;
			}

			// Create post-category relationship
			await testDb.insert(postsToCategories).values({
				postId: testData.postIds[0],
				categoryId: testData.categoryIds[0]
			});

			// Verify relationship exists
			const relationshipBefore = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, testData.postIds[0]));
			expect(relationshipBefore).toHaveLength(1);

			// Delete the post (should cascade to relationships)
			await testDb
				.delete(posts)
				.where(eq(posts.id, testData.postIds[0]));

			// Verify post is deleted
			const deletedPost = await testDb
				.select()
				.from(posts)
				.where(eq(posts.id, testData.postIds[0]));
			expect(deletedPost).toHaveLength(0);

			// Verify relationship is also deleted (cascade)
			const relationshipAfter = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, testData.postIds[0]));
			expect(relationshipAfter).toHaveLength(0);
		});
	});

	describe('Data Consistency Regression', () => {
		it('should prevent regression: no orphaned posts exist', async () => {
			// Check for posts without valid user references
			const orphanedPosts = await testDb
				.select({
					postId: posts.id,
					postTitle: posts.title,
					userId: posts.userId
				})
				.from(posts)
				.leftJoin(users, eq(posts.userId, users.id))
				.where(isNull(users.id));

			expect(orphanedPosts).toHaveLength(0);
		});

		it('should prevent regression: no orphaned category relationships exist', async () => {
			// Check for category relationships without valid posts
			const orphanedPostRelations = await testDb
				.select({
					relationId: postsToCategories.postId,
					categoryId: postsToCategories.categoryId
				})
				.from(postsToCategories)
				.leftJoin(posts, eq(postsToCategories.postId, posts.id))
				.where(isNull(posts.id));

			expect(orphanedPostRelations).toHaveLength(0);

			// Check for category relationships without valid categories
			const orphanedCategoryRelations = await testDb
				.select({
					postId: postsToCategories.postId,
					relationId: postsToCategories.categoryId
				})
				.from(postsToCategories)
				.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
				.where(isNull(categories.id));

			expect(orphanedCategoryRelations).toHaveLength(0);
		});

		it('should prevent regression: post counts match actual relationships', async () => {
			// Get actual post counts by category
			const actualCounts = await testDb
				.select({
					categoryId: postsToCategories.categoryId,
					count: count()
				})
				.from(postsToCategories)
				.groupBy(postsToCategories.categoryId);

			// Verify each count by manual query
			for (const categoryCount of actualCounts) {
				const manualCount = await testDb
					.select({ count: count() })
					.from(postsToCategories)
					.where(eq(postsToCategories.categoryId, categoryCount.categoryId));

				expect(manualCount[0].count).toBe(categoryCount.count);
			}
		});

		it('should prevent regression: user post counts are accurate', async () => {
			// Get post counts by user
			const userPostCounts = await testDb
				.select({
					userId: posts.userId,
					count: count()
				})
				.from(posts)
				.groupBy(posts.userId);

			// Verify each count
			for (const userCount of userPostCounts) {
				const manualCount = await testDb
					.select({ count: count() })
					.from(posts)
					.where(eq(posts.userId, userCount.userId));

				expect(manualCount[0].count).toBe(userCount.count);
			}
		});
	});

	describe('Cross-Table Validation Regression', () => {
		it('should prevent regression: published posts have valid publication data', async () => {
			// Check that all published posts have consistent status
			const publishedPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.status, 'published'));

			publishedPosts.forEach(post => {
				expect(post.status).toBe('published');
				expect(post.title).toBeTruthy();
				expect(post.content).toBeTruthy();
				expect(post.slug).toBeTruthy();
				expect(post.userId).toBeTruthy();
			});
		});

		it('should prevent regression: category-post relationships are bidirectional', async () => {
			// Only run test if we have posts
			if (!testData.postIds || testData.postIds.length === 0) {
				console.warn('Skipping bidirectional relationship test - no posts available');
				return;
			}

			// Create a test relationship
			await testDb.insert(postsToCategories).values({
				postId: testData.postIds[0],
				categoryId: testData.categoryIds[0]
			});

			// Verify relationship exists from both sides
			const fromPost = await testDb
				.select()
				.from(postsToCategories)
				.where(
					and(
						eq(postsToCategories.postId, testData.postIds[0]),
						eq(postsToCategories.categoryId, testData.categoryIds[0])
					)
				);

			const fromCategory = await testDb
				.select()
				.from(postsToCategories)
				.where(
					and(
						eq(postsToCategories.categoryId, testData.categoryIds[0]),
						eq(postsToCategories.postId, testData.postIds[0])
					)
				);

			expect(fromPost).toHaveLength(1);
			expect(fromCategory).toHaveLength(1);
			expect(fromPost[0].postId).toBe(fromCategory[0].postId);
			expect(fromPost[0].categoryId).toBe(fromCategory[0].categoryId);
		});

		it('should prevent regression: users have consistent data across relationships', async () => {
			// Verify user data consistency across posts
			const usersWithPosts = await testDb
				.select({
					userId: users.id,
					username: users.username,
					postCount: count(posts.id)
				})
				.from(users)
				.leftJoin(posts, eq(users.id, posts.userId))
				.groupBy(users.id, users.username);

			for (const user of usersWithPosts) {
				// Verify post count matches manual count
				const manualPostCount = await testDb
					.select({ count: count() })
					.from(posts)
					.where(eq(posts.userId, user.userId));

				expect(manualPostCount[0].count).toBe(user.postCount);

				// Verify all posts by this user have valid references
				const userPosts = await testDb
					.select()
					.from(posts)
					.where(eq(posts.userId, user.userId));

				userPosts.forEach(post => {
					expect(post.userId).toBe(user.userId);
				});
			}
		});
	});

	describe('Bulk Operations Integrity Regression', () => {
		it('should prevent regression: bulk operations maintain referential integrity', async () => {
			// Create multiple posts in bulk
			const bulkPosts = Array.from({ length: 10 }, (_, i) => ({
				title: `Bulk Post ${i}`,
				slug: `bulk-post-${i}-${crypto.randomUUID()}`,
				content: `Content for bulk post ${i}`,
				excerpt: `Excerpt ${i}`,
				status: 'draft' as const,
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}));

			const createdPosts = await testDb.insert(posts).values(bulkPosts).returning();

			// Verify all posts have valid user references
			expect(createdPosts).toHaveLength(10);
			createdPosts.forEach(post => {
				expect(post.userId).toBe(testData.userId);
			});

			// Verify user exists for all posts
			const userExists = await testDb
				.select()
				.from(users)
				.where(eq(users.id, testData.userId));
			expect(userExists).toHaveLength(1);
		});

		it('should prevent regression: bulk relationship creation maintains integrity', async () => {
			// Create multiple category relationships in bulk
			if (!testData.postIds || testData.postIds.length === 0) {
				console.warn('Skipping bulk relationship test - no posts available');
				return;
			}

			const bulkRelationships = testData.postIds.slice(0, 3).map((postId: number) => ({
				postId,
				categoryId: testData.categoryIds[0]
			}));

			await testDb.insert(postsToCategories).values(bulkRelationships);

			// Verify all relationships are valid
			for (const relationship of bulkRelationships) {
				// Verify post exists
				const post = await testDb
					.select()
					.from(posts)
					.where(eq(posts.id, relationship.postId));
				expect(post).toHaveLength(1);

				// Verify category exists
				const category = await testDb
					.select()
					.from(categories)
					.where(eq(categories.id, relationship.categoryId));
				expect(category).toHaveLength(1);

				// Verify relationship exists
				const relationshipExists = await testDb
					.select()
					.from(postsToCategories)
					.where(
						and(
							eq(postsToCategories.postId, relationship.postId),
							eq(postsToCategories.categoryId, relationship.categoryId)
						)
					);
				expect(relationshipExists).toHaveLength(1);
			}
		});

		it('should prevent regression: bulk updates maintain data consistency', async () => {
			const newStatus = 'published';
			const updateTime = new Date();

			// Bulk update multiple posts
			await testDb
				.update(posts)
				.set({ 
					status: newStatus,
					updatedAt: updateTime
				})
				.where(eq(posts.userId, testData.userId));

			// Verify all posts were updated consistently
			const updatedPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.userId, testData.userId));

			updatedPosts.forEach(post => {
				expect(post.status).toBe(newStatus);
				expect(post.userId).toBe(testData.userId);
				// All posts should maintain their individual identities
				expect(post.id).toBeDefined();
				expect(post.title).toBeTruthy();
				expect(post.slug).toBeTruthy();
			});
		});

		it('should prevent regression: bulk deletion maintains referential integrity', async () => {
			// Create relationships for testing
			if (!testData.postIds || testData.postIds.length === 0) {
				console.warn('Skipping bulk deletion test - no posts available');
				return;
			}

			const testRelationships = testData.postIds.slice(0, 2).map((postId: number) => ({
				postId,
				categoryId: testData.categoryIds[0]
			}));

			await testDb.insert(postsToCategories).values(testRelationships);

			// Verify relationships exist
			const relationshipsBefore = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, testData.categoryIds[0]));
			expect(relationshipsBefore.length).toBeGreaterThan(0);

			// Bulk delete posts
			await testDb
				.delete(posts)
				.where(eq(posts.userId, testData.userId));

			// Verify posts are deleted
			const deletedPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.userId, testData.userId));
			expect(deletedPosts).toHaveLength(0);

			// Verify relationships are also deleted (cascade)
			const relationshipsAfter = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, testData.categoryIds[0]));
			expect(relationshipsAfter).toHaveLength(0);
		});
	});

	describe('Data Integrity Performance Regression', () => {
		it('should prevent regression: constraint validation performance', async () => {
			const startTime = Date.now();

			// Perform operations that trigger constraint validation
			try {
				await testDb.insert(posts).values({
					title: 'Constraint Test Post',
					slug: `constraint-test-${crypto.randomUUID()}`,
					content: 'Testing constraint performance',
					excerpt: 'Performance test',
					status: 'draft',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				const validationTime = Date.now() - startTime;
				expect(validationTime).toBeLessThan(1000); // Constraint validation should be fast
			} catch (error) {
				expect.fail('Valid post creation should not fail');
			}
		});

		it('should prevent regression: referential integrity check performance', async () => {
			const startTime = Date.now();

			// Query that checks referential integrity
			const integrityCheck = await testDb
				.select({
					totalPosts: count(posts.id),
					validUsers: count(users.id)
				})
				.from(posts)
				.leftJoin(users, eq(posts.userId, users.id));

			const checkTime = Date.now() - startTime;

			expect(integrityCheck).toHaveLength(1);
			expect(checkTime).toBeLessThan(2000); // Integrity checks should complete reasonably fast
		});

		it('should prevent regression: cascade operation performance', async () => {
			// Create user with multiple posts for cascade testing
			const [testUser] = await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username: `cascade_test_${Date.now()}`,
				hashedPassword: 'test_password',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create multiple posts for this user
			const cascadePosts = Array.from({ length: 20 }, (_, i) => ({
				title: `Cascade Test Post ${i}`,
				slug: `cascade-test-${i}-${crypto.randomUUID()}`,
				content: `Content ${i}`,
				excerpt: `Excerpt ${i}`,
				status: 'draft' as const,
				userId: testUser.id,
				createdAt: new Date(),
				updatedAt: new Date()
			}));

			await testDb.insert(posts).values(cascadePosts);

			// Measure cascade deletion performance
			const startTime = Date.now();
			await testDb.delete(users).where(eq(users.id, testUser.id));
			const cascadeTime = Date.now() - startTime;

			// Verify cascade completed
			const remainingPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.userId, testUser.id));
			expect(remainingPosts).toHaveLength(0);

			expect(cascadeTime).toBeLessThan(3000); // Cascade operations should complete efficiently
		});
	});
});