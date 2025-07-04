import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * 統合テスト用のセットアップ
 */

beforeAll(async () => {
	// テスト開始前の初期化
	console.log('Setting up integration tests...');

	// 既存のテストデータベースを削除
	if (existsSync('test.db')) {
		try {
			await unlink('test.db');
			console.log('Existing test database removed');
		} catch {
			console.log('Could not remove existing test database');
		}
	}

	// データベースマイグレーションを実行
	try {
		execSync('pnpm run db:migrate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'file:test.db' } });
		console.log('Database migration completed');
	} catch {
		console.log('Migration already applied or skipped');
	}

	console.log('Integration test environment ready');
});

afterAll(async () => {
	// テスト終了後のクリーンアップ
	console.log('Cleaning up integration tests...');

	// テストデータベースを削除
	if (existsSync('test.db')) {
		try {
			await unlink('test.db');
			console.log('Test database cleaned up');
		} catch {
			console.log('Could not clean up test database');
		}
	}
});
