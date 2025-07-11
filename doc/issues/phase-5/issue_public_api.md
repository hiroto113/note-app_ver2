---
title: '[Task] 公開用APIの実装'
labels: 'task,backend,phase-5'
assignees: ''
---

## タスク概要

公開側のフロントエンドから利用するRESTful APIエンドポイントを実装します。記事一覧、個別記事、カテゴリ一覧の取得APIを作成します。

## 背景

現在、フロントエンドはモックデータを使用していますが、データベースと連携した実際のAPIが必要です。Phase 3でデータベースが準備され、Phase 4で管理画面が完成したため、APIの実装が可能になりました。

## 完了条件

- [ ] `/api/posts` エンドポイントの実装（記事一覧取得）
- [ ] `/api/posts/[slug]` エンドポイントの実装（個別記事取得）
- [ ] `/api/categories` エンドポイントの実装（カテゴリ一覧取得）
- [ ] ページネーション機能の実装
- [ ] カテゴリフィルタリング機能の実装
- [ ] エラーハンドリングの実装
- [ ] APIテストの作成
- [ ] フロントエンドとの統合確認

## 技術仕様

- SvelteKit API Routes
- Drizzle ORM
- TypeScript
- Vitest（テスト）

## 関連Issue

- Phase 3のデータベース実装
- Phase 4の管理画面実装

## 設計書参照

- `/doc/designs/phase-5/01_public_api.md`
- `/doc/design.md` （全体設計書）

## 見積もり工数

3-4時間

## 注意事項

- 公開APIは認証不要だが、公開状態の記事のみを返すようフィルタリングすること
- N+1問題を避けるため、カテゴリ情報は適切にJOINすること
- レスポンスタイムを考慮し、必要に応じてインデックスを追加すること
