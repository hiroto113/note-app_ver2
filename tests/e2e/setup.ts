import { test as setup, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * E2Eテスト用のグローバルセットアップ
 */
setup('prepare database', async ({ page }) => {
  console.log('Setting up test database...');
  
  try {
    // データベースのマイグレーションとシードデータの準備
    await execAsync('pnpm run db:migrate');
    await execAsync('pnpm run db:seed');
    console.log('Database setup completed');
  } catch (error) {
    console.log('Database already exists or setup skipped');
  }
  
  // アプリケーションが起動していることを確認
  await page.goto('/');
  await expect(page).toHaveTitle(/My Notes/);
  console.log('Application is ready for E2E testing');
});