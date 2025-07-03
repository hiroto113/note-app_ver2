---
name: Task
about: 開発タスクの定義
title: '[Task] OGP対応'
labels: 'task, seo, phase-7'
assignees: ''
---

## タスク概要

Open Graph Protocol（OGP）とTwitter Cardsに対応し、SNSシェア時の表示を最適化する。動的OGP画像生成機能も実装する。

## 背景

SNSでのシェア時に適切な画像とテキストが表示されることで、クリック率とエンゲージメントが向上する。動的画像生成により、記事ごとに最適化されたOGP画像を提供できる。

## 完了条件

- [ ] OGPTagsコンポーネントの作成
- [ ] 基本OGPメタタグの実装
  - [ ] og:title, og:description
  - [ ] og:type, og:url
  - [ ] og:image, og:site_name
  - [ ] og:locale
- [ ] Twitter Cards対応
  - [ ] twitter:card
  - [ ] twitter:title, twitter:description
  - [ ] twitter:image
- [ ] 動的OGP画像生成API
  - [ ] /api/og/[slug]エンドポイント
  - [ ] SVGベースのレンダリング
  - [ ] キャッシュ機能
- [ ] デフォルトOGP画像の作成
- [ ] 管理画面でのプレビュー機能

## 技術仕様

- **コンポーネント**: OGPTags.svelte
- **画像生成**: @vercel/ogまたはsatori
- **画像形式**: PNG (1200x630px)
- **キャッシュ**: 24時間
- **フォールバック**: デフォルトOGP画像

## 関連Issue

- メタタグ最適化（共通コンポーネント）
- パフォーマンス改善（画像最適化）

## 設計書参照

- [OGP対応 詳細設計書](../designs/phase-7/02_ogp-support.md)
- [全体設計書](../design.md) - 3.3 SEO対策機能

## 見積もり工数

8-10時間

- OGPTagsコンポーネント実装: 2時間
- 動的画像生成API: 3-4時間
- キャッシュ機能実装: 1-2時間
- 管理画面プレビュー: 1時間
- テスト・検証: 1時間

## 注意事項

- Facebook Sharing DebuggerとTwitter Card Validatorで検証する
- 画像生成のパフォーマンスを監視する
- 日本語フォントの埋め込みに注意する
- キャッシュ戦略を適切に設定する