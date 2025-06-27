# Issue: プロジェクト初期化

## 概要
SvelteKitを使用してNoteアプリケーションの基盤を構築します。

## 背景
新規プロジェクトとして、モダンなフレームワークであるSvelteKitを使用してNoteアプリケーションを開発します。TypeScriptとTailwind CSSを使用した開発環境を整備する必要があります。

## タスク
- [ ] SvelteKitプロジェクトの初期化（TypeScript、ESLint、Prettier、Vitest、Playwright含む）
- [ ] pnpmで依存関係をインストール
- [ ] Tailwind CSSのセットアップ
- [ ] 基本的なプロジェクト構造の作成（src/lib/, src/routes/等）
- [ ] 環境変数ファイルの設定（.env.example）
- [ ] 開発サーバーの起動確認
- [ ] ビルドの成功確認

## 完了条件
- [ ] `pnpm run dev`で開発サーバーが起動する
- [ ] `pnpm run build`でビルドが成功する
- [ ] `pnpm run check`でTypeScriptのチェックが通る
- [ ] Tailwind CSSが正しく動作する
- [ ] 基本的なプロジェクト構造が整備されている

## 技術仕様
- SvelteKit（最新版）
- TypeScript
- Tailwind CSS
- pnpm（パッケージマネージャー）
- Vite（ビルドツール）

## 参考資料
- 設計書：`/doc/designs/phase-1/01_project-initialization.md`
- 全体設計：`/doc/design.md`

## ラベル
- `phase-1`
- `setup`
- `priority: high`