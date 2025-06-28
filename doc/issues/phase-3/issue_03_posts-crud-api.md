---
name: Feature Request
about: 記事CRUD API実装
title: '[Phase3] [feature] 記事CRUD API実装'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:backend'
    - 'priority:high'
    - 'phase:3'
---

## 1. 目的・背景

管理画面から記事のCRUD（作成、読み取り、更新、削除）操作を可能にするためのAPIを実装する。

## 2. 実装内容・変更点

- [ ] `src/routes/api/admin/posts/+server.ts` を作成
    - `GET`メソッドで全記事（下書き含む）を一覧取得する処理を実装
    - `POST`メソッドで記事を新規作成する処理を実装
- [ ] `src/routes/api/admin/posts/[id]/+server.ts` を作成
    - `PUT`メソッドで既存の記事を更新する処理を実装
    - `DELETE`メソッドで記事を削除する処理を実装
- [ ] すべてのAPIは認証チェックを行い、未認証アクセスを拒否する

## 3. 受け入れ基準

- [ ] `POST /api/admin/posts` で記事が作成できる
- [ ] `GET /api/admin/posts` で記事一覧が取得できる
- [ ] `PUT /api/admin/posts/[id]` で記事が更新できる
- [ ] `DELETE /api/admin/posts/[id]` で記事が削除できる

## 4. 関連Issue/PR

- 関連ドキュメント: `doc/designs/phase-3/03_posts-crud-api.md`
