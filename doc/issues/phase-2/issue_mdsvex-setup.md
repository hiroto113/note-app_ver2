---
name: Feature Request
about: MDsveXの機能拡張
title: '[feature] MDsveXの機能拡張（シンタックスハイライト、目次対応）'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:frontend'
    - 'priority:high'
    - 'phase:2'
status: 'done'
---

## 1. 目的・背景

Markdownで作成したコンテンツをSvelteコンポーネントとして扱えるようにするため、MDsveXを導入し、基本的な設定を行う。これにより、記事コンテンツの管理と表示の基盤を構築する。

## 実装内容・変更点

- [ ] `shiki`, `rehype-slug`, `rehype-autolink-headings`をインストールする
- [ ] `mdsvex.config.js`を作成し、上記ライブラリをrehypeプラグインとして設定する
    - `shiki`をハイライターとして設定する（テーマ: `github-dark`）
    - `rehype-slug`をプラグインに追加する
    - `rehype-autolink-headings`をプラグインに追加する
- [ ] `svelte.config.js`を更新し、`mdsvex.config.js`を読み込むように設定する

## 受け入れ基準

- [ ] テスト用Markdownファイルで、コードブロックがシンタックスハイライトされる
- [ ] テスト用Markdownファイルで、h2, h3見出しにID属性が自動で付与される
- [ ] テスト用Markdownファイルで、h2, h3見出しにアンカーリンクが自動で設定される

## 関連Issue/PR

- 関連ドキュメント: `doc/designs/phase-2/01_mdsvex-setup.md`

## その他

- 特になし
