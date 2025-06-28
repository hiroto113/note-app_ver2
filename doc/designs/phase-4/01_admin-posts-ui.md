# Phase 4-1: 管理画面記事管理UI実装 詳細設計書

## 1. 概要

管理画面で記事のCRUD操作を行うためのユーザーインターフェースを実装する。既に実装済みのAPIを活用し、直感的で使いやすい管理画面を構築する。

## 2. 実装仕様

### 2.1 記事一覧画面 (`/admin/posts`)

- **ファイル**: `src/routes/(admin)/admin/posts/+page.server.ts`, `src/routes/(admin)/admin/posts/+page.svelte`
- **機能**:
    - 全記事の一覧表示（下書き・公開済み含む）
    - 記事のステータス表示（公開/下書き）
    - 記事の基本情報表示（タイトル、公開日、更新日、ステータス）
    - 記事の編集・削除アクションボタン
    - 新しい記事作成ボタン
    - 記事の検索・フィルタリング（将来拡張）

### 2.2 記事作成画面 (`/admin/posts/new`)

- **ファイル**: `src/routes/(admin)/admin/posts/new/+page.svelte`
- **機能**:
    - 記事タイトル入力
    - 記事本文入力（Markdownエディタ）
    - 記事概要入力
    - ステータス選択（下書き/公開）
    - カテゴリ選択（複数選択可能）
    - 保存・キャンセルボタン
    - リアルタイムプレビュー（将来拡張）

### 2.3 記事編集画面 (`/admin/posts/[id]/edit`)

- **ファイル**: `src/routes/(admin)/admin/posts/[id]/edit/+page.server.ts`, `src/routes/(admin)/admin/posts/[id]/edit/+page.svelte`
- **機能**:
    - 既存記事データの読み込み・表示
    - 記事内容の編集（作成画面と同様のフォーム）
    - 変更内容の保存
    - 編集中の自動保存（将来拡張）

## 3. UIコンポーネント設計

### 3.1 共通コンポーネント

- `src/lib/components/admin/PostForm.svelte`: 記事作成・編集用フォーム
- `src/lib/components/admin/PostList.svelte`: 記事一覧表示コンポーネント
- `src/lib/components/admin/PostCard.svelte`: 記事一覧の各項目
- `src/lib/components/admin/StatusBadge.svelte`: ステータス表示バッジ

### 3.2 フォーム要素

- `src/lib/components/forms/TextInput.svelte`: テキスト入力フィールド
- `src/lib/components/forms/TextArea.svelte`: テキストエリア
- `src/lib/components/forms/Select.svelte`: セレクトボックス
- `src/lib/components/forms/MultiSelect.svelte`: 複数選択可能なセレクト

## 4. データフロー

### 4.1 記事一覧取得

1. `/admin/posts` ページ読み込み
2. `+page.server.ts` で `GET /api/admin/posts` を呼び出し
3. 取得したデータを `PostList` コンポーネントに渡す
4. `PostCard` で各記事を表示

### 4.2 記事作成フロー

1. `/admin/posts/new` ページ表示
2. `PostForm` コンポーネントで入力フォーム表示
3. フォーム送信時に `POST /api/admin/posts` を呼び出し
4. 成功時は記事一覧ページにリダイレクト

### 4.3 記事編集フロー

1. `/admin/posts/[id]/edit` ページ読み込み
2. `+page.server.ts` で `GET /api/admin/posts/[id]` を呼び出し
3. `PostForm` コンポーネントに既存データを渡す
4. フォーム送信時に `PUT /api/admin/posts/[id]` を呼び出し
5. 成功時は記事一覧ページにリダイレクト

## 5. エラーハンドリング

### 5.1 API エラー

- ネットワークエラー時の適切な表示
- バリデーションエラーの表示
- 認証エラー時のログインページリダイレクト

### 5.2 フォームバリデーション

- タイトル必須チェック
- 本文必須チェック
- 文字数制限チェック

## 6. UI/UXデザイン

### 6.1 デザイン方針

- シンプルで直感的なインターフェース
- Tailwind CSSを使用した統一されたデザイン
- レスポンシブ対応（タブレット・スマートフォン）

### 6.2 カラーパレット

- プライマリ: Blue-600 (#2563eb)
- セカンダリ: Gray-600 (#4b5563)
- 成功: Green-600 (#059669)
- 警告: Yellow-500 (#eab308)
- エラー: Red-600 (#dc2626)

## 7. テスト計画

### 7.1 機能テスト

- [ ] 記事一覧が正しく表示される
- [ ] 記事作成フォームが動作する
- [ ] 記事編集フォームが動作する
- [ ] 記事削除が動作する
- [ ] フォームバリデーションが機能する

### 7.2 UI/UXテスト

- [ ] レスポンシブデザインが適切に動作する
- [ ] ローディング状態が適切に表示される
- [ ] エラーメッセージが適切に表示される

## 8. 関連ドキュメント

- Phase 3 API設計: `doc/designs/phase-3/03_posts-crud-api.md`
- 全体設計: `doc/design.md`
