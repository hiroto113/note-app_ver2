---
title: "[feature] 記事一覧表示機能の実装"
labels:
  - 'type:feature'
  - 'scope:frontend'
  - 'priority:high'
  - 'phase:2'
assignees: 'hiroto113'
status: 'done'
---

## 1. 目的・背景
`src/posts` ディレクトリ内のMarkdownファイルから記事データを動的に読み込み、トップページに一覧表示する機能を実装します。
これは、サイトのコアとなるコンテンツ表示機能の第一歩です。
設計は `/doc/designs/phase-2/02_core-features.md` の「4. 記事一覧表示機能」セクションに基づきます。

## 2. 実装内容・変更点
- テスト用の記事Markdownファイルを2〜3個 `src/posts` に作成する。
- `src/routes/+page.server.js` を作成し、`src/posts` 内のMarkdownを読み込んで処理するロジックを実装する。
- 記事カードコンポーネント `src/lib/components/post/PostCard.svelte` を作成する。
- `src/routes/+page.svelte` を更新し、`+page.server.js` から渡されたデータを元に記事一覧を表示する。

## 3. 受け入れ基準
- トップページに記事の一覧が公開日の新しい順で表示される。
- 各記事カードにタイトル、説明、公開日、カテゴリが表示されている。
- 記事カードは、対応する詳細ページ `/posts/[slug]` へのリンクになっている。
- 動作確認用の記事が `src/posts` に存在している。 