import { getTestDb } from '../setup';
import {
	posts,
	categories,
	postsToCategories,
	users,
	sessions,
	media
} from '../../../src/lib/server/db/schema';

/**
 * Test isolation utility for database tests
 * Provides consistent cleanup and setup patterns
 */
export class TestIsolation {
	private db = getTestDb();

	/**
	 * Clean all tables in the correct order (respecting foreign key constraints)
	 */
	async cleanDatabase(): Promise<void> {
		// Disable foreign key checks temporarily for faster cleanup
		await this.db.run('PRAGMA foreign_keys = OFF');

		try {
			// Clean tables in reverse dependency order
			const tables = [
				'posts_to_categories',
				'media',
				'sessions',
				'posts',
				'categories',
				'users'
			];

			for (const table of tables) {
				try {
					await this.db.run(`DELETE FROM ${table}`);
				} catch (error) {
					// Table might not exist, continue
					console.log(`Warning: Could not clean table ${table}:`, error);
				}
			}

			// Reset sequences for autoincrement columns
			await this.db.run(
				`DELETE FROM sqlite_sequence WHERE name IN ('posts', 'categories', 'media')`
			);
		} finally {
			// Re-enable foreign key checks
			await this.db.run('PRAGMA foreign_keys = ON');
		}
	}

	/**
	 * Verify database is in clean state
	 */
	async verifyCleanState(): Promise<void> {
		const tables = [
			{ name: 'users', schema: users },
			{ name: 'categories', schema: categories },
			{ name: 'posts', schema: posts },
			{ name: 'posts_to_categories', schema: postsToCategories },
			{ name: 'sessions', schema: sessions },
			{ name: 'media', schema: media }
		];

		for (const table of tables) {
			try {
				const count = await this.db.select().from(table.schema);
				if (count.length > 0) {
					throw new Error(
						`Table ${table.name} is not clean: contains ${count.length} rows`
					);
				}
			} catch (error) {
				// Table might not exist, which is fine
				if (error instanceof Error && !error.message.includes('no such table')) {
					throw error;
				}
			}
		}
	}

	/**
	 * Create a test user and return the ID
	 */
	async createTestUser(userData?: Partial<typeof users.$inferInsert>): Promise<string> {
		const bcrypt = await import('bcryptjs');
		const hashedPassword = await bcrypt.hash(userData?.hashedPassword || 'testpass', 10);

		// Generate unique username to avoid conflicts
		const uniqueUsername =
			userData?.username ||
			`testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

		const [user] = await this.db
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
				...userData,
				username: uniqueUsername // Ensure uniqueUsername takes precedence
			})
			.returning();

		return user.id;
	}

	/**
	 * Create a test category and return the ID
	 */
	async createTestCategory(
		categoryData?: Partial<typeof categories.$inferInsert>
	): Promise<number> {
		const [category] = await this.db
			.insert(categories)
			.values({
				name: 'Test Category',
				slug: 'test-category',
				createdAt: new Date(),
				updatedAt: new Date(),
				...categoryData
			})
			.returning();

		return category.id;
	}

	/**
	 * Create a test post and return the ID
	 */
	async createTestPost(
		postData?: Partial<typeof posts.$inferInsert>,
		userId?: string
	): Promise<number> {
		const testUserId = userId || (await this.createTestUser());

		const [post] = await this.db
			.insert(posts)
			.values({
				title: 'Test Post',
				slug: 'test-post',
				content: 'Test content',
				status: 'draft',
				userId: testUserId,
				createdAt: new Date(),
				updatedAt: new Date(),
				...postData
			})
			.returning();

		return post.id;
	}

	/**
	 * Setup test data with common entities
	 */
	async setupBasicTestData(): Promise<{
		userId: string;
		categoryId: number;
		postId: number;
	}> {
		const userId = await this.createTestUser();
		const categoryId = await this.createTestCategory();
		const postId = await this.createTestPost(undefined, userId);

		// Link post to category
		await this.db.insert(postsToCategories).values({
			postId,
			categoryId
		});

		return { userId, categoryId, postId };
	}
}

/**
 * Global test isolation instance
 */
export const testIsolation = new TestIsolation();

/**
 * Helper function for running tests with automatic cleanup
 */
export async function withCleanDatabase<T>(testFn: () => Promise<T>): Promise<T> {
	await testIsolation.cleanDatabase();
	try {
		const result = await testFn();
		return result;
	} finally {
		await testIsolation.cleanDatabase();
	}
}
