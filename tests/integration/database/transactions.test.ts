import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { posts, categories, postsToCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { testIsolation } from '../utils/test-isolation';

describe('Database Transactions', () => {
	let testUserId: string;

	beforeEach(async () => {
		// Database tables are already created by setup.ts
		// Clean database and create test user
		testUserId = await testIsolation.createTestUser();
	});

	afterEach(async () => {
		// Clean up is handled automatically by setup.ts beforeEach
		// No additional cleanup needed here
	});

	describe('Transaction Rollback', () => {
		it('should rollback entire transaction on error', async () => {
			const initialPosts = await testDb.select().from(posts);
			expect(initialPosts).toHaveLength(0);

			try {
				await testDb.transaction(async (tx) => {
					// Insert first post successfully
					await tx.insert(posts).values({
						title: 'Post 1',
						slug: 'post-1',
						content: 'Content 1',
						excerpt: 'Excerpt 1',
						status: 'published',
						publishedAt: new Date(),
						userId: testUserId,
						createdAt: new Date(),
						updatedAt: new Date()
					});

					// This should fail due to duplicate slug
					await tx.insert(posts).values({
						title: 'Post 2',
						slug: 'post-1', // Duplicate slug
						content: 'Content 2',
						excerpt: 'Excerpt 2',
						status: 'published',
						publishedAt: new Date(),
						userId: testUserId,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				});
			} catch {
				// Transaction should have rolled back
			}

			// Verify no posts were inserted
			const finalPosts = await testDb.select().from(posts);
			expect(finalPosts).toHaveLength(0);
		});

		it('should rollback complex multi-table operations', async () => {
			try {
				await testDb.transaction(async (tx) => {
					// Create category
					const [category] = await tx
						.insert(categories)
						.values({
							name: 'Test Category',
							slug: 'test-category',
							createdAt: new Date(),
							updatedAt: new Date()
						})
						.returning();

					// Create post
					const [post] = await tx
						.insert(posts)
						.values({
							title: 'Test Post',
							slug: 'test-post',
							content: 'Content',
							excerpt: 'Excerpt',
							status: 'published',
							publishedAt: new Date(),
							userId: testUserId,
							createdAt: new Date(),
							updatedAt: new Date()
						})
						.returning();

					// Create association
					await tx.insert(postsToCategories).values({
						postId: post.id,
						categoryId: category.id
					});

					// Force an error by trying to insert duplicate category
					await tx.insert(categories).values({
						name: 'Test Category', // Duplicate name
						slug: 'another-slug',
						createdAt: new Date(),
						updatedAt: new Date()
					});
				});
			} catch {
				// Expected to fail
			}

			// Verify nothing was committed
			const finalCategories = await testDb.select().from(categories);
			const finalPosts = await testDb.select().from(posts);
			const finalAssociations = await testDb.select().from(postsToCategories);

			expect(finalCategories).toHaveLength(0);
			expect(finalPosts).toHaveLength(0);
			expect(finalAssociations).toHaveLength(0);
		});
	});

	describe('Transaction Commit', () => {
		it('should commit successful transactions', async () => {
			await testDb.transaction(async (tx) => {
				// Create category
				const categoryResult = await tx
					.insert(categories)
					.values({
						name: 'Tech',
						slug: 'tech',
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();
				const category = categoryResult[0];

				// Create post
				const postResult = await tx
					.insert(posts)
					.values({
						title: 'Tech Post',
						slug: 'tech-post',
						content: 'Tech content',
						excerpt: 'Tech excerpt',
						status: 'published',
						publishedAt: new Date(),
						userId: testUserId,
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();
				const post = postResult[0];

				// Create association
				await tx.insert(postsToCategories).values({
					postId: post.id,
					categoryId: category.id
				});
			});

			// Verify all data was committed
			const categoriesResult = await testDb.select().from(categories);
			const postsResult = await testDb.select().from(posts);
			const associations = await testDb.select().from(postsToCategories);

			expect(categoriesResult).toHaveLength(1);
			expect(postsResult).toHaveLength(1);
			expect(associations).toHaveLength(1);
		});

		it('should handle nested data creation in transactions', async () => {
			let postId: number = 0;
			const categoryIds: number[] = [];

			await testDb.transaction(async (tx) => {
				// Create multiple categories
				const categoryNames = ['Frontend', 'Backend', 'Database'];
				for (const name of categoryNames) {
					const [cat] = await tx
						.insert(categories)
						.values({
							name,
							slug: name.toLowerCase(),
							createdAt: new Date(),
							updatedAt: new Date()
						})
						.returning();
					categoryIds.push(cat.id);
				}

				// Create post
				const [post] = await tx
					.insert(posts)
					.values({
						title: 'Full Stack Post',
						slug: 'full-stack-post',
						content: 'Full stack content',
						excerpt: 'Full stack excerpt',
						status: 'published',
						publishedAt: new Date(),
						userId: testUserId,
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();
				postId = post.id;

				// Associate with all categories
				const associations = categoryIds.map((categoryId) => ({
					postId: post.id,
					categoryId
				}));
				await tx.insert(postsToCategories).values(associations);
			});

			// Verify complete data structure
			const post = await testDb.select().from(posts).where(eq(posts.id, postId));
			const postCategories = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, postId));

			expect(post).toHaveLength(1);
			expect(postCategories).toHaveLength(3);
			expect(postCategories.map((pc) => pc.categoryId).sort()).toEqual(categoryIds.sort());
		});
	});

	describe('Transaction Isolation', () => {
		it.skip('should isolate concurrent transactions', async () => {
			// Create initial category
			const [initialCategory] = await testDb
				.insert(categories)
				.values({
					name: 'Initial',
					slug: 'initial',
					description: 'Initial description',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Simulate concurrent transactions
			const transaction1 = testDb.transaction(async (tx) => {
				// Read category
				const [cat] = await tx
					.select()
					.from(categories)
					.where(eq(categories.id, initialCategory.id));

				// Simulate some processing time
				await new Promise((resolve) => setTimeout(resolve, 50));

				// Update based on read value
				await tx
					.update(categories)
					.set({
						description: `${cat.description} - Updated by TX1`,
						updatedAt: new Date()
					})
					.where(eq(categories.id, initialCategory.id));
			});

			const transaction2 = testDb.transaction(async (tx) => {
				// Read category
				const [cat] = await tx
					.select()
					.from(categories)
					.where(eq(categories.id, initialCategory.id));

				// Simulate some processing time
				await new Promise((resolve) => setTimeout(resolve, 50));

				// Update based on read value
				await tx
					.update(categories)
					.set({
						description: `${cat.description} - Updated by TX2`,
						updatedAt: new Date()
					})
					.where(eq(categories.id, initialCategory.id));
			});

			// Run transactions concurrently
			await Promise.all([transaction1, transaction2]);

			// Check final state
			const [finalCategory] = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, initialCategory.id));

			// One transaction should have won
			expect(finalCategory.description).toMatch(/Updated by TX[12]$/);
		});
	});

	describe('Batch Operations in Transactions', () => {
		it.skip('should efficiently handle bulk inserts in transaction', async () => {
			const postCount = 100;
			const startTime = Date.now();

			await testDb.transaction(async (tx) => {
				// Create categories
				const [cat1] = await tx
					.insert(categories)
					.values({
						name: 'Bulk Category 1',
						slug: 'bulk-cat-1',
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();

				const [cat2] = await tx
					.insert(categories)
					.values({
						name: 'Bulk Category 2',
						slug: 'bulk-cat-2',
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();

				// Bulk insert posts
				const postsData = Array.from({ length: postCount }, (_, i) => ({
					title: `Bulk Post ${i}`,
					slug: `bulk-post-${i}`,
					content: `Content for post ${i}`,
					excerpt: `Excerpt ${i}`,
					status: 'published' as const,
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				}));

				const insertedPosts = await tx.insert(posts).values(postsData).returning();

				// Bulk insert associations
				const associations = [];
				for (const post of insertedPosts) {
					// Alternate between categories
					associations.push({
						postId: post.id,
						categoryId: post.id % 2 === 0 ? cat1.id : cat2.id
					});
				}

				await tx.insert(postsToCategories).values(associations);
			});

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Verify all data was inserted
			const allPosts = await testDb.select().from(posts);
			const allAssociations = await testDb.select().from(postsToCategories);

			expect(allPosts).toHaveLength(postCount);
			expect(allAssociations).toHaveLength(postCount);

			// Performance check - should complete reasonably fast
			expect(duration).toBeLessThan(5000); // Less than 5 seconds for 100 posts
		});

		it('should handle partial rollback scenarios', async () => {
			let successfulPosts = 0;

			try {
				await testDb.transaction(async (tx) => {
					// Insert some posts successfully
					for (let i = 0; i < 5; i++) {
						await tx.insert(posts).values({
							title: `Post ${i}`,
							slug: `post-${i}`,
							content: `Content ${i}`,
							excerpt: `Excerpt ${i}`,
							status: 'published',
							publishedAt: new Date(),
							userId: testUserId,
							createdAt: new Date(),
							updatedAt: new Date()
						});
						successfulPosts++;
					}

					// Force an error on the 6th post
					await tx.insert(posts).values({
						title: 'Post 5',
						slug: 'post-0', // Duplicate slug
						content: 'Content 5',
						excerpt: 'Excerpt 5',
						status: 'published',
						publishedAt: new Date(),
						userId: testUserId,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				});
			} catch {
				// Expected to fail
			}

			// Verify complete rollback despite partial success
			const finalPosts = await testDb.select().from(posts);
			expect(finalPosts).toHaveLength(0);
			expect(successfulPosts).toBe(5); // 5 were inserted before failure
		});
	});

	describe('Deadlock Prevention', () => {
		it('should handle potential deadlock scenarios', async () => {
			// Create initial data
			const [cat1] = await testDb
				.insert(categories)
				.values({
					name: 'Category A',
					slug: 'cat-a',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [cat2] = await testDb
				.insert(categories)
				.values({
					name: 'Category B',
					slug: 'cat-b',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Two transactions that could potentially deadlock
			const tx1 = testDb.transaction(async (tx) => {
				// TX1: Update cat1 first, then cat2
				await tx
					.update(categories)
					.set({ description: 'Updated by TX1' })
					.where(eq(categories.id, cat1.id));

				await new Promise((resolve) => setTimeout(resolve, 10));

				await tx
					.update(categories)
					.set({ description: 'Updated by TX1' })
					.where(eq(categories.id, cat2.id));
			});

			const tx2 = testDb.transaction(async (tx) => {
				// TX2: Update cat2 first, then cat1 (opposite order)
				await tx
					.update(categories)
					.set({ description: 'Updated by TX2' })
					.where(eq(categories.id, cat2.id));

				await new Promise((resolve) => setTimeout(resolve, 10));

				await tx
					.update(categories)
					.set({ description: 'Updated by TX2' })
					.where(eq(categories.id, cat1.id));
			});

			// Execute both transactions
			// One might fail due to deadlock, but at least one should succeed
			const results = await Promise.allSettled([tx1, tx2]);

			// At least one should have succeeded
			const successCount = results.filter((r) => r.status === 'fulfilled').length;
			expect(successCount).toBeGreaterThanOrEqual(1);
		});
	});
});
