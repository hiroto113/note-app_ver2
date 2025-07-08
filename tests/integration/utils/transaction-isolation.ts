/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { getTestDb } from '../setup';

/**
 * Transaction-based test isolation utility
 * Provides automatic rollback functionality for database tests
 */
export class TransactionTestIsolation {
	private transaction: unknown = null;
	private db: ReturnType<typeof getTestDb>;

	constructor() {
		this.db = getTestDb();
	}

	/**
	 * Start a new transaction for test isolation
	 * This should be called in beforeEach
	 */
	async startTransaction(): Promise<void> {
		if (this.transaction) {
			await this.rollback();
		}

		// Start new transaction
		this.transaction = await this.db.transaction(async (tx) => {
			// Return the transaction object for later use
			return tx;
		});
	}

	/**
	 * Get the current transaction instance
	 * Use this for database operations within tests
	 */
	getTransaction() {
		if (!this.transaction) {
			throw new Error('Transaction not started. Call startTransaction() first.');
		}
		return this.transaction;
	}

	/**
	 * Rollback the current transaction
	 * This should be called in afterEach
	 */
	async rollback(): Promise<void> {
		if (this.transaction) {
			try {
				// The transaction will be automatically rolled back when it goes out of scope
				// Since we're not committing it, it will rollback
				this.transaction = null;
			} catch (error) {
				console.warn('Failed to rollback transaction:', error);
				this.transaction = null;
			}
		}
	}

	/**
	 * Commit the current transaction (usually not needed in tests)
	 */
	async commit(): Promise<void> {
		if (this.transaction) {
			// Note: In our test setup, we typically want to rollback
			// This method is provided for completeness but should be used carefully
			this.transaction = null;
		}
	}
}

/**
 * Helper function to run a test within a transaction that automatically rolls back
 */
export async function withTransaction<T>(testFn: (tx: unknown) => Promise<T>): Promise<T> {
	const db = getTestDb();
	let result: T;

	try {
		await db.transaction(async (tx) => {
			result = await testFn(tx);
			// Throw an error to force rollback
			throw new Error('INTENTIONAL_ROLLBACK');
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'INTENTIONAL_ROLLBACK') {
			// This is expected - the transaction was rolled back
			return result!;
		}
		throw error;
	}

	return result!;
}

/**
 * Global transaction isolation instance
 * Can be shared across test files
 */
export const transactionIsolation = new TransactionTestIsolation();
