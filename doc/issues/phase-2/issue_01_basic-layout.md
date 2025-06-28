---
title: '[feature] 基本レイアウトの実装'
labels:
    - 'type:feature'
    - 'scope:frontend'
    - 'priority:high'
    - 'phase:2'
assignees: 'hiroto113'
status: 'done'
---

## 1. 目的・背景

サイト全体の共通レイアウトをコンポーネントとして実装し、各ページで再利用可能な基盤を構築します。
これはPhase 2の最初のステップであり、今後のUI実装の土台となります。
設計は `/doc/designs/phase-2/02_core-features.md` の「3. 基本レイアウトの実装」セクションに基づきます。

## 2. 実装内容・変更点

- `src/lib/components/layout/Header.svelte` の作成
- `src/lib/components/layout/Footer.svelte` の作成
- `src/routes/+layout.svelte` を更新し、上記コンポーネントを組み込む
- 全体のラッパーとして `div` を配置し、`flex` を使ってフッターをページ下部に固定する
- `main` タグに `container` クラスを適用してコンテンツを中央揃えにする

## 3. 受け入れ基準

- すべてのページで共通のヘッダーとフッターが表示されること。
- サイトタイトルをクリックするとトップページ `/` に遷移すること。
- メインコンテンツ領域が中央に配置され、適切な余白が設定されていること。
- 画面サイズを変更してもレイアウトが崩れない基本的なレスポンシブ対応がされていること。
