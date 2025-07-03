# Lighthouse最適化 詳細設計書

## 1. 概要

- Lighthouseスコアを全カテゴリで90以上に最適化します
- 継続的なパフォーマンス監視体制を構築します
- 関連する全体設計（`design.md`）: 4.1 パフォーマンス要件

## 2. 実装仕様

### 2.1 Performance最適化

#### 主要施策
1. **リソースの最適化**
   - 未使用JavaScriptの削除
   - CSSの最小化
   - 画像の最適化（既に実装予定）

2. **レンダリングの最適化**
   - レンダリングブロッキングリソースの排除
   - 非同期/遅延読み込みの活用

3. **サーバー応答時間**
   - 適切なキャッシュヘッダー
   - CDNの活用（Vercel Edge Network）

### 2.2 Accessibility最適化

#### 実装内容
1. **残存課題の解決**
   - コントラスト比の再確認
   - フォーカスインジケータの改善
   - スクリーンリーダーテキストの充実

2. **追加改善**
   - ランドマークの適切な使用
   - 見出し階層の整理
   - フォームラベルの改善

### 2.3 Best Practices最適化

#### セキュリティ対策
1. **HTTPSの強制**
   - すべてのリソースをHTTPS化
   - mixed contentの排除

2. **セキュリティヘッダー**
   ```javascript
   // hooks.server.ts
   export const handle = async ({ event, resolve }) => {
     const response = await resolve(event);
     response.headers.set('X-Frame-Options', 'DENY');
     response.headers.set('X-Content-Type-Options', 'nosniff');
     response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
     return response;
   };
   ```

3. **依存関係の管理**
   - 脆弱性のあるパッケージの更新
   - 定期的な監査

### 2.4 SEO最適化

#### 実装内容
1. **クローラビリティ**
   - robots.txtの最適化
   - XMLサイトマップの自動生成

2. **構造化データ**
   - 適切なスキーママークアップ
   - リッチスニペット対応

3. **モバイル対応**
   - viewport設定の確認
   - タップターゲットのサイズ最適化

### 2.5 継続的な監視

#### Lighthouse CI設定
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
          uploadArtifacts: true
          temporaryPublicStorage: true
```

#### 監視設定
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './build',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}]
      }
    }
  }
};
```

## 3. データモデル

変更なし

## 4. UI/UXデザイン

- パフォーマンス改善による体感速度の向上
- アクセシビリティ改善による使いやすさ向上

## 5. テスト計画

### Lighthouse監視
- PR毎の自動チェック
- 本番デプロイ後の確認
- 定期的な手動監査

### テスト項目
- 各ページでのLighthouseスコア測定
- モバイル/デスクトップ両方での確認
- 低速ネットワークでのテスト

## 6. 関連ドキュメント

- 関連Issue定義書: `/doc/issues/phase-7/issue_lighthouse-optimization.md`
- 全体設計書: `/doc/design.md` - 4.1 パフォーマンス要件