# 公開用API 詳細設計書

## 1. 概要

- 公開側のフロントエンドから利用するRESTful APIエンドポイントを実装します
- 認証不要で、公開されている記事とカテゴリ情報を取得できるAPIを提供します
- 関連する全体設計: `design.md` セクション2（システムアーキテクチャ）、セクション10（データモデル）

## 2. 実装仕様

### 2.1 コンポーネント設計

公開用APIはSvelteKitのAPI Routesを使用して実装します。

#### ディレクトリ構造
```
src/routes/api/
├── posts/
│   ├── +server.ts      # GET: 記事一覧
│   └── [slug]/
│       └── +server.ts  # GET: 個別記事
└── categories/
    └── +server.ts      # GET: カテゴリ一覧
```

### 2.2 APIエンドポイント

#### 2.2.1 記事一覧取得API

- **URL**: `/api/posts`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (number, optional): ページ番号（デフォルト: 1）
  - `limit` (number, optional): 1ページあたりの記事数（デフォルト: 10、最大: 50）
  - `category` (string, optional): カテゴリIDでフィルタリング
- **Response**:
  ```json
  {
    "posts": [
      {
        "id": 1,
        "slug": "getting-started-with-ai",
        "title": "AI開発入門",
        "excerpt": "記事の抜粋...",
        "publishedAt": "2024-06-20T00:00:00Z",
        "categories": [
          {
            "id": 1,
            "name": "AI"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```

#### 2.2.2 個別記事取得API

- **URL**: `/api/posts/[slug]`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "id": 1,
    "slug": "getting-started-with-ai",
    "title": "AI開発入門",
    "content": "記事本文（Markdown）",
    "publishedAt": "2024-06-20T00:00:00Z",
    "updatedAt": "2024-06-21T00:00:00Z",
    "categories": [
      {
        "id": 1,
        "name": "AI"
      }
    ]
  }
  ```
- **Error Response** (404):
  ```json
  {
    "error": "Post not found"
  }
  ```

#### 2.2.3 カテゴリ一覧取得API

- **URL**: `/api/categories`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "categories": [
      {
        "id": 1,
        "name": "AI",
        "slug": "ai",
        "postCount": 15
      },
      {
        "id": 2,
        "name": "Web開発",
        "slug": "web-development",
        "postCount": 10
      }
    ]
  }
  ```

## 3. データモデル

既存のデータベーススキーマ（`src/lib/server/db/schema.ts`）を使用します：
- `posts` テーブル
- `categories` テーブル
- `postsToCategories` テーブル（多対多リレーション）

公開APIでは以下の条件でフィルタリング：
- `posts.status = 'published'`
- `posts.publishedAt <= 現在時刻`

## 4. UI/UXデザイン

APIエンドポイントのため、UI/UXの変更はありません。

## 5. テスト計画

### 5.1 ユニットテスト
- 各APIエンドポイントの正常系テスト
- エラーハンドリングのテスト
- ページネーションのテスト
- フィルタリングのテスト

### 5.2 統合テスト
- データベース接続を含むE2Eテスト
- 実際のデータを使用したレスポンス検証

### 5.3 パフォーマンステスト
- 大量データでのレスポンス時間測定
- N+1問題の検証

## 6. 関連ドキュメント

- 全体設計書: `/doc/design.md`
- Issue定義書: `/doc/issues/phase-5/issue_public_api.md`
- データベーススキーマ: `/src/lib/server/db/schema.ts`