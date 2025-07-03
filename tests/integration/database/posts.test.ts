import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '$lib/server/db';
import { posts, categories, postsToCategories, users } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createTestData } from '$lib/test-utils';
import bcrypt from 'bcryptjs';

describe('Posts Database Integration', () => {
	// Test user
	let testUserId: string;

	beforeEach(async () => {
		// Clean up database
		await db.delete(postsToCategories);
		await db.delete(posts);
		await db.delete(categories);
		await db.delete(users);

		// Create test user
		const hashedPassword = await bcrypt.hash('testpass', 10);
		const [user] = await db
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				username: 'testuser',
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		testUserId = user.id;
	});

	afterEach(async () => {
		// Clean up
		await db.delete(postsToCategories);
		await db.delete(posts);
		await db.delete(categories);
		await db.delete(users);
	});

	describe('CRUD Operations', () => {
		it('should create a new post', async () => {
			const postData = {
				title: 'Test Post',
				slug: 'test-post',
				content: 'Test content',
				excerpt: 'Test excerpt',
				status: 'draft' as const,
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const [post] = await db.insert(posts).values(postData).returning();

			expect(post).toBeDefined();
			expect(post.title).toBe(postData.title);
			expect(post.slug).toBe(postData.slug);
			expect(post.content).toBe(postData.content);
			expect(post.status).toBe('draft');
			expect(post.publishedAt).toBeNull();
		});

		it('should read a post by id', async () => {
			const [created] = await db
				.insert(posts)
				.values({
					title: 'Test Post',
					slug: 'test-post',
					content: 'Test content',
					excerpt: 'Test excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [found] = await db.select().from(posts).where(eq(posts.id, created.id));

			expect(found).toBeDefined();
			expect(found.id).toBe(created.id);
			expect(found.title).toBe(created.title);
		});

		it('should update a post', async () => {
			const [created] = await db
				.insert(posts)
				.values({
					title: 'Original Title',
					slug: 'original-slug',
					content: 'Original content',
					excerpt: 'Original excerpt',
					status: 'draft',
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const newTitle = 'Updated Title';
			const newContent = 'Updated content';

			await db
				.update(posts)
				.set({
					title: newTitle,
					content: newContent,
					status: 'published',
					publishedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(posts.id, created.id));

			const [updated] = await db.select().from(posts).where(eq(posts.id, created.id));

			expect(updated.title).toBe(newTitle);
			expect(updated.content).toBe(newContent);
			expect(updated.status).toBe('published');
			expect(updated.publishedAt).not.toBeNull();
		});

		it('should delete a post', async () => {
			const [created] = await db
				.insert(posts)
				.values({
					title: 'To Delete',
					slug: 'to-delete',
					content: 'Delete me',
					excerpt: 'Delete excerpt',
					status: 'draft',
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			await db.delete(posts).where(eq(posts.id, created.id));

			const found = await db.select().from(posts).where(eq(posts.id, created.id));
			expect(found).toHaveLength(0);
		});
	});

	describe('Post-Category Relationships', () => {
		let categoryId: number;

		beforeEach(async () => {
			// Create test category
			const [category] = await db
				.insert(categories)
				.values({
					name: 'Test Category',
					slug: 'test-category',
					description: 'Test description',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();
			categoryId = category.id;
		});

		it('should associate posts with categories', async () => {
			const [post] = await db
				.insert(posts)
				.values({
					title: 'Categorized Post',
					slug: 'categorized-post',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Associate post with category
			await db.insert(postsToCategories).values({
				postId: post.id,
				categoryId: categoryId
			});

			// Verify association
			const associations = await db
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, post.id));

			expect(associations).toHaveLength(1);
			expect(associations[0].categoryId).toBe(categoryId);
		});

		it('should retrieve posts with their categories', async () => {
			const [post] = await db
				.insert(posts)
				.values({
					title: 'Post with Categories',
					slug: 'post-with-categories',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			await db.insert(postsToCategories).values({
				postId: post.id,
				categoryId: categoryId
			});

			// Query posts with categories
			const result = await db
				.select({
					post: posts,
					category: categories
				})
				.from(posts)
				.leftJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
				.leftJoin(categories, eq(postsToCategories.categoryId, categories.id))
				.where(eq(posts.id, post.id));

			expect(result).toHaveLength(1);
			expect(result[0].post.id).toBe(post.id);
			expect(result[0].category?.id).toBe(categoryId);
		});

		it('should handle multiple categories per post', async () => {
			// Create additional categories
			const [cat2] = await db
				.insert(categories)
				.values({
					name: 'Category 2',
					slug: 'category-2',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [cat3] = await db
				.insert(categories)
				.values({
					name: 'Category 3',
					slug: 'category-3',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [post] = await db
				.insert(posts)
				.values({
					title: 'Multi-category Post',
					slug: 'multi-category-post',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Associate with multiple categories
			await db.insert(postsToCategories).values([
				{ postId: post.id, categoryId: categoryId },
				{ postId: post.id, categoryId: cat2.id },
				{ postId: post.id, categoryId: cat3.id }
			]);

			const associations = await db
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, post.id));

			expect(associations).toHaveLength(3);
		});
	});

	describe('Query Patterns', () => {
		beforeEach(async () => {
			// Create test data
			const now = new Date();
			const yesterday = new Date(now.getTime() - 86400000);
			const tomorrow = new Date(now.getTime() + 86400000);

			await db.insert(posts).values([
				{
					title: 'Published Yesterday',
					slug: 'published-yesterday',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: yesterday,
					userId: testUserId,
					createdAt: yesterday,
					updatedAt: yesterday
				},
				{
					title: 'Published Today',
					slug: 'published-today',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: now,
					userId: testUserId,
					createdAt: now,
					updatedAt: now
				},
				{
					title: 'Draft Post',
					slug: 'draft-post',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'draft',
					publishedAt: null,
					userId: testUserId,
					createdAt: now,
					updatedAt: now
				},
				{
					title: 'Future Post',
					slug: 'future-post',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: tomorrow,
					userId: testUserId,
					createdAt: now,
					updatedAt: now
				}
			]);
		});

		it('should filter published posts', async () => {
			const publishedPosts = await db
				.select()
				.from(posts)
				.where(eq(posts.status, 'published'))
				.orderBy(desc(posts.publishedAt));

			expect(publishedPosts).toHaveLength(3); // Including future post
			expect(publishedPosts.every((p) => p.status === 'published')).toBe(true);
		});

		it('should filter posts by publish date', async () => {
			const now = new Date();

			// This would need SQL functions to compare dates properly
			// For now, we'll do it in application code
			const allPosts = await db.select().from(posts);
			const currentlyPublished = allPosts.filter(
				(p) => p.status === 'published' && p.publishedAt && p.publishedAt <= now
			);

			expect(currentlyPublished).toHaveLength(2);
		});

		it('should paginate results', async () => {
			const limit = 2;
			const offset = 1;

			const paginatedPosts = await db
				.select()
				.from(posts)
				.orderBy(desc(posts.createdAt))
				.limit(limit)
				.offset(offset);

			expect(paginatedPosts).toHaveLength(2);
		});

		it('should count total posts', async () => {
			const allPosts = await db.select().from(posts);
			const publishedPosts = allPosts.filter((p) => p.status === 'published');

			expect(allPosts).toHaveLength(4);
			expect(publishedPosts).toHaveLength(3);
		});
	});

	describe('Data Integrity', () => {
		it('should enforce unique slugs', async () => {
			const slug = 'unique-slug';

			await db.insert(posts).values({
				title: 'First Post',
				slug,
				content: 'Content',
				excerpt: 'Excerpt',
				status: 'published',
				publishedAt: new Date(),
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Attempt to insert duplicate slug should fail
			await expect(
				db.insert(posts).values({
					title: 'Second Post',
					slug, // Same slug
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should cascade delete post-category relationships', async () => {
			const [category] = await db
				.insert(categories)
				.values({
					name: 'Test Category',
					slug: 'test-category',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [post] = await db
				.insert(posts)
				.values({
					title: 'Post to Delete',
					slug: 'post-to-delete',
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			await db.insert(postsToCategories).values({
				postId: post.id,
				categoryId: category.id
			});

			// Delete post
			await db.delete(posts).where(eq(posts.id, post.id));

			// Check that relationship is also deleted
			const relationships = await db
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.postId, post.id));

			expect(relationships).toHaveLength(0);
		});
	});
});
