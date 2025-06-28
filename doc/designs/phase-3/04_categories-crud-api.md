# カテゴリ管理API実装 詳細設計書

## 1. 概要

- 記事に紐付けるカテゴリを管理画面から操作するためのAPIエンドポイントを実装する。
- 記事APIと同様に、`/api/admin/`配下に配置し、認証で保護する。

## 2. 実装仕様

- エンドポイントは`src/routes/api/admin/categories/+server.ts`に実装する。
- 1つのファイルで複数のHTTPメソッドを処理する。

### 2.1 エンドポイント詳細 (`/api/admin/categories`)

- **`GET` (カテゴリ一覧取得)**
    - 処理: `categories`テーブルの全レコードを取得する。
    - レスポンス: カテゴリの配列 `[{ id: number, name: string }]`
- **`POST` (カテゴリ新規作成)**
    - リクエストボディ: `{ name: string }`
    - 処理: `categories`テーブルに新しいレコードを追加。
    - レスポンス: 作成されたカテゴリのID。
- **`PUT` (カテゴリ更新)**
    - リクエストボディ: `{ id: number, name: string }`
    - 処理: 指定されたIDのカテゴリ名を更新する。
    - レスポンス: 成功ステータス。
- **`DELETE` (カテゴリ削除)**
    - リクエストボディ: `{ id: number }`
    - 処理: 指定されたIDのカテゴリを削除する。
        - **注意**: 関連する `posts_to_categories` のレコードも削除する必要がある。
    - レスポンス: 成功ステータス。

## 3. データモデル

- `01_database-setup.md`で定義した `categories`, `posts_to_categories` テーブルを使用する。

## 4. UI/UXデザイン

- このタスクによるUIの変更はなし。

## 5. テスト計画

- APIテスティングツール等で、各メソッドが仕様通りに動作することを確認する。
    - [ ] カテゴリの作成、一覧取得、更新、削除が成功すること。
    - [ ] 存在しないカテゴリを更新・削除しようとした場合にエラーが返ること。
    - [ ] 未認証のアクセスがすべて拒否されること。

## 6. 関連ドキュメント

- `doc/designs/phase-3/01_database-setup.md`
- `doc/issues/phase-3/issue_04_categories-crud-api.md` (作成予定)
