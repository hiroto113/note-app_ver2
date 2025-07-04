import { beforeAll, afterAll } from 'vitest';

/**
 * 統合テスト用のセットアップ
 */

beforeAll(async () => {
	// テスト開始前の初期化
	console.log('Setting up integration tests...');

	// データベース接続は各テストで個別に管理
	console.log('Integration test environment ready');
});

afterAll(async () => {
	// テスト終了後のクリーンアップ
	console.log('Cleaning up integration tests...');

	// データベース接続のクリーンアップ
	// Note: libsql client doesn't have explicit close method
	// The connection will be closed when the process exits
});
