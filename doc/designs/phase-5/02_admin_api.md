# 管理用API 詳細設計書

## 1. 概要

- 管理画面から利用する認証付きRESTful APIエンドポイントを実装します
- 記事とカテゴリのCRUD操作を提供し、認証されたユーザーのみアクセス可能です
- 関連する全体設計: `design.md` セクション2（システムアーキテクチャ）、セクション3.1（記事管理機能）

## 2. 実装仕様

### 2.1 コンポーネント設計

管理用APIはSvelteKitのAPI Routesとhooks.server.tsの認証チェックを組み合わせて実装します。

#### ディレクトリ構造

```
src/routes/api/admin/
├── posts/
│   ├── +server.ts      # GET: 全記事一覧, POST: 新規作成
│   └── [id]/
│       └── +server.ts  # GET: 個別取得, PUT: 更新, DELETE: 削除
└── categories/
    ├── +server.ts      # GET: 一覧, POST: 新規作成
    └── [id]/
        └── +server.ts  # PUT: 更新, DELETE: 削除
```

### 2.2 APIエンドポイント

#### 2.2.1 記事管理API

##### 全記事一覧取得

- **URL**: `/api/admin/posts`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {session_token}`
- **Query Parameters**:
    - `page` (number, optional): ページ番号
    - `limit` (number, optional): 1ページあたりの記事数
    - `status` (string, optional): 'published' | 'draft' | 'all'
- **Response**: 公開APIと同様だが、下書き記事も含む

##### 記事作成

- **URL**: `/api/admin/posts`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {session_token}`
- **Request Body**:
    ```json
    {
    	"title": "新しい記事タイトル",
    	"slug": "new-article-slug",
    	"content": "記事本文（Markdown）",
    	"status": "draft",
    	"categoryIds": [1, 2],
    	"publishedAt": "2024-06-20T00:00:00Z"
    }
    ```
- **Response**: 作成された記事オブジェクト

##### 記事更新

- **URL**: `/api/admin/posts/[id]`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {session_token}`
- **Request Body**: 作成時と同様（部分更新可能）
- **Response**: 更新された記事オブジェクト

##### 記事削除

- **URL**: `/api/admin/posts/[id]`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {session_token}`
- **Response**:
    ```json
    {
    	"success": true,
    	"message": "Post deleted successfully"
    }
    ```

#### 2.2.2 カテゴリ管理API

##### カテゴリ作成

- **URL**: `/api/admin/categories`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {session_token}`
- **Request Body**:
    ```json
    {
    	"name": "新カテゴリ",
    	"slug": "new-category"
    }
    ```

##### カテゴリ更新

- **URL**: `/api/admin/categories/[id]`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {session_token}`
- **Request Body**: 作成時と同様

##### カテゴリ削除

- **URL**: `/api/admin/categories/[id]`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {session_token}`
- **Response**: 成功/失敗メッセージ

### 2.3 認証処理

- すべての管理用APIエンドポイントは認証が必要
- `hooks.server.ts`で`/api/admin/*`へのアクセスをチェック
- 未認証の場合は401エラーを返す

### 2.4 エラーハンドリング

- 400: 不正なリクエスト（バリデーションエラー）
- 401: 認証エラー
- 403: 権限エラー
- 404: リソースが見つからない
- 500: サーバーエラー

## 3. データモデル

既存のスキーマを使用し、以下の処理を実装：

- トランザクション処理（記事とカテゴリの関連付け）
- 自動的なタイムスタンプ更新（createdAt, updatedAt）
- slugの一意性チェック

## 4. UI/UXデザイン

APIエンドポイントのため、UI/UXの変更はありません。

## 5. テスト計画

### 5.1 ユニットテスト

- 各CRUD操作の正常系テスト
- バリデーションエラーのテスト
- 認証チェックのテスト

### 5.2 統合テスト

- 記事作成から削除までの一連の流れ
- カテゴリとの関連付けテスト
- 権限チェックのテスト

### 5.3 セキュリティテスト

- SQLインジェクション対策の確認
- XSS対策（特にリッチテキスト）の確認
- 認証バイパスの試行

## 6. 関連ドキュメント

- 全体設計書: `/doc/design.md`
- Issue定義書: `/doc/issues/phase-5/issue_admin_api.md`
- 認証実装: Phase 3のドキュメント
