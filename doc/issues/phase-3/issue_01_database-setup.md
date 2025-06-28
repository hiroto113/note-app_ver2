---
name: Feature Request
about: データベース設定（ORM導入、スキーマ定義）
title: '[Phase3] [feature] データベース設定（ORM導入、スキーマ定義）'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:backend'
    - 'priority:high'
    - 'phase:3'
---

## 1. 目的・背景

管理画面機能の実装に向け、記事やユーザー情報を永続化するためのデータベース基盤を構築する。

## 2. 実装内容・変更点

- [ ] `drizzle-orm`, `drizzle-kit`, `@libsql/client`をインストールする
- [ ] `drizzle.config.ts`を作成・設定する
- [ ] `src/lib/server/db/schema.ts`にテーブルスキーマを定義する (`users`, `sessions`, `posts`, `categories`, `posts_to_categories`)
- [ ] `src/lib/server/db/index.ts`でDBクライアントを初期化する
- [ ] `drizzle-kit push`を実行し、`local.db`にスキーマを反映させる

## 3. 受け入れ基準

- [ ] `drizzle-kit push`がエラーなく完了する
- [ ] 作成された`local.db`をDBブラウザ等で開き、すべてのテーブルとカラムが正しく作成されていることを確認できる

## 4. 関連Issue/PR

- 関連ドキュメント: `doc/designs/phase-3/01_database-setup.md`
