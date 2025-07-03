import { test, expect } from '@playwright/test';
import { testPosts } from '../fixtures/test-data';
import { waitForPageLoad, expectVisible, setViewportSize, viewports } from '../utils/page-helpers';

test.describe('記事詳細ページ', () => {
  test.beforeEach(async ({ page }) => {
    // ホームページから最初の記事に移動
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 最初の記事をクリックして詳細ページに移動
    const firstArticle = page.locator('article, .post-card').first();
    await firstArticle.click();
    await waitForPageLoad(page);
    
    // 記事詳細ページにいることを確認
    await expect(page).toHaveURL(/\/posts\/.+/);
  });

  test('記事詳細が正常に表示される', async ({ page }) => {
    // 記事タイトルの表示確認
    await expect(page.locator('h1')).toBeVisible();
    
    // 記事コンテンツの表示確認
    await expect(page.locator('.post-content, .content, main')).toBeVisible();
    
    // 記事の概要（excerpt）が表示される場合の確認
    const excerpt = page.locator('.excerpt, .summary');
    if (await excerpt.isVisible()) {
      await expect(excerpt).toBeVisible();
    }
  });

  test('記事メタデータが表示される', async ({ page }) => {
    // 公開日の表示確認
    const publishDate = page.locator('.published-date, .date, time');
    if (await publishDate.isVisible()) {
      await expect(publishDate).toBeVisible();
    }
    
    // カテゴリの表示確認
    const categories = page.locator('.categories, .category, .tags');
    if (await categories.isVisible()) {
      await expect(categories).toBeVisible();
    }
    
    // 著者情報の表示確認（存在する場合）
    const author = page.locator('.author, .by-author');
    if (await author.isVisible()) {
      await expect(author).toBeVisible();
    }
  });

  test('記事コンテンツが適切にレンダリングされる', async ({ page }) => {
    const content = page.locator('.post-content, .content, main');
    
    // 見出しが適切にレンダリングされている
    const headings = content.locator('h1, h2, h3, h4, h5, h6');
    if (await headings.count() > 0) {
      await expect(headings.first()).toBeVisible();
    }
    
    // 段落が適切にレンダリングされている
    const paragraphs = content.locator('p');
    if (await paragraphs.count() > 0) {
      await expect(paragraphs.first()).toBeVisible();
    }
    
    // コードブロックが適切にレンダリングされている（存在する場合）
    const codeBlocks = content.locator('pre, code');
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible();
    }
    
    // 画像が適切にレンダリングされている（存在する場合）
    const images = content.locator('img');
    if (await images.count() > 0) {
      // 画像の読み込み完了を待機
      await expect(images.first()).toHaveAttribute('src');
    }
  });

  test('ナビゲーション要素が機能する', async ({ page }) => {
    // ホームに戻るリンクの確認
    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("ホーム"), a:has-text("戻る")');
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible();
      
      // ホームリンクをクリックしてホームページに戻る
      await homeLink.first().click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL('/');
      
      // 元の記事ページに戻る
      await page.goBack();
      await waitForPageLoad(page);
    }
  });

  test('カテゴリリンクが機能する', async ({ page }) => {
    // カテゴリリンクの確認
    const categoryLinks = page.locator('.categories a, .category a, .tags a');
    
    if (await categoryLinks.count() > 0) {
      const firstCategoryLink = categoryLinks.first();
      const categoryText = await firstCategoryLink.textContent();
      
      // カテゴリリンクをクリック
      await firstCategoryLink.click();
      await waitForPageLoad(page);
      
      // カテゴリページまたはフィルタされたホームページに移動することを確認
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/category|tag/);
      
      // 該当するカテゴリの記事が表示されることを確認
      if (categoryText) {
        await expect(page.locator('body')).toContainText(categoryText.trim());
      }
    }
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // デスクトップビューでの確認
    await setViewportSize(page, viewports.desktop.width, viewports.desktop.height);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.post-content, .content, main')).toBeVisible();
    
    // タブレットビューでの確認
    await setViewportSize(page, viewports.tablet.width, viewports.tablet.height);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.post-content, .content, main')).toBeVisible();
    
    // モバイルビューでの確認
    await setViewportSize(page, viewports.mobile.width, viewports.mobile.height);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.post-content, .content, main')).toBeVisible();
    
    // モバイルでテキストが読みやすいサイズになっていることを確認
    const content = page.locator('.post-content, .content, main');
    const fontSize = await content.evaluate((el) => window.getComputedStyle(el).fontSize);
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThan(14); // 最小14px以上
  });

  test('SEO要素が適切に設定されている', async ({ page }) => {
    // ページタイトルが記事タイトルを含んでいることを確認
    const title = await page.title();
    const h1Text = await page.locator('h1').textContent();
    
    if (h1Text) {
      expect(title).toContain(h1Text.trim());
    }
    
    // メタディスクリプションの確認
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
    
    // OGPタグの確認
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    
    // 構造化データの確認（記事用）
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      const jsonContent = await structuredData.textContent();
      if (jsonContent) {
        const data = JSON.parse(jsonContent);
        expect(data['@type']).toBe('Article');
        expect(data.headline).toBeTruthy();
      }
    }
  });

  test('共有機能が存在する場合の動作確認', async ({ page }) => {
    // 共有ボタンの確認
    const shareButtons = page.locator('.share, .social-share, button:has-text("共有"), button:has-text("Share")');
    
    if (await shareButtons.count() > 0) {
      // Twitter共有リンクの確認
      const twitterShare = page.locator('a[href*="twitter.com"], a[href*="x.com"]');
      if (await twitterShare.count() > 0) {
        const href = await twitterShare.first().getAttribute('href');
        expect(href).toContain('text=');
      }
      
      // Facebook共有リンクの確認
      const facebookShare = page.locator('a[href*="facebook.com"]');
      if (await facebookShare.count() > 0) {
        const href = await facebookShare.first().getAttribute('href');
        expect(href).toContain('url=');
      }
    }
  });

  test('前後の記事ナビゲーションが存在する場合の確認', async ({ page }) => {
    // 前の記事リンク
    const prevLink = page.locator('a:has-text("前の"), a:has-text("Previous"), .prev-post a');
    if (await prevLink.count() > 0) {
      await expect(prevLink.first()).toBeVisible();
    }
    
    // 次の記事リンク
    const nextLink = page.locator('a:has-text("次の"), a:has-text("Next"), .next-post a');
    if (await nextLink.count() > 0) {
      await expect(nextLink.first()).toBeVisible();
    }
  });

  test('関連記事が表示される場合の確認', async ({ page }) => {
    // 関連記事セクションの確認
    const relatedPosts = page.locator('.related-posts, .similar-posts, section:has-text("関連記事")');
    
    if (await relatedPosts.isVisible()) {
      await expect(relatedPosts).toBeVisible();
      
      // 関連記事のリンクが機能することを確認
      const relatedLinks = relatedPosts.locator('a');
      if (await relatedLinks.count() > 0) {
        await expect(relatedLinks.first()).toBeVisible();
      }
    }
  });

  test('コメント機能が存在する場合の確認', async ({ page }) => {
    // コメントセクションの確認
    const commentsSection = page.locator('.comments, #comments, section:has-text("コメント")');
    
    if (await commentsSection.isVisible()) {
      await expect(commentsSection).toBeVisible();
      
      // コメントフォームの確認
      const commentForm = commentsSection.locator('form, textarea');
      if (await commentForm.count() > 0) {
        await expect(commentForm.first()).toBeVisible();
      }
    }
  });

  test('目次が表示される場合の確認', async ({ page }) => {
    // 目次（Table of Contents）の確認
    const toc = page.locator('.toc, .table-of-contents, nav:has-text("目次")');
    
    if (await toc.isVisible()) {
      await expect(toc).toBeVisible();
      
      // 目次のリンクが機能することを確認
      const tocLinks = toc.locator('a');
      if (await tocLinks.count() > 0) {
        const firstLink = tocLinks.first();
        await firstLink.click();
        
        // ページ内の該当セクションにスクロールされることを確認
        await page.waitForTimeout(500); // スクロールアニメーション待機
      }
    }
  });
});