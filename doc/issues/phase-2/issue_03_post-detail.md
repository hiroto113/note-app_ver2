---
title: '[feature] 記事詳細表示機能の実装'
labels:
    - 'type:feature'
    - 'scope:frontend'
    - 'priority:high'
    - 'phase:2'
status: 'done'
assignees: 'hiroto113'
---

## 1. 目的・背景

サイトのコア機能である記事詳細ページを実装します。ユーザーが記事一覧から選択した記事の全文を、動的ルーティングを用いて表示します。
設計は `/doc/designs/phase-2/02_core-features.md` の「5. 記事詳細表示機能」セクションに基づきます。

## 2. 実装内容・変更点

- `src/routes/posts/[slug]/+page.server.ts` を作成し、特定のスラッグに対応する記事データを読み込むロジックを実装する。
- `src/routes/posts/[slug]/+page.svelte` を作成し、記事のメタデータと本文をレンダリングする。
- MDsveXで処理されたHTMLを動的に表示するため、`+page.svelte`では本文を`<svelte:component>`で読み込むようにする。

## 3. 受け入れ基準

- `/posts/first-post` のようなURLにアクセスすると、対応する記事の内容が表示される。
- 存在しない記事のURLにアクセスすると、404エラーページが表示される。
- 記事ページで、コードブロックのシンタックスハイライトが適用されている。
- 記事ページで、見出し（h2, h3等）にアンカーリンクが付与されている。
