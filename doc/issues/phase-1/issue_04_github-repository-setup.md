# Issue: GitHubリポジトリセットアップ

## 概要
GitHubリポジトリの完全なセットアップを行い、チーム開発の基盤を整備します。

## 背景
効率的なチーム開発を実現するため、ブランチ保護ルール、プロジェクトボード、自動化ルールなどを設定する必要があります。

## タスク
- [ ] mainブランチの保護ルール設定
- [ ] developブランチの作成と保護ルール設定
- [ ] GitHubプロジェクトボードの作成
- [ ] プロジェクトボードの自動化設定
- [ ] CODEOWNERSファイルの作成
- [ ] Dependabot設定の追加
- [ ] Issueテンプレートの追加（task.md）
- [ ] ブランチ命名規則のドキュメント化

## 完了条件
- [ ] mainブランチへの直接プッシュが禁止されている
- [ ] PRにレビューが必須となっている
- [ ] CIテストの成功がマージ条件となっている
- [ ] プロジェクトボードが作成されている
- [ ] Issueが自動的にプロジェクトボードに追加される
- [ ] Dependabotが有効化されている
- [ ] CODEOWNERSが機能している

## 技術仕様
- GitHub Branch Protection Rules
- GitHub Projects（新UI）
- GitHub Actions（自動化）
- Dependabot

## 参考資料
- 設計書：`/doc/designs/phase-1/02_github-setup.md`
- 開発プロセス：`/doc/development.md`

## ラベル
- `phase-1`
- `setup`
- `github`
- `priority: low`