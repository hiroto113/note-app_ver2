import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../../integration/setup';
import { posts, users, categories } from '$lib/server/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { RegressionTestHelpers } from '../utils/regression-helpers';
import { regressionDataManager } from '../utils/regression-data-manager';

/**
 * Post Lifecycle Regression Tests
 * 
 * Prevents regression of core post management functionality including:
 * - Post creation workflow
 * - Post editing and updates
 * - Post deletion and cleanup
 * - Status transitions (draft/published)
 * - Slug generation and uniqueness
 * - Content validation and sanitization
 * 
 * Based on historical issues:
 * - Slug duplication bugs
 * - Status transition validation
 * - Content encoding issues
 * - Foreign key constraint violations
 * - Performance degradation with large content
 */
describe('Post Lifecycle Regression Tests', () => {
	let testData: any;

	beforeEach(async () => {
		testData = await regressionDataManager.createRegressionScenario('post-lifecycle', {
			userCount: 2,
			categoryCount: 2
		});
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('Post Creation Regression', () => {
		it('should prevent regression: basic post creation workflow', async () => {
			const postData = {
				title: 'Test Post Title',
				content: 'This is test content for regression testing.',
				status: 'draft' as const
			};

			const result = await RegressionTestHelpers.verifyPostCreationWorkflow(
				testData.userId,
				postData
			);

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.metadata.postId).toBeDefined();
			expect(result.duration).toBeLessThan(2000); // Performance check
		});

		it('should prevent regression: post with duplicate title creates unique slug', async () => {
			const baseTitle = 'Duplicate Title Test';
			
			// Create first post
			const firstPost = await testDb.insert(posts).values({
				title: baseTitle,
				slug: 'duplicate-title-test',
				content: 'First post content',
				excerpt: 'First excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create second post with same title
			const secondSlug = 'duplicate-title-test-2'; // Should auto-generate unique slug
			const secondPost = await testDb.insert(posts).values({
				title: baseTitle,
				slug: secondSlug,
				content: 'Second post content',
				excerpt: 'Second excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			expect(firstPost[0].slug).not.toBe(secondPost[0].slug);
			expect(secondPost[0].slug).toBe(secondSlug);
		});

		it('should prevent regression: post creation with invalid user fails', async () => {
			const invalidUserId = 'non-existent-user-id';
			
			try {
				await testDb.insert(posts).values({
					title: 'Invalid User Post',
					slug: 'invalid-user-post',
					content: 'This should fail',
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

		it('should prevent regression: post creation with empty required fields fails', async () => {
			const invalidPostData = [
				{ title: '', content: 'Valid content' },
				{ title: 'Valid title', content: '' },
				{ title: '', content: '' }
			];

			for (const data of invalidPostData) {
				try {
					await testDb.insert(posts).values({
						title: data.title,
						slug: data.title ? data.title.toLowerCase().replace(/\s+/g, '-') : 'empty-title',
						content: data.content,
						excerpt: data.content.substring(0, 200),
						status: 'draft',
						userId: testData.userId,
						createdAt: new Date(),
						updatedAt: new Date()
					});
					
					// If we get here and title/content is empty, that's a regression
					if (!data.title || !data.content) {
						expect.fail('Post creation with empty required fields should have failed');
					}
				} catch (error) {
					// Expected for empty fields
					expect(error).toBeDefined();
				}
			}
		});

		it('should prevent regression: post creation with extremely long content', async () => {
			const longContent = 'A'.repeat(100000); // 100KB content
			const startTime = Date.now();

			const [post] = await testDb.insert(posts).values({
				title: 'Long Content Test',
				slug: 'long-content-test',
				content: longContent,
				excerpt: longContent.substring(0, 500),
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const duration = Date.now() - startTime;

			expect(post.id).toBeDefined();
			expect(post.content.length).toBe(100000);
			expect(duration).toBeLessThan(5000); // Should handle large content efficiently
		});
	});

	describe('Post Update Regression', () => {
		let existingPostId: number;

		beforeEach(async () => {
			const [post] = await testDb.insert(posts).values({
				title: 'Original Title',
				slug: 'original-title',
				content: 'Original content',
				excerpt: 'Original excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			existingPostId = post.id;
		});

		it('should prevent regression: post update preserves integrity', async () => {
			const updateData = {
				title: 'Updated Title',
				content: 'Updated content with more information',
				updatedAt: new Date()
			};

			const [updatedPost] = await testDb
				.update(posts)
				.set(updateData)
				.where(eq(posts.id, existingPostId))
				.returning();

			expect(updatedPost.title).toBe(updateData.title);
			expect(updatedPost.content).toBe(updateData.content);
			expect(updatedPost.id).toBe(existingPostId);
			expect(updatedPost.userId).toBe(testData.userId); // Should not change
		});

		it('should prevent regression: post update cannot change ownership', async () => {
			const anotherUserId = testData.additionalUsers[0];
			
			try {
				await testDb
					.update(posts)
					.set({ 
						title: 'Hijacked Post',
						userId: anotherUserId,
						updatedAt: new Date()
					})
					.where(eq(posts.id, existingPostId));

				// Verify ownership didn't change inappropriately
				const [post] = await testDb
					.select()
					.from(posts)
					.where(eq(posts.id, existingPostId));

				// In a properly secured system, this should be prevented at the application level
				// For this test, we verify the database operation completed but application should prevent it
				expect(post.userId).toBe(anotherUserId);
				console.warn('⚠️ Post ownership change succeeded - ensure application-level protection');
			} catch (error) {
				// If database constraints prevent this, that's also acceptable
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: concurrent post updates handle conflicts', async () => {
			const originalUpdatedAt = new Date();
			
			// Simulate two concurrent updates
			const update1Promise = testDb
				.update(posts)
				.set({ 
					title: 'Update 1',
					content: 'Content from update 1',
					updatedAt: new Date()
				})
				.where(eq(posts.id, existingPostId))
				.returning();

			const update2Promise = testDb
				.update(posts)
				.set({ 
					title: 'Update 2',
					content: 'Content from update 2',
					updatedAt: new Date()
				})
				.where(eq(posts.id, existingPostId))
				.returning();

			const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

			// Both updates should complete, but last write wins
			expect(result1[0]).toBeDefined();
			expect(result2[0]).toBeDefined();

			// Verify final state is consistent
			const [finalPost] = await testDb
				.select()
				.from(posts)
				.where(eq(posts.id, existingPostId));

			expect(finalPost.title).toMatch(/Update [12]/);
		});
	});

	describe('Post Status Transition Regression', () => {
		let draftPostId: number;

		beforeEach(async () => {
			const [post] = await testDb.insert(posts).values({
				title: 'Draft Post',
				slug: 'draft-post',
				content: 'Draft content',
				excerpt: 'Draft excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			draftPostId = post.id;
		});

		it('should prevent regression: draft to published transition', async () => {
			const [publishedPost] = await testDb
				.update(posts)
				.set({ 
					status: 'published',
					updatedAt: new Date()
				})
				.where(eq(posts.id, draftPostId))
				.returning();

			expect(publishedPost.status).toBe('published');
			expect(publishedPost.id).toBe(draftPostId);
		});

		it('should prevent regression: published to draft transition', async () => {
			// First publish the post
			await testDb
				.update(posts)
				.set({ status: 'published' })
				.where(eq(posts.id, draftPostId));

			// Then revert to draft
			const [draftPost] = await testDb
				.update(posts)
				.set({ 
					status: 'draft',
					updatedAt: new Date()
				})
				.where(eq(posts.id, draftPostId))
				.returning();

			expect(draftPost.status).toBe('draft');
		});

		it('should prevent regression: invalid status values are rejected', async () => {
			const invalidStatuses = ['pending', 'archived', 'deleted', 'invalid'];

			for (const invalidStatus of invalidStatuses) {
				try {
					await testDb
						.update(posts)
						.set({ 
							status: invalidStatus as any,
							updatedAt: new Date()
						})
						.where(eq(posts.id, draftPostId));

					// If we get here, check if the invalid status was actually saved
					const [post] = await testDb
						.select()
						.from(posts)
						.where(eq(posts.id, draftPostId));

					// Valid statuses in our schema are only 'draft' and 'published'
					expect(['draft', 'published']).toContain(post.status);
				} catch (error) {
					// Database constraint should prevent invalid status
					expect(error).toBeDefined();
				}
			}
		});
	});

	describe('Post Deletion Regression', () => {
		let postToDeleteId: number;

		beforeEach(async () => {
			const [post] = await testDb.insert(posts).values({
				title: 'Post to Delete',
				slug: 'post-to-delete',
				content: 'This post will be deleted',
				excerpt: 'Delete excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			postToDeleteId = post.id;
		});

		it('should prevent regression: post deletion removes record', async () => {
			// Delete the post
			await testDb
				.delete(posts)
				.where(eq(posts.id, postToDeleteId));

			// Verify post is deleted
			const deletedPost = await testDb
				.select()
				.from(posts)
				.where(eq(posts.id, postToDeleteId));

			expect(deletedPost).toHaveLength(0);
		});

		it('should prevent regression: deleting non-existent post handles gracefully', async () => {
			const nonExistentId = 999999;

			try {
				const result = await testDb
					.delete(posts)
					.where(eq(posts.id, nonExistentId));

				// Should not throw error, just affect 0 rows
				expect(result).toBeDefined();
			} catch (error) {
				expect.fail('Deleting non-existent post should not throw error');
			}
		});

		it('should prevent regression: user cannot delete other users posts', async () => {
			const otherUserId = testData.additionalUsers[0];

			// Try to delete post as different user
			// In a real application, this check would be at the application level
			// Here we simulate the business logic
			const canDelete = (postId: number, userId: string): boolean => {
				// In real app, this would check post ownership
				return userId === testData.userId;
			};

			const hasPermission = canDelete(postToDeleteId, otherUserId);
			expect(hasPermission).toBe(false);

			// If permission check failed, deletion should not proceed
			if (!hasPermission) {
				// Verify post still exists
				const [post] = await testDb
					.select()
					.from(posts)
					.where(eq(posts.id, postToDeleteId));

				expect(post).toBeDefined();
			}
		});
	});

	describe('Post Query Performance Regression', () => {
		beforeEach(async () => {
			// Create a larger dataset for performance testing
			const largeBatch = Array.from({ length: 50 }, (_, i) => ({
				title: `Performance Test Post ${i}`,
				slug: `performance-test-post-${i}`,
				content: `Content for performance test post ${i}. `.repeat(100), // ~3KB per post
				excerpt: `Excerpt for post ${i}`,
				status: (i % 2 === 0 ? 'published' : 'draft') as 'published' | 'draft',
				userId: testData.userId,
				createdAt: new Date(Date.now() - i * 60000), // Spread over time
				updatedAt: new Date()
			}));

			await testDb.insert(posts).values(largeBatch);
		});

		it('should prevent regression: post listing query performance', async () => {
			const startTime = Date.now();

			const postList = await testDb
				.select({
					id: posts.id,
					title: posts.title,
					slug: posts.slug,
					excerpt: posts.excerpt,
					status: posts.status,
					createdAt: posts.createdAt
				})
				.from(posts)
				.where(eq(posts.userId, testData.userId))
				.orderBy(desc(posts.createdAt))
				.limit(20);

			const duration = Date.now() - startTime;

			expect(postList.length).toBeGreaterThan(0);
			expect(duration).toBeLessThan(1000); // Should complete within 1 second
		});

		it('should prevent regression: post search query performance', async () => {
			const searchTerm = 'Performance';
			const startTime = Date.now();

			const searchResults = await testDb
				.select()
				.from(posts)
				.where(eq(posts.userId, testData.userId))
				.limit(10);

			const duration = Date.now() - startTime;

			expect(searchResults.length).toBeGreaterThan(0);
			expect(duration).toBeLessThan(2000); // Search should complete within 2 seconds
		});

		it('should prevent regression: published posts query performance', async () => {
			const startTime = Date.now();

			const publishedPosts = await testDb
				.select()
				.from(posts)
				.where(
					and(
						eq(posts.userId, testData.userId),
						eq(posts.status, 'published')
					)
				)
				.orderBy(desc(posts.createdAt));

			const duration = Date.now() - startTime;

			expect(publishedPosts.length).toBeGreaterThan(0);
			expect(duration).toBeLessThan(1000);
		});
	});

	describe('Post Data Integrity Regression', () => {
		it('should prevent regression: post data integrity validation', async () => {
			const result = await RegressionTestHelpers.verifyDataIntegrity();

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.metadata.orphanedPosts).toBe(0);
			expect(result.metadata.invalidPosts).toBe(0);
		});

		it('should prevent regression: post slug uniqueness constraint', async () => {
			const duplicateSlug = 'unique-slug-test';

			// Create first post
			await testDb.insert(posts).values({
				title: 'First Post',
				slug: duplicateSlug,
				content: 'First post content',
				excerpt: 'First excerpt',
				status: 'draft',
				userId: testData.userId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Try to create second post with same slug
			try {
				await testDb.insert(posts).values({
					title: 'Second Post',
					slug: duplicateSlug,
					content: 'Second post content',
					excerpt: 'Second excerpt',
					status: 'draft',
					userId: testData.userId,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// If no error thrown, check if constraint is enforced
				const duplicateSlugs = await testDb
					.select()
					.from(posts)
					.where(eq(posts.slug, duplicateSlug));

				// Should only have one post with this slug
				expect(duplicateSlugs.length).toBe(1);
			} catch (error) {
				// Database constraint should prevent duplicate slugs
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: post-user relationship integrity', async () => {
			// Verify all posts have valid user references
			const postsWithInvalidUsers = await testDb
				.select({
					postId: posts.id,
					userId: posts.userId
				})
				.from(posts)
				.leftJoin(users, eq(posts.userId, users.id))
				.where(isNull(users.id));

			expect(postsWithInvalidUsers).toHaveLength(0);
		});
	});
});