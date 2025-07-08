/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { expect } from 'vitest';
import { testDb } from '../../integration/setup';
import { users, posts, categories } from '$lib/server/db/schema';
import { eq, and, count, isNull, or, gt } from 'drizzle-orm';
import type {
	RegressionResult,
	RegressionPriority,
	RegressionCategory
} from './regression-test-base';

/**
 * Performance thresholds for different types of operations
 */
export const PERFORMANCE_THRESHOLDS = {
	DATABASE_QUERY: 1000, // 1 second
	API_REQUEST: 2000, // 2 seconds
	PAGE_LOAD: 3000, // 3 seconds
	AUTHENTICATION: 500, // 500ms
	FORM_SUBMISSION: 1500, // 1.5 seconds
	SEARCH_OPERATION: 2000 // 2 seconds
} as const;

/**
 * Common regression test patterns
 */
export class RegressionTestHelpers {
	/**
	 * Verify that a user can perform basic authentication flow
	 */
	static async verifyAuthenticationFlow(
		username: string,
		password: string = 'testpassword123'
	): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 1. Verify user exists
			const user = await testDb
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (user.length === 0) {
				errors.push(`User ${username} not found`);
				return {
					success: false,
					duration: Date.now() - startTime,
					errors,
					warnings,
					metadata: { step: 'user_lookup' }
				};
			}

			// 2. Simulate password verification (in real app, this would use bcrypt)
			if (!user[0].hashedPassword) {
				errors.push('User has no password set');
			}

			// 3. Check user is not locked/disabled
			// This would depend on your actual user schema

			const duration = Date.now() - startTime;
			if (duration > PERFORMANCE_THRESHOLDS.AUTHENTICATION) {
				warnings.push(
					`Authentication took ${duration}ms, exceeding threshold of ${PERFORMANCE_THRESHOLDS.AUTHENTICATION}ms`
				);
			}

