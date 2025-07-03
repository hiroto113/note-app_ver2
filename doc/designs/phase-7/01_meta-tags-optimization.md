# メタタグ最適化 詳細設計書

## 1. 概要

- SEO効果を最大化するため、各ページに適切なメタタグを設定します
- 動的コンテンツに対応したメタタグの自動生成機能を実装します
- 関連する全体設計（`design.md`）: 3.3 SEO対策機能、4.4 SEO要件

## 2. 実装仕様

### 2.1 コンポーネント設計

#### MetaHead.svelte
- **責務**: ページ固有のメタタグを管理
- **Props**:
  - `title`: ページタイトル
  - `description`: ページの説明
  - `keywords`: キーワード（オプション）
  - `type`: ページタイプ（article, website等）
  - `image`: OGP画像URL（オプション）
  - `publishedTime`: 記事公開日時（記事ページのみ）
  - `modifiedTime`: 記事更新日時（記事ページのみ）

### 2.2 実装内容

#### 基本メタタグ
```svelte
<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}
  <link rel="canonical" href={canonicalUrl} />
</svelte:head>
```

#### 構造化データ（JSON-LD）
- WebSiteスキーマ（トップページ）
- Articleスキーマ（記事ページ）
- BreadcrumbListスキーマ（全ページ）

### 2.3 ページ別メタタグ設定

1. **トップページ**
   - サイト全体の説明
   - WebSiteスキーマ

2. **記事一覧ページ**
   - カテゴリ別の動的description
   - ページネーション対応

3. **記事詳細ページ**
   - 記事の内容から自動生成
   - Articleスキーマ
   - 著者情報

4. **aboutページ**
   - 固定のメタタグ

## 3. データモデル

### 記事テーブルの拡張
- `seoTitle`: SEO用タイトル（オプション）
- `seoDescription`: SEO用説明文（オプション）
- `seoKeywords`: SEOキーワード（オプション）

## 4. UI/UXデザイン

- 管理画面の記事編集フォームにSEO設定セクションを追加
- 各フィールドに文字数カウンターを表示
- プレビュー機能で検索結果表示を確認可能

## 5. テスト計画

- メタタグの正確な出力確認
- 構造化データの検証（Google構造化データテストツール）
- 各ページでのメタタグ重複チェック
- 動的生成の性能テスト

## 6. 関連ドキュメント

- 関連Issue定義書: `/doc/issues/phase-7/issue_meta-tags-optimization.md`
- 全体設計書: `/doc/design.md` - 3.3 SEO対策機能