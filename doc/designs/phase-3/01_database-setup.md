# データベース設定（ORM導入、スキーマ定義） 詳細設計書

## 1. 概要

- `doc/design.md`で定義されたデータモデルを基に、データベースを操作するための環境を構築する。
- ORM (Object-Relational Mapper)として、SvelteKitとの親和性が高く、軽量なDrizzle ORMを採用する。
- データベースはSQLiteを使用し、Tursoと連携することでVercelデプロイ環境での永続化も視野に入れる。

## 2. 実装仕様

- **ライブラリのインストール**:
    - `drizzle-orm`: ORMコアライブラリ
    - `drizzle-kit`: マイグレーションツール
    - `@libsql/client`: SQLiteドライバ (Turso対応)
- **設定ファイルの作成**:
    - `drizzle.config.ts`: `drizzle-kit`用の設定ファイルを作成し、スキーマファイルの場所やデータベースの接続情報を記述する。
- **スキーマ定義**:
    - `src/lib/server/db/schema.ts`を作成し、`doc/design.md`のデータモデルに基づき、以下のテーブルを定義する。
        - `users`: 認証用テーブル（`id`, `username`, `hashed_password`）
        - `sessions`: Lucia Auth用セッションテーブル
        - `posts`: 記事テーブル
        - `categories`: カテゴリテーブル
        - `posts_to_categories`: 記事とカテゴリの中間テーブル
- **DBクライアントの初期化**:
    - `src/lib/server/db/index.ts`を作成し、DB接続クライアントを初期化・エクスポートする。

## 3. データモデル

- `src/lib/server/db/schema.ts`にDrizzle ORMの記法で定義する。`users`と`sessions`はLucia Authの要求仕様に合わせる。

## 4. UI/UXデザイン

- このタスクによるUIの変更はなし。

## 5. テスト計画

- [ ] `drizzle-kit push`コマンドを実行し、ローカルのSQLiteファイルにスキーマが正しく反映されることを確認する。
- [ ] 簡単なテストスクリプト（またはSvelteKitのAPIルート）を作成し、各テーブルへの基本的なCRUD操作（読み書き）が成功することを確認する。

## 6. 関連ドキュメント

- `doc/design.md` #10. データモデル
- `doc/issues/phase-3/issue_01_database-setup.md` (作成予定)
