import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../../src/lib/server/db/schema';

// テスト用データベース接続
let testDbClient: ReturnType<typeof createClient>;
export let testDb: ReturnType<typeof drizzle>;

/**
 * 統合テスト用のセットアップ
 */

beforeAll(async () => {
	// テスト開始前の初期化
	console.log('Setting up integration tests...');

	// テスト専用のデータベース接続を作成（各テストで新しいメモリDBを使用）
	testDbClient = createClient({
		url: ':memory:'
	});
	testDb = drizzle(testDbClient, { schema });

	// テーブルを作成
	try {
		// Drizzleスキーマを使用してテーブルを作成
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
			seo_title TEXT,
			seo_description TEXT,
			seo_keywords TEXT,
			FOREIGN KEY (user_id) REFERENCES users(id)
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

		console.log('Test database schema created');
	} catch (error) {
		console.log('Database schema creation failed:', error);
	}

	console.log('Integration test environment ready');
});

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
			await testDb.run('DELETE FROM posts_to_categories');
			await testDb.run('DELETE FROM sessions');
			await testDb.run('DELETE FROM posts');
			await testDb.run('DELETE FROM categories');
			await testDb.run('DELETE FROM users');
			await testDb.run('PRAGMA foreign_keys = ON');
		} catch (error) {
			console.log('Database cleanup failed:', error);
		}
	}
});