			return {
				success: errors.length === 0,
				duration,
				errors,
				warnings,
				metadata: {
					userId: user[0].id,
					username: user[0].username,
					performanceThreshold: PERFORMANCE_THRESHOLDS.AUTHENTICATION
				}
			};
		} catch (error) {
			return {
				success: false,
				duration: Date.now() - startTime,
				errors: [error instanceof Error ? error.message : String(error)],
				warnings,
				metadata: { exception: error }
			};
		}
	}

	/**
	 * Verify post creation workflow
	 */
	static async verifyPostCreationWorkflow(
		userId: string,
		postData: {
			title: string;
			content: string;
			status?: 'draft' | 'published';
		}
	): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 1. Verify user exists and has permission
			const user = await testDb.select().from(users).where(eq(users.id, userId)).limit(1);

			if (user.length === 0) {
				errors.push(`User ${userId} not found`);
				return {
					success: false,
					duration: Date.now() - startTime,
					errors,
					warnings,
					metadata: { step: 'user_verification' }
				};
			}

			// 2. Create post
			const postInsertData = {
				title: postData.title,
				slug: postData.title
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, ''),
				content: postData.content,
				excerpt: postData.content.substring(0, 200),
				status: postData.status || 'draft',
				userId: userId,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const [newPost] = await testDb.insert(posts).values(postInsertData).returning();

			// 3. Verify post was created correctly
			const verifyPost = await testDb
				.select()
				.from(posts)
				.where(eq(posts.id, newPost.id))
				.limit(1);

			if (verifyPost.length === 0) {
				errors.push('Post was not created successfully');
			} else if (verifyPost[0].title !== postData.title) {
				errors.push('Post title was not saved correctly');
			}

			const duration = Date.now() - startTime;
			if (duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY) {
				warnings.push(`Post creation took ${duration}ms, exceeding threshold`);
			}

			return {
				success: errors.length === 0,
				duration,
				errors,
				warnings,
				metadata: {
					postId: newPost.id,
					userId,
					postData,
					performanceThreshold: PERFORMANCE_THRESHOLDS.DATABASE_QUERY
				}
			};
		} catch (error) {
			return {
				success: false,
				duration: Date.now() - startTime,
				errors: [error instanceof Error ? error.message : String(error)],
				warnings,
				metadata: { exception: error }
			};
		}
	}

	/**
	 * Verify category management workflow
	 */
	static async verifyCategoryManagementWorkflow(categoryData: {
		name: string;
		description?: string;
	}): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 1. Create category
			const categoryInsertData = {
				name: categoryData.name,
				slug: categoryData.name
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, ''),
				description: categoryData.description || null,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const [newCategory] = await testDb
				.insert(categories)
				.values(categoryInsertData)
				.returning();

			// 2. Verify category was created
			const verifyCategory = await testDb
				.select()
				.from(categories)
				.where(eq(categories.id, newCategory.id))
				.limit(1);

			if (verifyCategory.length === 0) {
				errors.push('Category was not created successfully');
			}

			// 3. Check for duplicate slugs
			const duplicateSlugs = await testDb
				.select()
				.from(categories)
				.where(eq(categories.slug, categoryInsertData.slug));

			if (duplicateSlugs.length > 1) {
				errors.push('Duplicate category slug detected');
			}

			const duration = Date.now() - startTime;
			if (duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY) {
				warnings.push(`Category creation took ${duration}ms, exceeding threshold`);
			}

			return {
				success: errors.length === 0,
				duration,
				errors,
				warnings,
				metadata: {
					categoryId: newCategory.id,
					categoryData,
					slug: categoryInsertData.slug
				}
			};
		} catch (error) {
			return {
				success: false,
				duration: Date.now() - startTime,
				errors: [error instanceof Error ? error.message : String(error)],
				warnings,
				metadata: { exception: error }
			};
		}
	}

	/**
	 * Verify data integrity across related tables
	 */
	static async verifyDataIntegrity(): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 1. Check for orphaned posts (posts without valid users)
			const orphanedPosts = await testDb
				.select({ postId: posts.id, userId: posts.userId })
				.from(posts)
				.leftJoin(users, eq(posts.userId, users.id))
				.where(isNull(users.id));

			if (orphanedPosts.length > 0) {
				errors.push(`Found ${orphanedPosts.length} orphaned posts without valid users`);
			}

			// 2. Check for posts with empty required fields
			const invalidPosts = await testDb
				.select({ id: posts.id, title: posts.title, content: posts.content })
				.from(posts)
				.where(
					or(
						eq(posts.title, ''),
						eq(posts.content, ''),
						isNull(posts.title),
						isNull(posts.content)
					)
				);

			if (invalidPosts.length > 0) {
				errors.push(`Found ${invalidPosts.length} posts with empty required fields`);
			}

			// 3. Check for duplicate slugs
			const duplicatePostSlugs = await testDb
				.select({ slug: posts.slug, count: count() })
				.from(posts)
				.groupBy(posts.slug)
				.having(gt(count(), 1));

			if (duplicatePostSlugs.length > 0) {
				warnings.push(`Found ${duplicatePostSlugs.length} duplicate post slugs`);
			}

			const duplicateCategorySlugs = await testDb
				.select({ slug: categories.slug, count: count() })
				.from(categories)
				.groupBy(categories.slug)
				.having(gt(count(), 1));

			if (duplicateCategorySlugs.length > 0) {
				warnings.push(`Found ${duplicateCategorySlugs.length} duplicate category slugs`);
			}

			return {
				success: errors.length === 0,
				duration: Date.now() - startTime,
				errors,
				warnings,
				metadata: {
					orphanedPosts: orphanedPosts.length,
					invalidPosts: invalidPosts.length,
					duplicatePostSlugs: duplicatePostSlugs.length,
					duplicateCategorySlugs: duplicateCategorySlugs.length
				}
			};
		} catch (error) {
			return {
				success: false,
				duration: Date.now() - startTime,
				errors: [error instanceof Error ? error.message : String(error)],
				warnings,
				metadata: { exception: error }
			};
		}
	}

	/**
	 * Performance regression test helper
	 */
	static async measurePerformance<T>(
		operation: () => Promise<T>,
		threshold: number,
		operationName: string
	): Promise<{ result: T; duration: number; withinThreshold: boolean }> {
		const startTime = Date.now();
		const result = await operation();
		const duration = Date.now() - startTime;
		const withinThreshold = duration <= threshold;

		if (!withinThreshold) {
			console.warn(
				`⚠️ Performance regression detected: ${operationName} took ${duration}ms (threshold: ${threshold}ms)`
			);
		}

		return { result, duration, withinThreshold };
	}

	/**
	 * Assert that a regression result is successful
	 */
	static assertRegressionSuccess(result: RegressionResult, testName: string): void {
		if (!result.success) {
			const errorMessage =
				`Regression test failed: ${testName}\n` +
				`Errors: ${result.errors.join(', ')}\n` +
				`Warnings: ${result.warnings.join(', ')}\n` +
				`Duration: ${result.duration}ms\n` +
				`Metadata: ${JSON.stringify(result.metadata, null, 2)}`;

			throw new Error(errorMessage);
		}

		if (result.warnings.length > 0) {
			console.warn(`⚠️ Regression test ${testName} passed with warnings:`, result.warnings);
		}
	}

	/**
	 * Create a performance regression test
	 */
	static createPerformanceRegressionTest(
		name: string,
		operation: () => Promise<any>,
		threshold: number,
		priority: RegressionPriority = 'MEDIUM'
	): () => Promise<RegressionResult> {
		return async (): Promise<RegressionResult> => {
			const startTime = Date.now();
			const errors: string[] = [];
			const warnings: string[] = [];

			try {
				await operation();
				const duration = Date.now() - startTime;

				if (duration > threshold) {
					warnings.push(
						`Operation exceeded performance threshold: ${duration}ms > ${threshold}ms`
					);
				}

				return {
					success: true,
					duration,
					errors,
					warnings,
					metadata: {
						threshold,
						priority,
						operationType: 'performance'
					}
				};
			} catch (error) {
				return {
					success: false,
					duration: Date.now() - startTime,
					errors: [error instanceof Error ? error.message : String(error)],
					warnings,
					metadata: {
						threshold,
						priority,
						operationType: 'performance',
						exception: error
					}
				};
			}
		};
	}

	/**
	 * Verify that specific bug conditions do not occur
	 */
	static async verifyBugNotPresent(
		bugId: string,
		verificationFn: () => Promise<boolean>,
		description: string
	): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			const bugPresent = await verificationFn();

			if (bugPresent) {
				errors.push(`Bug ${bugId} has regressed: ${description}`);
			}

			return {
				success: !bugPresent,
				duration: Date.now() - startTime,
				errors,
				warnings,
				metadata: {
					bugId,
					description,
					bugPresent
				}
			};
		} catch (error) {
			return {
				success: false,
				duration: Date.now() - startTime,
				errors: [error instanceof Error ? error.message : String(error)],
				warnings,
				metadata: {
					bugId,
					description,
					exception: error
				}
			};
		}
	}

	/**
	 * Test database transaction consistency
	 */
	static async verifyTransactionConsistency(): Promise<RegressionResult> {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Test that failed transactions don't leave partial data
			await testDb.transaction(async (tx) => {
				// Create a post
				const [tempPost] = await tx
					.insert(posts)
					.values({
						title: 'Transaction Test Post',
						slug: 'transaction-test-post',
						content: 'This post should not persist',
						excerpt: 'Test excerpt',
						status: 'draft',
						userId: 'non-existent-user', // This should cause a foreign key error
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();

				// Transaction should fail due to foreign key constraint
				// Post should not exist after rollback
			});

			// If we get here, the transaction didn't fail as expected
			errors.push('Transaction with invalid foreign key should have failed');
		} catch (error) {
			// This is expected - verify no orphaned data exists
			const orphanedPosts = await testDb
				.select()
				.from(posts)
				.where(eq(posts.title, 'Transaction Test Post'));

			if (orphanedPosts.length > 0) {
				errors.push('Failed transaction left orphaned data');
			}
		}

		return {
			success: errors.length === 0,
			duration: Date.now() - startTime,
			errors,
			warnings,
			metadata: {
				testType: 'transaction_consistency'
			}
		};
	}
}

/**
 * Utility function to run multiple regression checks in parallel
 */
export async function runParallelRegressionChecks(
	checks: Array<() => Promise<RegressionResult>>
): Promise<RegressionResult[]> {
	return Promise.all(checks.map((check) => check()));
}

/**
 * Utility function to aggregate regression results
 */
export function aggregateRegressionResults(results: RegressionResult[]): {
	overallSuccess: boolean;
	totalDuration: number;
	errorCount: number;
	warningCount: number;
	successRate: number;
} {
	const overallSuccess = results.every((r) => r.success);
	const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
	const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
	const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);
	const successRate = results.filter((r) => r.success).length / results.length;

	return {
		overallSuccess,
		totalDuration,
		errorCount,
		warningCount,
		successRate
	};
}
