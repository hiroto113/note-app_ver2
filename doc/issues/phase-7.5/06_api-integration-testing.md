# Issue: API統合テストの実装

## 基本情報

- **Issue Type**: Task
- **Priority**: High
- **Estimated Time**: 2-3日
- **Assignee**: 開発者
- **Labels**: `testing`, `api`, `integration`, `phase-7.5`

## 概要

全API エンドポイントの統合テストを実装し、CRUD操作、認証、エラーハンドリングの動作を包括的に検証します。

## 現在の状況

- API統合テストが不十分
- エンドポイント間の連携テストが未実装
- エラーケースのテストが不足

## 実装タスク

### 1. 記事API統合テスト

- [ ] GET /api/posts - 記事一覧取得テスト
- [ ] GET /api/posts/[id] - 記事詳細取得テスト
- [ ] POST /api/posts - 記事作成テスト
- [ ] PUT /api/posts/[id] - 記事更新テスト
- [ ] DELETE /api/posts/[id] - 記事削除テスト

### 2. カテゴリAPI統合テスト

- [ ] GET /api/categories - カテゴリ一覧取得テスト
- [ ] POST /api/categories - カテゴリ作成テスト
- [ ] PUT /api/categories/[id] - カテゴリ更新テスト
- [ ] DELETE /api/categories/[id] - カテゴリ削除テスト

### 3. 認証API統合テスト

- [ ] POST /api/auth/login - ログインテスト
- [ ] POST /api/auth/logout - ログアウトテスト
- [ ] GET /api/auth/session - セッション確認テスト
- [ ] 認証が必要なエンドポイントのアクセス制御テスト

### 4. エラーハンドリングテスト

- [ ] 400番台エラーレスポンスの検証
- [ ] 500番台エラーレスポンスの検証
- [ ] バリデーションエラーの検証
- [ ] 権限エラーの検証

## 完了基準

- [ ] 全APIエンドポイントの統合テスト実装
- [ ] 正常系・異常系のテストケース網羅
- [ ] データベース状態の検証
- [ ] 全テストが通過すること

## 関連ファイル

- `tests/integration/api/**/*.test.ts`
- `src/routes/api/**/*.ts`
- `src/lib/server/api/**/*.ts`
- `src/lib/test-utils/api-helpers.ts`

## 影響範囲

- API開発プロセス
- データベース設計
- 認証システム
- エラーハンドリング

## 備考

- テストデータベースを使用
- 認証モックを適切に設定
- 並列実行に対応
