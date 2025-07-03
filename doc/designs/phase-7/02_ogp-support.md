# OGP対応 詳細設計書

## 1. 概要

- Open Graph Protocol（OGP）とTwitter Cardsに対応し、SNSシェア時の表示を最適化します
- 動的にOGP画像を生成する機能を実装します
- 関連する全体設計（`design.md`）: 3.3 SEO対策機能、4.4 SEO要件

## 2. 実装仕様

### 2.1 コンポーネント設計

#### OGPTags.svelte

- **責務**: OGPメタタグの管理
- **Props**:
    - `title`: OGPタイトル
    - `description`: OGP説明文
    - `type`: コンテンツタイプ（website, article等）
    - `image`: OGP画像URL
    - `url`: ページURL
    - `siteName`: サイト名
    - `locale`: 言語設定（ja_JP）

### 2.2 OGPメタタグ実装

#### 基本OGPタグ

```svelte
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content={type} />
<meta property="og:url" content={url} />
<meta property="og:image" content={image} />
<meta property="og:site_name" content={siteName} />
<meta property="og:locale" content={locale} />
```

#### Twitter Cards

```svelte
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />
```

### 2.3 動的OGP画像生成

#### 実装方針

- SvelteKitのAPIルートで動的に画像を生成
- `@vercel/og`または`satori`を使用
- キャッシュ戦略の実装

#### APIエンドポイント

- `GET /api/og/[slug]`
    - 記事タイトルとカテゴリを含むOGP画像を生成
    - SVGベースでレンダリング
    - PNGに変換して返却

### 2.4 デフォルトOGP画像

- サイト全体のデフォルトOGP画像を用意
- 記事以外のページで使用
- `/static/og-default.png`に配置

## 3. データモデル

### 記事テーブルの拡張

- `ogImage`: カスタムOGP画像URL（オプション）
- デフォルトは動的生成画像を使用

## 4. UI/UXデザイン

### 管理画面での設定

- OGP画像のプレビュー機能
- カスタム画像のアップロード機能
- Facebook/Twitterでの表示プレビュー

### 生成される画像デザイン

- サイトロゴ
- 記事タイトル（最大2行）
- カテゴリタグ
- 背景グラデーション

## 5. テスト計画

- OGPデバッガーでの検証
    - Facebook Sharing Debugger
    - Twitter Card Validator
- 画像生成のパフォーマンステスト
- キャッシュ機能の動作確認
- 各SNSでの実際の表示確認

## 6. 関連ドキュメント

- 関連Issue定義書: `/doc/issues/phase-7/issue_ogp-support.md`
- 全体設計書: `/doc/design.md` - 3.3 SEO対策機能
