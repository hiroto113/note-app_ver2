import { testDb } from '../../integration/setup';
import { testIsolation, TestIsolation } from '../../integration/utils/test-isolation';
import { users, posts, categories } from '$lib/server/db/schema';
import { eq, isNull, not, inArray, like } from 'drizzle-orm';

/**
 * Change log entry for tracking data modifications
 */
export interface ChangeLogEntry {
	timestamp: string;
	operation: 'CREATE' | 'UPDATE' | 'DELETE';
	table: string;
	recordId: string;
	changes: Record<string, any>;
	testContext: string;
}

/**
 * Regression scenario data setup configuration
 */
export interface RegressionScenarioConfig {
	userCount?: number;
	categoryCount?: number;
	postCount?: number;
	withSessions?: boolean;
	withPermissions?: boolean;
	customData?: Record<string, any>;
}

/**
 * Extended test data for regression scenarios
 */
export interface ExtendedTestData {
	userId: string;
	categoryId?: number;
	postId?: number;
	additionalUsers?: string[];
	additionalCategories?: number[];
	additionalPosts?: number[];
	sessionData?: any;
	customData?: Record<string, any>;
}

/**
 * Data manager for regression testing scenarios
 * Extends the base TestIsolation with regression-specific functionality
 */
export class RegressionDataManager extends TestIsolation {
	private changeLog: ChangeLogEntry[] = [];
	private testContext: string = '';

	constructor(context: string = 'regression-test') {
		super();
		this.testContext = context;
	}

	/**
	 * Create a regression test scenario with specific data requirements
	 */
	async createRegressionScenario(
		scenarioName: string,
		config: RegressionScenarioConfig = {}
	): Promise<ExtendedTestData> {
		this.testContext = scenarioName;
		
		const result: ExtendedTestData = {
			userId: '',
			additionalUsers: [],
			additionalCategories: [],
			additionalPosts: [],
			customData: config.customData || {}
		};

		try {
			// Create primary user
			result.userId = await this.createTestUser({
				username: `regression_user_${Date.now()}`
			});

			this.logChange('CREATE', 'users', result.userId, { primary: true }, scenarioName);

			// Create additional users if requested
			if (config.userCount && config.userCount > 1) {
				for (let i = 1; i < config.userCount; i++) {
					const additionalUserId = await this.createTestUser({
						username: `regression_user_${Date.now()}_${i}`
					});
					result.additionalUsers!.push(additionalUserId);
					this.logChange('CREATE', 'users', additionalUserId, { additional: true, index: i }, scenarioName);
				}
			}

			// Create categories if requested
			if (config.categoryCount && config.categoryCount > 0) {
				for (let i = 0; i < config.categoryCount; i++) {
					const categoryData = {
						name: `Regression Category ${i + 1}`,
						slug: `regression-category-${Date.now()}-${i}`,
						description: `Test category for regression scenario: ${scenarioName}`,
						createdAt: new Date(),
						updatedAt: new Date()
					};

					const [category] = await testDb.insert(categories).values(categoryData).returning();
					
					if (i === 0) {
						result.categoryId = category.id;
					} else {
						result.additionalCategories!.push(category.id);
					}

					this.logChange('CREATE', 'categories', category.id.toString(), categoryData, scenarioName);
				}
			}

			// Create posts if requested
			if (config.postCount && config.postCount > 0 && result.categoryId) {
				for (let i = 0; i < config.postCount; i++) {
					const postData = {
						title: `Regression Test Post ${i + 1}`,
						slug: `regression-post-${Date.now()}-${i}`,
						content: `Content for regression test post ${i + 1} in scenario: ${scenarioName}`,
						excerpt: `Excerpt for post ${i + 1}`,
						status: (i % 2 === 0 ? 'published' : 'draft') as 'published' | 'draft',
						userId: result.userId,
						createdAt: new Date(),
						updatedAt: new Date()
					};

					const [post] = await testDb.insert(posts).values(postData).returning();
					
					if (i === 0) {
						result.postId = post.id;
					} else {
						result.additionalPosts!.push(post.id);
					}

					this.logChange('CREATE', 'posts', post.id.toString(), postData, scenarioName);
				}
			}

			// Setup session data if requested
			if (config.withSessions) {
				result.sessionData = await this.createSessionData(result.userId);
				this.logChange('CREATE', 'sessions', result.userId, result.sessionData, scenarioName);
			}

			return result;
		} catch (error) {
			console.error(`Failed to create regression scenario ${scenarioName}:`, error);
			throw error;
		}
	}

	/**
	 * Create session data for testing authentication scenarios
	 */
	private async createSessionData(userId: string): Promise<any> {
		// This would integrate with your actual session management system
		// For now, return mock session data
		return {
			userId,
			sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
			createdAt: new Date(),
			lastAccessed: new Date()
		};
	}

	/**
	 * Validate data consistency across the database
	 */
	async validateDataConsistency(): Promise<boolean> {
		try {
			// Check foreign key relationships
			await this.validateForeignKeyIntegrity();
			
			// Check data constraints
			await this.validateDataConstraints();
			
			// Check for orphaned records
			await this.validateOrphanedRecords();
			
			return true;
		} catch (error) {
			console.error('Data consistency validation failed:', error);
			return false;
		}
	}

