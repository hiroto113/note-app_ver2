# Issue: テストデータ管理システムの構築

## 基本情報

- **Issue Type**: Task
- **Priority**: Medium
- **Estimated Time**: 2-3日
- **Assignee**: 開発者
- **Labels**: `testing`, `test-data`, `fixtures`, `phase-7.5`

## 概要

テストデータの生成、管理、クリーンアップを自動化し、一貫性のあるテスト環境を構築します。

## 現在の状況

- テストデータの管理が手動
- テスト間でのデータ競合が発生
- テストデータのクリーンアップが不完全

## 実装タスク

### 1. テストデータ生成

- [ ] モックデータジェネレーターの実装
- [ ] ファクトリーパターンの適用
- [ ] リアルなサンプルデータの作成
- [ ] 多様なテストシナリオ用データ準備

### 2. テストデータベース管理

- [ ] テスト専用データベースの設定
- [ ] テスト前後のデータ初期化
- [ ] 並列テスト時のデータ分離
- [ ] トランザクションベースのクリーンアップ

### 3. フィクスチャー管理

- [ ] 再利用可能なフィクスチャーの作成
- [ ] テストケース別のデータセット
- [ ] 依存関係のあるデータの管理
- [ ] 大量データでのテストサポート

### 4. テスト環境の分離

- [ ] 環境変数による設定分離
- [ ] テスト実行時の環境切り替え
- [ ] CI/CD環境でのデータ管理
- [ ] 本番データとの分離保証

## 完了基準

- [ ] 自動テストデータ生成の実装
- [ ] テスト間でのデータ分離確保
- [ ] 並列テスト実行の安定化
- [ ] テストデータのドキュメント化

## 関連ファイル

- `src/lib/test-utils/factories.ts`
- `src/lib/test-utils/fixtures.ts`
- `tests/helpers/database.ts`
- `vitest.config.ts`

## 影響範囲

- テスト実行の安定性
- 開発効率
- CI/CD信頼性
- データベース設計

## 備考

- プライバシーに配慮したテストデータ
- 実際のデータパターンに近いデータ生成
- パフォーマンステスト用の大量データ対応
