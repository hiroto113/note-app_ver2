# GitHubリポジトリセットアップ 詳細設計書

## 1. 概要
- GitHubリポジトリの完全なセットアップを行い、チーム開発の基盤を整備します。
- 関連する全体設計：`design.md` の「開発プロセス」および「品質保証」に基づいて実装します。

## 2. 実装仕様

### 2.1 ブランチ保護ルール設定

#### mainブランチ
- 直接プッシュを禁止
- PRを必須化
- PRマージ前に以下を要求：
  - 最低1名のレビュー承認
  - CIテストの成功
  - コードオーナーの承認（CODEOWNERS使用時）
- マージ前にブランチを最新化
- マージ後に自動的にブランチを削除

#### developブランチ
- 直接プッシュを禁止
- PRを必須化
- CIテストの成功を要求

### 2.2 GitHub Actionsワークフロー

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run check
      - run: pnpm run lint
      - run: pnpm run test:unit
      - run: pnpm run build
```

#### .github/workflows/playwright.yml
```yaml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm run test:e2e
```

### 2.3 プロジェクトボード設定

#### ボード構成
- **Backlog**: 未着手のタスク
- **Ready**: 着手可能な状態のタスク
- **In Progress**: 作業中のタスク
- **In Review**: レビュー待ちのタスク
- **Done**: 完了したタスク

#### 自動化ルール
- Issueが作成されたら自動的にBacklogに追加
- PRが作成されたらIn Progressに移動
- PRがレビュー待ちになったらIn Reviewに移動
- PRがマージされたらDoneに移動

### 2.4 Issue/PRテンプレートの改善

既存のテンプレートに以下を追加：

#### .github/ISSUE_TEMPLATE/task.md
```markdown
---
name: Task
about: 開発タスクの定義
title: '[Task] '
labels: 'task'
assignees: ''
---

## タスク概要

## 完了条件
- [ ] 
- [ ] 

## 関連Issue
- #

## 設計書参照
- 
```

### 2.5 その他の設定

#### .github/CODEOWNERS
```
# デフォルトのコードオーナー
* @project-owner

# ドキュメント
/doc/ @documentation-team

# CI/CD
/.github/ @devops-team
```

#### .github/dependabot.yml
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## 3. データモデル
GitHub設定のため、アプリケーション内のデータモデル変更はありません。

## 4. UI/UXデザイン
GitHubのUIを使用するため、独自のUI実装はありません。

## 5. テスト計画
- ブランチ保護ルールが正しく動作することを確認
- CIワークフローが各イベントで起動することを確認
- プロジェクトボードの自動化が動作することを確認
- Dependabotが定期的に動作することを確認

## 6. 関連ドキュメント
- 全体設計書：`/doc/design.md`
- 開発プロセス：`/doc/development.md`
- PRテンプレート：`/.github/pull_request_template.md`
- Issueテンプレート：`/.github/ISSUE_TEMPLATE/`