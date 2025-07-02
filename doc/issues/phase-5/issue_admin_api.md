---
title: '[Task] 管理用APIの実装'
labels: 'task,backend,phase-5,security'
assignees: ''
---

## タスク概要

管理画面から利用する認証付きRESTful APIエンドポイントを実装します。記事とカテゴリのCRUD操作を可能にするAPIを作成します。

## 背景

Phase 4で実装した管理画面UIが、実際のデータベースと連携できるようにするため、バックエンドAPIの実装が必要です。セキュリティを考慮し、認証されたユーザーのみがアクセスできるようにします。

## 完了条件

### 記事管理API

- [ ] `GET /api/admin/posts` - 全記事一覧取得（下書き含む）
- [ ] `POST /api/admin/posts` - 新規記事作成
- [ ] `GET /api/admin/posts/[id]` - 個別記事取得
- [ ] `PUT /api/admin/posts/[id]` - 記事更新
- [ ] `DELETE /api/admin/posts/[id]` - 記事削除

### カテゴリ管理API

- [ ] `GET /api/admin/categories` - カテゴリ一覧取得
- [ ] `POST /api/admin/categories` - カテゴリ作成
- [ ] `PUT /api/admin/categories/[id]` - カテゴリ更新
- [ ] `DELETE /api/admin/categories/[id]` - カテゴリ削除

### 共通要件

- [ ] 認証チェックの実装
- [ ] 入力値バリデーション
- [ ] エラーハンドリング
- [ ] トランザクション処理
- [ ] APIテストの作成

## 技術仕様

- SvelteKit API Routes
- Drizzle ORM
- Auth.js（認証）
- Zod（バリデーション）
- TypeScript

## 関連Issue

- Phase 3の認証実装
- Phase 4の管理画面UI実装
- 公開用APIの実装

## 設計書参照

- `/doc/designs/phase-5/02_admin_api.md`
- `/doc/design.md` （全体設計書）

## 見積もり工数

5-6時間

## 注意事項

- すべてのエンドポイントで認証チェックを必ず実施すること
- XSS対策として、リッチテキストコンテンツは適切にサニタイズすること
- SQLインジェクション対策として、Drizzle ORMの機能を正しく使用すること
- 削除操作は論理削除ではなく物理削除とするが、関連データの整合性に注意すること
