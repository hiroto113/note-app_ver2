import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '$lib/server/db';
import { categories, posts, postsToCategories, users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Categories Database Integration', () => {
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
		const [user] = await db.insert(users).values({
			id: crypto.randomUUID(),
			username: 'testuser',
			hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();
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
		it('should create a new category', async () => {
			const categoryData = {
				name: 'Test Category',
				slug: 'test-category',
				description: 'Test description',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const [category] = await db.insert(categories).values(categoryData).returning();

			expect(category).toBeDefined();
			expect(category.name).toBe(categoryData.name);
			expect(category.slug).toBe(categoryData.slug);
			expect(category.description).toBe(categoryData.description);
		});

		it('should read a category by id', async () => {
			const [created] = await db.insert(categories).values({
				name: 'Test Category',
				slug: 'test-category',
				description: 'Test description',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const [found] = await db.select().from(categories).where(eq(categories.id, created.id));

			expect(found).toBeDefined();
			expect(found.id).toBe(created.id);
			expect(found.name).toBe(created.name);
		});

		it('should update a category', async () => {
			const [created] = await db.insert(categories).values({
				name: 'Original Name',
				slug: 'original-slug',
				description: 'Original description',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const newName = 'Updated Name';
			const newDescription = 'Updated description';

			await db.update(categories)
				.set({
					name: newName,
					description: newDescription,
					updatedAt: new Date()
				})
				.where(eq(categories.id, created.id));

			const [updated] = await db.select().from(categories).where(eq(categories.id, created.id));

			expect(updated.name).toBe(newName);
			expect(updated.description).toBe(newDescription);
			expect(updated.slug).toBe('original-slug'); // Slug should not change
		});

		it('should delete a category', async () => {
			const [created] = await db.insert(categories).values({
				name: 'To Delete',
				slug: 'to-delete',
				description: 'Delete me',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			await db.delete(categories).where(eq(categories.id, created.id));

			const found = await db.select().from(categories).where(eq(categories.id, created.id));
			expect(found).toHaveLength(0);
		});
	});

	describe('Category-Post Relationships', () => {
		it('should count posts per category', async () => {
			// Create categories
			const [cat1] = await db.insert(categories).values({
				name: 'Category 1',
				slug: 'category-1',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const [cat2] = await db.insert(categories).values({
				name: 'Category 2',
				slug: 'category-2',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create posts
			const postIds = [];
			for (let i = 0; i < 5; i++) {
				const [post] = await db.insert(posts).values({
					title: `Post ${i}`,
					slug: `post-${i}`,
					content: 'Content',
					excerpt: 'Excerpt',
					status: 'published',
					publishedAt: new Date(),
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				}).returning();
				postIds.push(post.id);
			}

			// Associate posts with categories
			// Cat1: 3 posts, Cat2: 2 posts
			await db.insert(postsToCategories).values([
				{ postId: postIds[0], categoryId: cat1.id },
				{ postId: postIds[1], categoryId: cat1.id },
				{ postId: postIds[2], categoryId: cat1.id },
				{ postId: postIds[3], categoryId: cat2.id },
				{ postId: postIds[4], categoryId: cat2.id }
			]);

			// Count posts per category
			const cat1Count = await db
				.select({ count: sql<number>`count(*)` })
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, cat1.id));

			const cat2Count = await db
				.select({ count: sql<number>`count(*)` })
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, cat2.id));

			expect(Number(cat1Count[0].count)).toBe(3);
			expect(Number(cat2Count[0].count)).toBe(2);
		});

		it('should get categories with published post count', async () => {
			const [category] = await db.insert(categories).values({
				name: 'Test Category',
				slug: 'test-category',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create mixed posts
			const [publishedPost1] = await db.insert(posts).values({
				title: 'Published 1',
				slug: 'published-1',
				content: 'Content',
				excerpt: 'Excerpt',
				status: 'published',
				publishedAt: new Date(),
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const [publishedPost2] = await db.insert(posts).values({
				title: 'Published 2',
				slug: 'published-2',
				content: 'Content',
				excerpt: 'Excerpt',
				status: 'published',
				publishedAt: new Date(),
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const [draftPost] = await db.insert(posts).values({
				title: 'Draft',
				slug: 'draft',
				content: 'Content',
				excerpt: 'Excerpt',
				status: 'draft',
				publishedAt: null,
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Associate all posts with category
			await db.insert(postsToCategories).values([
				{ postId: publishedPost1.id, categoryId: category.id },
				{ postId: publishedPost2.id, categoryId: category.id },
				{ postId: draftPost.id, categoryId: category.id }
			]);

			// Count only published posts
			const publishedCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(posts)
				.innerJoin(postsToCategories, eq(posts.id, postsToCategories.postId))
				.where(
					eq(postsToCategories.categoryId, category.id) &&
					eq(posts.status, 'published')
				);

			expect(Number(publishedCount[0].count)).toBe(2);
		});

		it('should handle category deletion with posts', async () => {
			const [category] = await db.insert(categories).values({
				name: 'Category to Delete',
				slug: 'category-to-delete',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			const [post] = await db.insert(posts).values({
				title: 'Associated Post',
				slug: 'associated-post',
				content: 'Content',
				excerpt: 'Excerpt',
				status: 'published',
				publishedAt: new Date(),
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			await db.insert(postsToCategories).values({
				postId: post.id,
				categoryId: category.id
			});

			// Delete category
			await db.delete(categories).where(eq(categories.id, category.id));

			// Check that relationship is deleted
			const relationships = await db
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, category.id));

			expect(relationships).toHaveLength(0);

			// But post should still exist
			const [remainingPost] = await db
				.select()
				.from(posts)
				.where(eq(posts.id, post.id));

			expect(remainingPost).toBeDefined();
		});
	});

	describe('Query Patterns', () => {
		beforeEach(async () => {
			// Create test categories
			const categoryData = [
				{ name: 'Technology', slug: 'technology', description: 'Tech articles' },
				{ name: 'AI & ML', slug: 'ai-ml', description: 'AI and Machine Learning' },
				{ name: 'Web Dev', slug: 'web-dev', description: 'Web Development' },
				{ name: 'Database', slug: 'database', description: 'Database topics' }
			];

			for (const cat of categoryData) {
				await db.insert(categories).values({
					...cat,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}
		});

		it('should list all categories alphabetically', async () => {
			const allCategories = await db
				.select()
				.from(categories)
				.orderBy(categories.name);

			expect(allCategories).toHaveLength(4);
			expect(allCategories[0].name).toBe('AI & ML');
			expect(allCategories[1].name).toBe('Database');
			expect(allCategories[2].name).toBe('Technology');
			expect(allCategories[3].name).toBe('Web Dev');
		});

		it('should find category by slug', async () => {
			const slug = 'web-dev';
			const [category] = await db
				.select()
				.from(categories)
				.where(eq(categories.slug, slug));

			expect(category).toBeDefined();
			expect(category.slug).toBe(slug);
			expect(category.name).toBe('Web Dev');
		});

		it('should search categories by name pattern', async () => {
			// This would need LIKE operator support
			const allCategories = await db.select().from(categories);
			const techCategories = allCategories.filter(c => 
				c.name.toLowerCase().includes('tech')
			);

			expect(techCategories).toHaveLength(1);
			expect(techCategories[0].name).toBe('Technology');
		});
	});

	describe('Data Integrity', () => {
		it('should enforce unique slugs', async () => {
			const slug = 'unique-slug';

			await db.insert(categories).values({
				name: 'First Category',
				slug,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Attempt to insert duplicate slug should fail
			await expect(
				db.insert(categories).values({
					name: 'Second Category',
					slug, // Same slug
					createdAt: new Date(),
					updatedAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should enforce unique names', async () => {
			const name = 'Unique Name';

			await db.insert(categories).values({
				name,
				slug: 'unique-name-1',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Attempt to insert duplicate name should fail
			await expect(
				db.insert(categories).values({
					name, // Same name
					slug: 'unique-name-2',
					createdAt: new Date(),
					updatedAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should allow null descriptions', async () => {
			const [category] = await db.insert(categories).values({
				name: 'No Description',
				slug: 'no-description',
				description: null,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			expect(category.description).toBeNull();
		});
	});
});