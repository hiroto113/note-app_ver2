# 記事CRUD API実装 詳細設計書

## 1. 概要
- 管理画面UIから記事の作成・一覧取得・更新・削除を行うためのAPIエンドポイント群を実装する。
- `doc/design.md`のアーキテクチャに基づき、管理用APIは`/api/admin/`配下に配置し、認証で保護する。

## 2. 実装仕様
- エンドポイントはSvelteKitのAPI Routes (`+server.ts`) を使用して実装する。
- 各エンドポイントでは、`hooks.server.ts`で設定された認証情報 (`event.locals.user`) を確認し、不正なアクセスは拒否する。

### 2.1 エンドポイント詳細
- **`POST /api/admin/posts` (記事の新規作成)**
  - リクエストボディ: `{ title: string, content: string, status: 'draft'|'published', categoryIds: number[] }`
  - 処理:
    - `posts`テーブルに新しいレコードを作成。
    - `slug`はタイトルから自動生成する。
    - `posts_to_categories`中間テーブルにカテゴリ情報を保存。
  - レスポンス: 作成された記事のID。
- **`GET /api/admin/posts` (記事の一覧取得)**
  - 処理: `posts`テーブルからすべての記事（下書き含む）を新しい順に取得する。
  - レスポンス: 記事オブジェクトの配列。
- **`PUT /api/admin/posts/[id]` (記事の更新)**
  - リクエストボディ: `{ title: string, content: string, status: 'draft'|'published', categoryIds: number[] }`
  - 処理: 指定されたIDの記事を更新する。カテゴリ情報も更新する。
  - レスポンス: 成功ステータス。
- **`DELETE /api/admin/posts/[id]` (記事の削除)**
  - 処理: 指定されたIDの記事を削除する。関連する中間テーブルのエントリも削除する。
  - レスポンス: 成功ステータス。

## 3. データモデル
- `01_database-setup.md`で定義した `posts`, `categories`, `posts_to_categories` テーブルを使用する。

## 4. UI/UXデザイン
- このタスクによるUIの変更はなし。

## 5. テスト計画
- APIテスティングツール（例: VSCodeのREST Client拡張）や`fetch`を用いたテストスクリプトで、各エンドポイントが仕様通りに動作することを確認する。
  - [ ] 記事の作成が成功すること。
  - [ ] 記事の一覧が取得できること。
  - [ ] 記事の更新が成功すること。
  - [ ] 記事の削除が成功すること。
  - [ ] 未認証のアクセスがすべて拒否されること。

## 6. 関連ドキュメント
- `doc/designs/phase-3/01_database-setup.md`
- `doc/issues/phase-3/issue_03_posts-crud-api.md` (作成予定) 