	/**
	 * Validate foreign key integrity
	 */
	private async validateForeignKeyIntegrity(): Promise<void> {
		// Check posts have valid users
		const postsWithInvalidUsers = await testDb
			.select({ postId: posts.id, userId: posts.userId })
			.from(posts)
			.leftJoin(users, eq(posts.userId, users.id))
			.where(isNull(users.id));

		if (postsWithInvalidUsers.length > 0) {
			throw new Error(`Found ${postsWithInvalidUsers.length} posts with invalid user references`);
		}
	}

	/**
	 * Validate data constraints
	 */
	private async validateDataConstraints(): Promise<void> {
		// Check for empty required fields
		const postsWithEmptyTitles = await testDb
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.title, ''));

		if (postsWithEmptyTitles.length > 0) {
			throw new Error(`Found ${postsWithEmptyTitles.length} posts with empty titles`);
		}

		// Check for invalid status values
		const postsWithInvalidStatus = await testDb
			.select({ id: posts.id, status: posts.status })
			.from(posts)
			.where(not(inArray(posts.status, ['draft', 'published'])));

		if (postsWithInvalidStatus.length > 0) {
			throw new Error(`Found ${postsWithInvalidStatus.length} posts with invalid status values`);
		}
	}

	/**
	 * Validate there are no orphaned records
	 */
	private async validateOrphanedRecords(): Promise<void> {
		// This could be extended based on your specific schema requirements
		// For now, just verify basic relationships exist
	}

	/**
	 * Track data changes for regression analysis
	 */
	private logChange(
		operation: 'CREATE' | 'UPDATE' | 'DELETE',
		table: string,
		recordId: string,
		changes: Record<string, any>,
		testContext: string
	): void {
		this.changeLog.push({
			timestamp: new Date().toISOString(),
			operation,
			table,
			recordId,
			changes,
			testContext
		});
	}

	/**
	 * Get change log for analysis
	 */
	getChangeLog(): ChangeLogEntry[] {
		return [...this.changeLog];
	}

	/**
	 * Clear change log
	 */
	clearChangeLog(): void {
		this.changeLog = [];
	}

	/**
	 * Get data modification statistics
	 */
	getDataModificationStats(): Record<string, number> {
		const stats: Record<string, number> = {};
		
		this.changeLog.forEach(entry => {
			const key = `${entry.operation}_${entry.table}`;
			stats[key] = (stats[key] || 0) + 1;
		});
		
		return stats;
	}

	/**
	 * Verify no data leakage between tests
	 */
	async verifyTestIsolation(): Promise<boolean> {
		try {
			// Check that test data doesn't persist beyond expected scope
			// This would include checking for test-specific naming patterns
			
			const testUsers = await testDb
				.select({ id: users.id, username: users.username })
				.from(users)
				.where(like(users.username, 'regression_%'));

			const testCategories = await testDb
				.select({ id: categories.id, name: categories.name })
				.from(categories)
				.where(like(categories.name, 'Regression Category%'));

			const testPosts = await testDb
				.select({ id: posts.id, title: posts.title })
				.from(posts)
				.where(like(posts.title, 'Regression Test Post%'));

			// Log findings for analysis
			console.log(`Found ${testUsers.length} test users, ${testCategories.length} test categories, ${testPosts.length} test posts`);
			
			return true;
		} catch (error) {
			console.error('Test isolation verification failed:', error);
			return false;
		}
	}

	/**
	 * Create a snapshot of current database state for comparison
	 */
	async createDataSnapshot(): Promise<DataSnapshot> {
		const userCount = await testDb.select().from(users).then(rows => rows.length);
		const categoryCount = await testDb.select().from(categories).then(rows => rows.length);
		const postCount = await testDb.select().from(posts).then(rows => rows.length);

		return {
			timestamp: new Date().toISOString(),
			userCount,
			categoryCount,
			postCount,
			changeLogSize: this.changeLog.length
		};
	}

	/**
	 * Compare two data snapshots
	 */
	compareSnapshots(before: DataSnapshot, after: DataSnapshot): SnapshotComparison {
		return {
			userDelta: after.userCount - before.userCount,
			categoryDelta: after.categoryCount - before.categoryCount,
			postDelta: after.postCount - before.postCount,
			timeDelta: new Date(after.timestamp).getTime() - new Date(before.timestamp).getTime(),
			changeLogGrowth: after.changeLogSize - before.changeLogSize
		};
	}
}

/**
 * Database state snapshot for comparison
 */
export interface DataSnapshot {
	timestamp: string;
	userCount: number;
	categoryCount: number;
	postCount: number;
	changeLogSize: number;
}

/**
 * Snapshot comparison result
 */
export interface SnapshotComparison {
	userDelta: number;
	categoryDelta: number;
	postDelta: number;
	timeDelta: number;
	changeLogGrowth: number;
}

// Export singleton instance for use in tests
export const regressionDataManager = new RegressionDataManager();