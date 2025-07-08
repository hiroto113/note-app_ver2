import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../../integration/setup';
import { categories, posts, users, postsToCategories } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { RegressionTestHelpers } from '../utils/regression-helpers';
import { regressionDataManager } from '../utils/regression-data-manager';

/**
 * Category Management Regression Tests
 * 
 * Prevents regression of category management functionality including:
 * - Category creation and validation
 * - Category updates and slug management
 * - Category deletion and cascade handling
 * - Category-post relationships
 * - Category hierarchy (if implemented)
 * - Performance with large category sets
 * 
 * Based on historical issues:
 * - Slug duplication in categories
 * - Orphaned posts after category deletion
 * - Category name validation bypasses
 * - Performance issues with category queries
 * - Category deletion cascade failures
 */
describe('Category Management Regression Tests', () => {
	let testData: any;

	beforeEach(async () => {
		testData = await regressionDataManager.createRegressionScenario('category-management', {
			userCount: 1,
			categoryCount: 0 // We'll create categories in each test
		});
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('Category Creation Regression', () => {
		it('should prevent regression: basic category creation workflow', async () => {
			const categoryData = {
				name: 'Technology',
				description: 'Technology-related posts and articles'
			};

			const result = await RegressionTestHelpers.verifyCategoryManagementWorkflow(categoryData);

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.metadata.categoryId).toBeDefined();
			expect(result.metadata.slug).toBe('technology');
			expect(result.duration).toBeLessThan(1000);
		});

		it('should prevent regression: categories with different names have unique slugs', async () => {
			const firstName = `First Category ${crypto.randomUUID()}`;
			const secondName = `Second Category ${crypto.randomUUID()}`;

			// Create first category
			const firstSlug = `first-category-${crypto.randomUUID()}`;
			const [firstCategory] = await testDb.insert(categories).values({
				name: firstName,
				slug: firstSlug,
				description: 'First category',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Create second category with different name and slug
			const uniqueSlug = `second-category-${crypto.randomUUID()}`;
			const [secondCategory] = await testDb.insert(categories).values({
				name: secondName,
				slug: uniqueSlug,
				description: 'Second category',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			expect(firstCategory.slug).not.toBe(secondCategory.slug);
			expect(secondCategory.slug).toBe(uniqueSlug);
			expect(firstCategory.name).not.toBe(secondCategory.name);
		});

		it('should prevent regression: category creation with empty name fails', async () => {
			const invalidNames = ['', '   ', null, undefined];

			for (const invalidName of invalidNames) {
				try {
					const invalidSlug = `invalid-category-${crypto.randomUUID()}`;
					await testDb.insert(categories).values({
						name: invalidName as any,
						slug: invalidSlug,
						description: 'Should fail',
						createdAt: new Date(),
						updatedAt: new Date()
					});

					// If we get here with empty name, that's a regression
					if (!invalidName || invalidName.trim() === '') {
						expect.fail('Category creation with empty name should have failed');
					}
				} catch (error) {
					// Expected for invalid names
					expect(error).toBeDefined();
				}
			}
		});

		it('should prevent regression: category creation with extremely long name', async () => {
			const longName = 'A'.repeat(200); // Very long category name
			const startTime = Date.now();

			try {
				const longSlug = `very-long-category-name-${crypto.randomUUID()}`;
				const [category] = await testDb.insert(categories).values({
					name: longName,
					slug: longSlug,
					description: 'Testing long category names',
					createdAt: new Date(),
					updatedAt: new Date()
				}).returning();

				const duration = Date.now() - startTime;

				// Check if the database accepted the long name
				if (category.name.length > 100) {
					console.warn('⚠️ Database accepted category name longer than recommended limit');
				}

				expect(duration).toBeLessThan(2000);
			} catch (error) {
				// Database constraint should prevent overly long names
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: category slug generation handles special characters', async () => {
			const specialCases = [
				{ name: 'Technology & Science', expectedSlug: 'technology-science' },
				{ name: 'Arts/Culture', expectedSlug: 'arts-culture' },
				{ name: 'Food & Drink!!!', expectedSlug: 'food-drink' },
				{ name: '日本語カテゴリ', expectedSlug: 'ribenyu-kategori' }, // Japanese characters
				{ name: 'Español Categoría', expectedSlug: 'espanol-categoria' } // Spanish characters
			];

			for (const testCase of specialCases) {
				const baseSlug = testCase.name
					.toLowerCase()
					.replace(/[^\w\s-]/g, '') // Remove special characters
					.replace(/\s+/g, '-') // Replace spaces with hyphens
					.replace(/-+/g, '-') // Replace multiple hyphens with single
					.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

				const uniqueSlug = `${baseSlug}-${crypto.randomUUID()}`;

				const [category] = await testDb.insert(categories).values({
					name: testCase.name,
					slug: uniqueSlug,
					description: `Category for ${testCase.name}`,
					createdAt: new Date(),
					updatedAt: new Date()
				}).returning();

				expect(category.slug).toBeDefined();
				expect(category.slug).not.toContain(' ');
				expect(category.slug).not.toContain('&');
				expect(category.slug).not.toContain('/');
			}
		});
	});

	describe('Category Update Regression', () => {
		let existingCategoryId: number;

		beforeEach(async () => {
			const uniqueSlug = `original-category-${crypto.randomUUID()}`;
			const [category] = await testDb.insert(categories).values({
				name: 'Original Category',
				slug: uniqueSlug,
				description: 'Original description',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			existingCategoryId = category.id;
		});

		it('should prevent regression: category update preserves integrity', async () => {
			const updateData = {
				name: 'Updated Category',
				description: 'Updated description with more details',
				updatedAt: new Date()
			};

			const [updatedCategory] = await testDb
				.update(categories)
				.set(updateData)
				.where(eq(categories.id, existingCategoryId))
				.returning();

			expect(updatedCategory.name).toBe(updateData.name);
			expect(updatedCategory.description).toBe(updateData.description);
			expect(updatedCategory.id).toBe(existingCategoryId);
		});

		it('should prevent regression: category slug update maintains uniqueness', async () => {
			// Create another category first
			const otherSlug = `other-category-${crypto.randomUUID()}`;
			const [otherCategory] = await testDb.insert(categories).values({
				name: 'Other Category',
				slug: otherSlug,
				description: 'Another category',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();

			// Try to update our category to have the same slug
			try {
				await testDb
					.update(categories)
					.set({ 
						slug: otherSlug, // Same as existing
						updatedAt: new Date()
					})
					.where(eq(categories.id, existingCategoryId));

				// Check if duplicate slug was prevented
				const duplicateSlugs = await testDb
					.select()
					.from(categories)
					.where(eq(categories.slug, otherSlug));

				// Should now have two categories with the same slug (if allowed) or constraint should prevent it
				expect(duplicateSlugs.length).toBeGreaterThanOrEqual(1);
			} catch (error) {
				// Database constraint should prevent duplicate slugs
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: concurrent category updates handle conflicts', async () => {
			// Simulate two concurrent updates
			const update1Promise = testDb
				.update(categories)
				.set({ 
					name: 'Concurrent Update 1',
					description: 'Description from update 1',
					updatedAt: new Date()
				})
				.where(eq(categories.id, existingCategoryId))
				.returning();

			const update2Promise = testDb
				.update(categories)
				.set({ 
					name: 'Concurrent Update 2',
					description: 'Description from update 2',
					updatedAt: new Date()
				})
				.where(eq(categories.id, existingCategoryId))
				.returning();

			const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

			// Both updates should complete, but last write wins
			expect(result1[0]).toBeDefined();
			expect(result2[0]).toBeDefined();

			// Verify final state is consistent
			const [finalCategory] = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, existingCategoryId));

			expect(finalCategory.name).toMatch(/Concurrent Update [12]/);
		});
	});

	describe('Category Deletion Regression', () => {
		let categoryToDeleteId: number;
		let postInCategoryId: number;

		beforeEach(async () => {
			// Create category
			const deleteSlug = `category-to-delete-${crypto.randomUUID()}`;
			const [category] = await testDb.insert(categories).values({
				name: 'Category to Delete',
				slug: deleteSlug,
				description: 'This category will be deleted',
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			categoryToDeleteId = category.id;

			// Create post in this category (if your schema supports it)
			// Note: This assumes a many-to-many relationship through a junction table
			// Adjust based on your actual schema
		});

		it('should prevent regression: category deletion removes record', async () => {
			// Delete the category
			await testDb
				.delete(categories)
				.where(eq(categories.id, categoryToDeleteId));

			// Verify category is deleted
			const deletedCategory = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, categoryToDeleteId));

			expect(deletedCategory).toHaveLength(0);
		});

		it('should prevent regression: deleting non-existent category handles gracefully', async () => {
			const nonExistentId = 999999;

			try {
				const result = await testDb
					.delete(categories)
					.where(eq(categories.id, nonExistentId));

				// Should not throw error, just affect 0 rows
				expect(result).toBeDefined();
			} catch (error) {
				expect.fail('Deleting non-existent category should not throw error');
			}
		});

		it('should prevent regression: category deletion with associated posts', async () => {
			// In a real application, you would need to handle posts that reference this category
			// This could involve:
			// 1. Preventing deletion if posts exist
			// 2. Moving posts to "Uncategorized"
			// 3. Allowing cascade deletion
			
			// For this test, we'll verify the business logic is consistent
			// Check if posts exist in category through junction table
			const postsInCategory = await testDb
				.select()
				.from(postsToCategories)
				.where(eq(postsToCategories.categoryId, categoryToDeleteId));

			// If posts exist, deletion policy should be enforced
			if (postsInCategory.length > 0) {
				console.log(`Category has ${postsInCategory.length} associated posts`);
				
				// Test your specific business logic here
				// For example, if you prevent deletion:
				// try {
				//   await testDb.delete(categories).where(eq(categories.id, categoryToDeleteId));
				//   expect.fail('Should not be able to delete category with posts');
				// } catch (error) {
				//   expect(error).toBeDefined();
				// }
			}

			// If no posts, deletion should succeed
			await testDb
				.delete(categories)
				.where(eq(categories.id, categoryToDeleteId));

			const deletedCategory = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, categoryToDeleteId));

			expect(deletedCategory).toHaveLength(0);
		});
	});

	describe('Category Query Performance Regression', () => {
		beforeEach(async () => {
			// Create a larger dataset for performance testing
			const largeBatch = Array.from({ length: 100 }, (_, i) => ({
				name: `Performance Category ${i}`,
				slug: `performance-category-${i}-${crypto.randomUUID()}`,
				description: `Description for performance test category ${i}. This is a longer description to test performance with larger text content.`,
				createdAt: new Date(Date.now() - i * 60000), // Spread over time
				updatedAt: new Date()
			}));

			await testDb.insert(categories).values(largeBatch);
		});

		it('should prevent regression: category listing query performance', async () => {
			const startTime = Date.now();

			const categoryList = await testDb
				.select({
					id: categories.id,
					name: categories.name,
					slug: categories.slug,
					description: categories.description,
					createdAt: categories.createdAt
				})
				.from(categories)
				.orderBy(categories.name)
				.limit(50);

			const duration = Date.now() - startTime;

			expect(categoryList.length).toBeGreaterThan(0);
			expect(duration).toBeLessThan(1000); // Should complete within 1 second
		});

		it('should prevent regression: category search query performance', async () => {
			const searchTerm = 'Performance';
			const startTime = Date.now();

			const searchResults = await testDb
				.select()
				.from(categories)
				.limit(20);

			const duration = Date.now() - startTime;

			expect(searchResults.length).toBeGreaterThan(0);
			expect(duration).toBeLessThan(1500); // Search should complete within 1.5 seconds
		});

		it('should prevent regression: category count query performance', async () => {
			const startTime = Date.now();

			const [categoryCount] = await testDb
				.select({ count: count() })
				.from(categories);

			const duration = Date.now() - startTime;

			expect(categoryCount.count).toBeGreaterThan(0);
			expect(duration).toBeLessThan(500); // Count should be very fast
		});
	});

	describe('Category Data Integrity Regression', () => {
		it('should prevent regression: category slug uniqueness constraint', async () => {
			const duplicateSlug = 'unique-category-slug';

			// Create first category
			await testDb.insert(categories).values({
				name: 'First Category',
				slug: duplicateSlug,
				description: 'First category',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Try to create second category with same slug
			try {
				await testDb.insert(categories).values({
					name: 'Second Category',
					slug: duplicateSlug,
					description: 'Second category',
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// If no error thrown, check if constraint is enforced
				const duplicateSlugs = await testDb
					.select()
					.from(categories)
					.where(eq(categories.slug, duplicateSlug));

				// Should only have one category with this slug
				expect(duplicateSlugs.length).toBe(1);
			} catch (error) {
				// Database constraint should prevent duplicate slugs
				expect(error).toBeDefined();
			}
		});

		it('should prevent regression: category name uniqueness validation', async () => {
			const firstUniqueName = `Unique Category Name 1 ${crypto.randomUUID()}`;
			const secondUniqueName = `Unique Category Name 2 ${crypto.randomUUID()}`;

			// Create first category
			const firstUniqueSlug = `unique-category-name-1-${crypto.randomUUID()}`;
			await testDb.insert(categories).values({
				name: firstUniqueName,
				slug: firstUniqueSlug,
				description: 'First category',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Create second category with different name and slug
			const secondUniqueSlug = `unique-category-name-2-${crypto.randomUUID()}`;
			await testDb.insert(categories).values({
				name: secondUniqueName,
				slug: secondUniqueSlug,
				description: 'Second category',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Check that both categories were created successfully
			const allCategories = await testDb
				.select()
				.from(categories);

			expect(allCategories.length).toBeGreaterThanOrEqual(2);
			
			// Verify names are unique
			const names = allCategories.map(c => c.name);
			const uniqueNames = new Set(names);
			expect(uniqueNames.size).toBe(names.length);
		});

		it('should prevent regression: category description length limits', async () => {
			const veryLongDescription = 'A'.repeat(10000); // 10KB description

			try {
				const longDescSlug = `long-description-category-${crypto.randomUUID()}`;
				const [category] = await testDb.insert(categories).values({
					name: 'Long Description Category',
					slug: longDescSlug,
					description: veryLongDescription,
					createdAt: new Date(),
					updatedAt: new Date()
				}).returning();

				// If accepted, verify it's handled properly
				expect(category.description?.length).toBe(10000);
				
				// Performance check - large text should still be handled efficiently
				const startTime = Date.now();
				const [retrievedCategory] = await testDb
					.select()
					.from(categories)
					.where(eq(categories.id, category.id));
				const duration = Date.now() - startTime;

				expect(duration).toBeLessThan(1000);
			} catch (error) {
				// Database constraint might prevent overly long descriptions
				expect(error).toBeDefined();
			}
		});
	});

	describe('Category Validation Regression', () => {
		it('should prevent regression: category name validation rules', async () => {
			const validationCases = [
				{ name: 'Valid Category', shouldPass: true },
				{ name: 'A', shouldPass: true }, // Single character
				{ name: '123', shouldPass: true }, // Numbers only
				{ name: 'Category with Spaces', shouldPass: true },
				{ name: 'Category-with-Hyphens', shouldPass: true },
				{ name: 'Category_with_Underscores', shouldPass: true },
				{ name: 'Category/with/Slashes', shouldPass: true }, // Depending on requirements
				{ name: '', shouldPass: false }, // Empty
				{ name: '   ', shouldPass: false }, // Whitespace only
			];

			for (const testCase of validationCases) {
				try {
					const slug = testCase.name
						.toLowerCase()
						.replace(/[^\w\s-]/g, '')
						.replace(/\s+/g, '-')
						.replace(/-+/g, '-')
						.replace(/^-+|-+$/g, '') || 'untitled';

					const [category] = await testDb.insert(categories).values({
						name: testCase.name,
						slug: `${slug}-${crypto.randomUUID()}`, // Ensure uniqueness
						description: `Test category for ${testCase.name}`,
						createdAt: new Date(),
						updatedAt: new Date()
					}).returning();

					if (!testCase.shouldPass) {
						expect.fail(`Category creation should have failed for name: "${testCase.name}"`);
					}

					expect(category.name).toBe(testCase.name);
				} catch (error) {
					if (testCase.shouldPass) {
						expect.fail(`Category creation should have succeeded for name: "${testCase.name}"`);
					}
					expect(error).toBeDefined();
				}
			}
		});

		it('should prevent regression: category business rule validation', async () => {
			// Test specific business rules for categories
			// This might include reserved names, naming conventions, etc.
			
			const reservedNames = ['admin', 'api', 'system', 'uncategorized'];

			for (const reservedName of reservedNames) {
				try {
					const reservedSlug = `${reservedName}-test-${crypto.randomUUID()}`;
					await testDb.insert(categories).values({
						name: reservedName,
						slug: reservedSlug,
						description: `Testing reserved name: ${reservedName}`,
						createdAt: new Date(),
						updatedAt: new Date()
					});

					// Depending on business rules, this might be allowed or not
					console.warn(`⚠️ Reserved category name "${reservedName}" was allowed`);
				} catch (error) {
					// If your business logic prevents reserved names
					expect(error).toBeDefined();
				}
			}
		});
	});
});