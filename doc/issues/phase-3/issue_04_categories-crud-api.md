---
name: Feature Request
about: カテゴリ管理API実装
title: '[Phase3] [feature] カテゴリ管理API実装'
assignees: 'hiroto113'
labels:
  - 'type:feature'
  - 'scope:backend'
  - 'priority:high'
  - 'phase:3'
---

## 1. 目的・背景
管理画面からカテゴリのCRUD操作を可能にするためのAPIを実装する。

## 2. 実装内容・変更点
- [ ] `src/routes/api/admin/categories/+server.ts` を作成
  - `GET`メソッドでカテゴリ一覧を取得する処理を実装
  - `POST`メソッドでカテゴリを新規作成する処理を実装
  - `PUT`メソッドでカテゴリを更新する処理を実装
  - `DELETE`メソッドでカテゴリを削除する処理を実装
- [ ] すべてのAPIは認証チェックを行い、未認証アクセスを拒否する

## 3. 受け入れ基準
- [ ] `POST /api/admin/categories` でカテゴリが作成できる
- [ ] `GET /api/admin/categories` でカテゴリ一覧が取得できる
- [ ] `PUT /api/admin/categories` でカテゴリが更新できる
- [ ] `DELETE /api/admin/categories` でカテゴリが削除できる

## 4. 関連Issue/PR
- 関連ドキュメント: `doc/designs/phase-3/04_categories-crud-api.md` 