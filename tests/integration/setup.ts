import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../../src/lib/server/db/schema';
import { unlinkSync, existsSync } from 'fs';
import { getOptimalDatabaseUrl, getDatabaseConfig } from './utils/environment';

// データベース接続のシングルトン管理
class DatabaseManager {
	private static instance: DatabaseManager;
	private _client: ReturnType<typeof createClient> | null = null;
	private _db: ReturnType<typeof drizzle> | null = null;
	private _isInitialized = false;
	private _dbPath: string | null = null;

	private constructor() {}

	static getInstance(): DatabaseManager {
		if (!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager();
		}
		return DatabaseManager.instance;
	}

	getClient(): ReturnType<typeof createClient> {
		if (!this._client) {
			// Use environment-optimized database configuration
			const databaseUrl = getOptimalDatabaseUrl();
			const config = getDatabaseConfig();

			this._client = createClient({
				url: databaseUrl,
				// Configure for better concurrency and performance
				...(databaseUrl !== ':memory:' &&
					{
						// Enable WAL mode for better concurrency (file databases only)
						// Note: This is handled at the SQL level after connection
					})
			});

			// Store the path for cleanup if it's a file database
			if (config.isTemporary && databaseUrl.startsWith('file:')) {
				this._dbPath = databaseUrl.replace('file:', '');
			}

			console.log(`Database initialized: ${databaseUrl} (cleanup: ${config.cleanup})`);
		}
		return this._client;
	}

	getDb(): ReturnType<typeof drizzle> {
		if (!this._db) {
			this._db = drizzle(this.getClient(), { schema });
		}
		return this._db;
	}

	isInitialized(): boolean {
		return this._isInitialized;
	}

	setInitialized(value: boolean): void {
		this._isInitialized = value;
	}

	async close(): Promise<void> {
		if (this._client) {
			this._client.close();
			this._client = null;
			this._db = null;
			this._isInitialized = false;

			// Clean up database file based on environment configuration
			const config = getDatabaseConfig();
			if (config.cleanup && this._dbPath && existsSync(this._dbPath)) {
				try {
					unlinkSync(this._dbPath);
					console.log(`Cleaned up test database: ${this._dbPath}`);
				} catch (error) {
					console.warn(`Failed to cleanup test database: ${this._dbPath}`, error);
				}
			}
			this._dbPath = null;
		}
	}
}

// シングルトンインスタンス
const dbManager = DatabaseManager.getInstance();

// 後方互換性のためのエクスポート
export const testDb = new Proxy({} as ReturnType<typeof drizzle>, {
	get(target, prop) {
		const db = dbManager.getDb();
		return db[prop as keyof typeof db];
	}
});

// ヘルパー関数
export function getTestDb() {
	return dbManager.getDb();
}

export function isDbInitialized() {
	return dbManager.isInitialized();
}

export function setDbInitialized(value: boolean) {
	dbManager.setInitialized(value);
}

/**
 * 統合テスト用のセットアップ - 2025年ベストプラクティス対応
 * Drizzle migrateファンクションを使用してスキーマを確実に作成
 */
async function initializeDatabase() {
	if (isDbInitialized()) {
		return;
	}

	const db = getTestDb();

	// テスト開始前の初期化
	console.log('Setting up integration tests...');

	// SQLite最適化設定
	try {
		await db.run('PRAGMA journal_mode = WAL');
		await db.run('PRAGMA synchronous = NORMAL');
		await db.run('PRAGMA cache_size = 1000');
		await db.run('PRAGMA foreign_keys = ON');
		await db.run('PRAGMA temp_store = MEMORY');
		await db.run('PRAGMA busy_timeout = 5000'); // 5 second timeout
		console.log('SQLite optimizations applied');
	} catch (error) {
		console.log('SQLite optimization failed:', error);
	}

	// マイグレーションを実行してスキーマを作成
	try {
		console.log('Running migrations...');
		await migrate(db, { migrationsFolder: './drizzle' });
		console.log('Test database schema created via migrations');
	} catch (error) {
		console.log('Migration failed, falling back to manual schema creation:', error);
		// フォールバック: 手動でテーブルを作成
		await createTablesManually();
	}

	// Verify that all tables exist
	try {
		await db.run(`SELECT 1 FROM posts_to_categories LIMIT 0`);
		console.log('posts_to_categories table verified');
	} catch (error) {
		console.error('posts_to_categories table is missing after setup!');
		// Try to create it manually if it's missing
		await db.run(`CREATE TABLE IF NOT EXISTS posts_to_categories (
			post_id INTEGER NOT NULL,
			category_id INTEGER NOT NULL,
			PRIMARY KEY (post_id, category_id),
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
		)`);
		console.log('posts_to_categories table created manually');
	}

	setDbInitialized(true);
	console.log('Integration test environment ready');
}

beforeAll(async () => {
	await initializeDatabase();
});

/**
 * フォールバック用の手動テーブル作成
 */
async function createTablesManually() {
	try {
		const db = getTestDb();
		await db.run(`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			hashed_password TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`);

		await db.run(`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			slug TEXT NOT NULL UNIQUE,
			description TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`);

		await db.run(`CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			content TEXT NOT NULL,
			excerpt TEXT,
			status TEXT NOT NULL DEFAULT 'draft',
			published_at INTEGER,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			user_id TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`);

		await db.run(`CREATE TABLE IF NOT EXISTS posts_to_categories (
			post_id INTEGER NOT NULL,
			category_id INTEGER NOT NULL,
			PRIMARY KEY (post_id, category_id),
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
		)`);

		await db.run(`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at INTEGER NOT NULL,
			created_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`);

		await db.run(`CREATE TABLE IF NOT EXISTS media (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			filename TEXT NOT NULL UNIQUE,
			original_name TEXT NOT NULL,
			mime_type TEXT NOT NULL,
			size INTEGER NOT NULL,
			url TEXT NOT NULL,
			uploaded_by TEXT NOT NULL,
			uploaded_at INTEGER NOT NULL,
			FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
		)`);

		console.log('Manual table creation completed');
	} catch (error) {
		console.error('Manual table creation failed:', error);
		throw error;
	}
}

afterAll(async () => {
	// テスト終了後のクリーンアップ
	console.log('Cleaning up integration tests...');
	const dbManager = DatabaseManager.getInstance();
	await dbManager.close();
});

beforeEach(async () => {
	// データベースが初期化されていない場合は初期化
	await initializeDatabase();

	// テスト分離ユーティリティを使用してクリーンアップ
	try {
		const { testIsolation } = await import('./utils/test-isolation');
		await testIsolation.cleanDatabase();
	} catch (error) {
		console.log('Database cleanup failed:', error);
		// Fallback to manual cleanup
		const db = getTestDb();
		await db.run('PRAGMA foreign_keys = OFF');
		const tables = ['posts_to_categories', 'media', 'sessions', 'posts', 'categories', 'users'];
		for (const table of tables) {
			try {
				await db.run(`DELETE FROM ${table}`);
			} catch (e) {
				console.log(`Table ${table} not found, skipping cleanup`);
			}
		}
		await db.run('PRAGMA foreign_keys = ON');
	}
});
