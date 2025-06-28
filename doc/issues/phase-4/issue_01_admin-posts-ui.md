---
name: Feature Request
about: 管理画面記事管理UI実装
title: '[Phase4] [feature] 管理画面記事管理UI実装'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:frontend'
    - 'priority:high'
    - 'phase:4'
---

## 1. 目的・背景

既に実装済みの記事CRUD APIを活用し、管理画面で記事の作成・編集・削除・一覧表示を行うためのユーザーインターフェースを実装する。

## 2. 実装内容・変更点

- [ ] 記事一覧画面の実装（`/admin/posts`）
    - [ ] `src/routes/(admin)/admin/posts/+page.server.ts`
    - [ ] `src/routes/(admin)/admin/posts/+page.svelte`
    - [ ] 記事一覧表示（タイトル、ステータス、公開日、更新日）
    - [ ] 新規作成・編集・削除ボタン
- [ ] 記事作成画面の実装（`/admin/posts/new`）
    - [ ] `src/routes/(admin)/admin/posts/new/+page.svelte`
    - [ ] 記事作成フォーム（タイトル、本文、概要、ステータス、カテゴリ）
- [ ] 記事編集画面の実装（`/admin/posts/[id]/edit`）
    - [ ] `src/routes/(admin)/admin/posts/[id]/edit/+page.server.ts`
    - [ ] `src/routes/(admin)/admin/posts/[id]/edit/+page.svelte`
    - [ ] 既存記事データの読み込み・編集
- [ ] 共通UIコンポーネントの作成
    - [ ] `src/lib/components/admin/PostForm.svelte`
    - [ ] `src/lib/components/admin/PostList.svelte`
    - [ ] `src/lib/components/admin/PostCard.svelte`
    - [ ] `src/lib/components/admin/StatusBadge.svelte`
    - [ ] `src/lib/components/forms/TextInput.svelte`
    - [ ] `src/lib/components/forms/TextArea.svelte`
    - [ ] `src/lib/components/forms/Select.svelte`

## 3. 受け入れ基準

- [ ] `/admin/posts`で記事一覧が表示される
- [ ] 記事のステータス（公開/下書き）が視覚的に区別できる
- [ ] 新規記事作成が正常に動作する
- [ ] 既存記事の編集が正常に動作する
- [ ] 記事削除が確認ダイアログ付きで動作する
- [ ] フォームバリデーションが適切に機能する
- [ ] エラーハンドリングが適切に実装されている
- [ ] レスポンシブデザインに対応している

## 4. API連携

- `GET /api/admin/posts` - 記事一覧取得
- `POST /api/admin/posts` - 記事作成
- `GET /api/admin/posts/[id]` - 記事詳細取得
- `PUT /api/admin/posts/[id]` - 記事更新
- `DELETE /api/admin/posts/[id]` - 記事削除
- `GET /api/admin/categories` - カテゴリ一覧取得

## 5. 関連Issue/PR

- 関連ドキュメント: `doc/designs/phase-4/01_admin-posts-ui.md`
- 依存: Phase 3 記事CRUD API (完了済み)

## 6. デザインガイドライン

- Tailwind CSSを使用
- 既存管理画面デザインとの統一
- アクセシビリティ対応（ARIA属性、キーボード操作）
- ダークモード対応は将来拡張として検討
