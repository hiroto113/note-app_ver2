---
name: Feature Request
about: 管理画面カテゴリ管理UI実装
title: '[Phase4] [feature] 管理画面カテゴリ管理UI実装'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:frontend'
    - 'priority:high'
    - 'phase:4'
---

## 1. 目的・背景

既に実装済みのカテゴリCRUD APIを活用し、管理画面でカテゴリの作成・編集・削除・一覧表示を行うためのユーザーインターフェースを実装する。インライン編集機能により効率的な管理を実現する。

## 2. 実装内容・変更点

- [ ] カテゴリ一覧・管理画面の実装（`/admin/categories`）
    - [ ] `src/routes/(admin)/admin/categories/+page.server.ts`
    - [ ] `src/routes/(admin)/admin/categories/+page.svelte`
    - [ ] カテゴリ一覧表示（名前、説明、記事数、作成日）
    - [ ] インライン編集機能
    - [ ] 新規作成フォーム
    - [ ] 削除確認モーダル
- [ ] カテゴリ詳細画面の実装（`/admin/categories/[id]`）
    - [ ] `src/routes/(admin)/admin/categories/[id]/+page.server.ts`
    - [ ] `src/routes/(admin)/admin/categories/[id]/+page.svelte`
    - [ ] カテゴリ詳細情報表示
    - [ ] 関連記事一覧表示
- [ ] 専用UIコンポーネントの作成
    - [ ] `src/lib/components/admin/CategoryList.svelte`
    - [ ] `src/lib/components/admin/CategoryCard.svelte`
    - [ ] `src/lib/components/admin/CategoryForm.svelte`
    - [ ] `src/lib/components/admin/CategoryDeleteModal.svelte`
- [ ] 汎用UIコンポーネントの作成
    - [ ] `src/lib/components/ui/Modal.svelte`
    - [ ] `src/lib/components/ui/ConfirmDialog.svelte`
    - [ ] `src/lib/components/ui/InlineEdit.svelte`

## 3. 受け入れ基準

- [ ] `/admin/categories`でカテゴリ一覧が表示される
- [ ] 各カテゴリの記事数が正確に表示される
- [ ] インライン編集でカテゴリ名・説明を編集できる
- [ ] 新規カテゴリ作成が正常に動作する
- [ ] カテゴリ削除が確認ダイアログ付きで動作する
- [ ] カテゴリ詳細ページで関連記事が表示される
- [ ] フォームバリデーションが適切に機能する
- [ ] エラーハンドリングが適切に実装されている
- [ ] キーボード操作（Tab、Enter、Escape）に対応

## 4. インライン編集仕様

- カテゴリ名・説明フィールドをクリックで編集モード開始
- Enterキーで保存、Escapeキーでキャンセル
- 外部クリックで自動保存（オプション）
- 編集中の視覚的フィードバック（ボーダー、背景色変更）
- バリデーションエラーの即座表示

## 5. API連携

- `GET /api/admin/categories` - カテゴリ一覧取得
- `POST /api/admin/categories` - カテゴリ作成
- `GET /api/admin/categories/[id]` - カテゴリ詳細取得
- `PUT /api/admin/categories` - カテゴリ更新
- `DELETE /api/admin/categories` - カテゴリ削除

## 6. UX考慮事項

- 楽観的更新による応答性向上
- ローディング状態の適切な表示
- 成功・エラー時のトースト通知
- 削除前の関連記事数表示による注意喚起
- ドラッグ&ドロップによる並び替え（将来拡張）

## 7. 関連Issue/PR

- 関連ドキュメント: `doc/designs/phase-4/02_admin-categories-ui.md`
- 依存: Phase 3 カテゴリCRUD API (完了済み)
- 関連: Phase 4-1 記事管理UI (カテゴリ選択機能で連携)

## 8. アクセシビリティ要件

- スクリーンリーダー対応（適切なARIA属性）
- キーボードナビゲーション対応
- フォーカス管理の適切な実装
- 色覚多様性に配慮した視覚的表現
