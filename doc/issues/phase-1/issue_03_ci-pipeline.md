# Issue: CIパイプライン構築

## 概要

GitHub Actionsを使用して継続的インテグレーション（CI）パイプラインを構築します。

## 背景

コード品質を維持し、自動テストを実行するため、CIパイプラインが必要です。プルリクエスト時に自動的にテストとビルドを実行し、問題を早期に発見します。

## タスク

- [ ] 基本的なCIワークフローの作成（.github/workflows/ci.yml）
- [ ] Playwrightテスト用ワークフローの作成（.github/workflows/playwright.yml）
- [ ] Node.jsとpnpmのセットアップ
- [ ] キャッシュの設定（依存関係のキャッシュ）
- [ ] テスト結果のレポート設定
- [ ] ビルド成功の確認
- [ ] PR時の自動実行設定

## 完了条件

- [ ] PRを作成時にCIが自動実行される
- [ ] テスト（unit、e2e）が実行される
- [ ] ビルドが成功する
- [ ] リントチェックが実行される
- [ ] 型チェックが実行される
- [ ] テスト結果がPRに表示される

## 技術仕様

- GitHub Actions
- Node.js 20
- pnpm 8
- Ubuntu（最新版）

## 参考資料

- 設計書：`/doc/designs/phase-1/02_github-setup.md`
- 品質保証：`/doc/design.md`のテスト戦略セクション

## ラベル

- `phase-1`
- `ci/cd`
- `automation`
- `priority: medium`
