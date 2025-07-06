import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../../src/lib/server/db/schema';

// テスト用データベース接続
let testDbClient: ReturnType<typeof createClient>;
export let testDb: ReturnType<typeof drizzle>;

/**
 * 統合テスト用のセットアップ - 2025年ベストプラクティス対応
 * Drizzle migrateファンクションを使用してスキーマを確実に作成
 */

beforeAll(async () => {
	// テスト開始前の初期化
	console.log('Setting up integration tests...');

	// テスト専用のデータベース接続を作成（各テストで新しいメモリDBを使用）
	testDbClient = createClient({
		url: ':memory:'
	});
	testDb = drizzle(testDbClient, { schema });

	// マイグレーションを実行してスキーマを作成
	try {
		console.log('Running migrations...');
		await migrate(testDb, { migrationsFolder: './drizzle' });
		console.log('Test database schema created via migrations');
	} catch (error) {
		console.log('Migration failed, falling back to manual schema creation:', error);
		// フォールバック: 手動でテーブルを作成
		await createTablesManually();
	}

	console.log('Integration test environment ready');
});

/**
 * フォールバック用の手動テーブル作成
 */
async function createTablesManually() {
	try {
		await testDb.run(`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			hashed_password TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`);

		await testDb.run(`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			slug TEXT NOT NULL UNIQUE,
			description TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`);

		await testDb.run(`CREATE TABLE IF NOT EXISTS posts (
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

		await testDb.run(`CREATE TABLE IF NOT EXISTS posts_to_categories (
			post_id INTEGER NOT NULL,
			category_id INTEGER NOT NULL,
			PRIMARY KEY (post_id, category_id),
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
		)`);

		await testDb.run(`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at INTEGER NOT NULL,
			created_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`);

		await testDb.run(`CREATE TABLE IF NOT EXISTS media (
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
	if (testDbClient) {
		testDbClient.close();
	}
});

beforeEach(async () => {
	// テスト前にテーブルをクリーンアップ
	if (testDb) {
		try {
			// Foreign key制約を無効化してからクリーンアップ
			await testDb.run('PRAGMA foreign_keys = OFF');

			// テーブルの存在確認とクリーンアップ
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
					await testDb.run(`DELETE FROM ${table}`);
				} catch {
					// テーブルが存在しない場合はスキップ
					console.log(`Table ${table} not found, skipping cleanup`);
				}
			}

			await testDb.run('PRAGMA foreign_keys = ON');
		} catch (error) {
			console.log('Database cleanup failed:', error);
		}
	}
});
