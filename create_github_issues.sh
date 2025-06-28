#!/bin/bash

# GitHub Issue Creation Script for Phases 1, 2, and 3
# This script requires the GitHub CLI (gh) to be installed
# Install it from: https://cli.github.com/

echo "Creating GitHub Issues for Phase 1, 2, and 3..."
echo "============================================="

# Phase 1 Issues
echo "Creating Phase 1 Issues..."

# Phase 1 - Issue 1: プロジェクト初期化
gh issue create --title "プロジェクト初期化" --body "$(cat <<'EOF'
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
EOF
)" --label "phase-1,setup,priority: high" --assignee "hiroto113"

# Phase 1 - Issue 2: 開発環境構築
gh issue create --title "開発環境構築" --body "$(cat <<'EOF'
## 概要
プロジェクトの開発に必要な設定ファイルと開発環境を整備します。

## 背景
チーム開発を円滑に進めるため、統一された開発環境と設定ファイルが必要です。TypeScript、ESLint、Prettierの設定を最適化し、開発効率を向上させます。

## タスク
- [ ] TypeScript設定の最適化（tsconfig.json）
- [ ] ESLint設定の作成・調整
- [ ] Prettier設定の作成・調整
- [ ] VSCode推奨設定の作成（.vscode/settings.json）
- [ ] VSCode推奨拡張機能リストの作成（.vscode/extensions.json）
- [ ] Git設定ファイルの作成（.gitignore、.gitattributes）
- [ ] EditorConfig設定の作成
- [ ] package.jsonのスクリプト整備

## 完了条件
- [ ] TypeScriptのstrictモードが有効
- [ ] ESLintが正しく動作する
- [ ] Prettierによる自動フォーマットが動作する
- [ ] VSCodeで推奨設定が適用される
- [ ] Gitで不要なファイルが無視される
- [ ] `pnpm run lint`でリントが実行される
- [ ] `pnpm run format`でフォーマットが実行される

## 技術仕様
- TypeScript（strictモード）
- ESLint（SvelteKit推奨設定）
- Prettier（SvelteKit推奨設定）
- EditorConfig

## 参考資料
- 設計書：`/doc/designs/phase-1/01_project-initialization.md`
- 開発プロセス：`/doc/development.md`
EOF
)" --label "phase-1,setup,dx,priority: medium" --assignee "hiroto113"

# Phase 1 - Issue 3: CIパイプライン構築
gh issue create --title "CIパイプライン構築" --body "$(cat <<'EOF'
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
EOF
)" --label "phase-1,ci/cd,automation,priority: medium" --assignee "hiroto113"

# Phase 1 - Issue 4: GitHubリポジトリセットアップ
gh issue create --title "GitHubリポジトリセットアップ" --body "$(cat <<'EOF'
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
EOF
)" --label "phase-1,setup,github,priority: low" --assignee "hiroto113"

# Phase 2 Issues
echo "Creating Phase 2 Issues..."

# Phase 2 - Issue 1: MDsveXの機能拡張
ISSUE_1=$(gh issue create --title "[feature] MDsveXの機能拡張（シンタックスハイライト、目次対応）" --body "$(cat <<'EOF'
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
EOF
)" --label "type:feature,scope:frontend,priority:high,phase:2" --assignee "hiroto113" | grep -o '#[0-9]*' | tr -d '#')
# Close the issue since status is 'done'
gh issue close "$ISSUE_1"

# Phase 2 - Issue 2: 基本レイアウトの実装
ISSUE_2=$(gh issue create --title "[feature] 基本レイアウトの実装" --body "$(cat <<'EOF'
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
EOF
)" --label "type:feature,scope:frontend,priority:high,phase:2" --assignee "hiroto113" | grep -o '#[0-9]*' | tr -d '#')
# Close the issue since status is 'done'
gh issue close "$ISSUE_2"

# Phase 2 - Issue 3: 記事一覧表示機能の実装
ISSUE_3=$(gh issue create --title "[feature] 記事一覧表示機能の実装" --body "$(cat <<'EOF'
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
EOF
)" --label "type:feature,scope:frontend,priority:high,phase:2" --assignee "hiroto113" | grep -o '#[0-9]*' | tr -d '#')
# Close the issue since status is 'done'
gh issue close "$ISSUE_3"

# Phase 2 - Issue 4: 記事詳細表示機能の実装
ISSUE_4=$(gh issue create --title "[feature] 記事詳細表示機能の実装" --body "$(cat <<'EOF'
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
EOF
)" --label "type:feature,scope:frontend,priority:high,phase:2" --assignee "hiroto113" | grep -o '#[0-9]*' | tr -d '#')
# Close the issue since status is 'done'
gh issue close "$ISSUE_4"

# Phase 3 Issues
echo "Creating Phase 3 Issues..."

# Phase 3 - Issue 1: データベース設定
gh issue create --title "[Phase3] [feature] データベース設定（ORM導入、スキーマ定義）" --body "$(cat <<'EOF'
## 1. 目的・背景
管理画面機能の実装に向け、記事やユーザー情報を永続化するためのデータベース基盤を構築する。

## 2. 実装内容・変更点
- [ ] `drizzle-orm`, `drizzle-kit`, `@libsql/client`をインストールする
- [ ] `drizzle.config.ts`を作成・設定する
- [ ] `src/lib/server/db/schema.ts`にテーブルスキーマを定義する (`users`, `sessions`, `posts`, `categories`, `posts_to_categories`)
- [ ] `src/lib/server/db/index.ts`でDBクライアントを初期化する
- [ ] `drizzle-kit push`を実行し、`local.db`にスキーマを反映させる

## 3. 受け入れ基準
- [ ] `drizzle-kit push`がエラーなく完了する
- [ ] 作成された`local.db`をDBブラウザ等で開き、すべてのテーブルとカラムが正しく作成されていることを確認できる

## 4. 関連Issue/PR
- 関連ドキュメント: `doc/designs/phase-3/01_database-setup.md`
EOF
)" --label "type:feature,scope:backend,priority:high,phase:3" --assignee "hiroto113"

# Phase 3 - Issue 2: 認証機能実装
gh issue create --title "[Phase3] [feature] 認証機能実装（ログイン/ログアウト）" --body "$(cat <<'EOF'
## 1. 目的・背景
管理画面にアクセス制限を設けるため、管理者向けの認証機能を実装する。

## 2. 実装内容・変更点
- [ ] Lucia関連ライブラリ (`lucia`, `@lucia-auth/adapter-drizzle`) をアンインストールする
- [ ] Auth.js関連ライブラリ (`@auth/sveltekit`, `@auth/core`, `@auth/drizzle-adapter`) をインストールする
- [ ] `src/lib/server/db/schema.ts` のスキーマを Auth.js の要求に合わせて更新（または置き換え）し、マイグレーションを実行する
- [ ] `src/auth.ts` を作成し、`SvelteKitAuth` の設定（Credentialsプロバイダ、Drizzleアダプタ）を記述する
- [ ] `src/hooks.server.ts` で `SvelteKitAuth` の `handle` を設定する
- [ ] `src/routes/login/+page.svelte` にログインフォームを作成する
- [ ] `src/(admin)/+layout.server.ts` でセッションを確認し、未認証ユーザーをリダイレクトする処理を実装する
- [ ] 管理画面のレイアウトにログアウト (`/auth/signout`) ボタンを設置する

## 3. 受け入れ基準
- [ ] 未認証ユーザーは `/admin` 以下にアクセスできず、`/login` にリダイレクトされる
- [ ] ログインフォームから正しくログインでき、セッションが開始される
- [ ] ログイン後は `/admin` 以下にアクセスできる
- [ ] ログアウト処理 (`/auth/signout`) を呼び出すとセッションが破棄され、未認証状態に戻る

## 4. 関連Issue/PR
- 関連ドキュメント: `doc/designs/phase-3/02_authentication.md`
EOF
)" --label "type:feature,scope:backend,priority:high,phase:3" --assignee "hiroto113"

# Phase 3 - Issue 3: 記事CRUD API実装
gh issue create --title "[Phase3] [feature] 記事CRUD API実装" --body "$(cat <<'EOF'
## 1. 目的・背景
管理画面から記事のCRUD（作成、読み取り、更新、削除）操作を可能にするためのAPIを実装する。

## 2. 実装内容・変更点
- [ ] `src/routes/api/admin/posts/+server.ts` を作成
  - `GET`メソッドで全記事（下書き含む）を一覧取得する処理を実装
  - `POST`メソッドで記事を新規作成する処理を実装
- [ ] `src/routes/api/admin/posts/[id]/+server.ts` を作成
  - `PUT`メソッドで既存の記事を更新する処理を実装
  - `DELETE`メソッドで記事を削除する処理を実装
- [ ] すべてのAPIは認証チェックを行い、未認証アクセスを拒否する

## 3. 受け入れ基準
- [ ] `POST /api/admin/posts` で記事が作成できる
- [ ] `GET /api/admin/posts` で記事一覧が取得できる
- [ ] `PUT /api/admin/posts/[id]` で記事が更新できる
- [ ] `DELETE /api/admin/posts/[id]` で記事が削除できる

## 4. 関連Issue/PR
- 関連ドキュメント: `doc/designs/phase-3/03_posts-crud-api.md`
EOF
)" --label "type:feature,scope:backend,priority:high,phase:3" --assignee "hiroto113"

# Phase 3 - Issue 4: カテゴリ管理API実装
gh issue create --title "[Phase3] [feature] カテゴリ管理API実装" --body "$(cat <<'EOF'
## 1. 目的・背景
管理画面からカテゴリのCRUD操作を可能にするためのAPIを実装する。

## 2. 実装内容・変更点
- [ ] `src/routes/api/admin/categories/+server.ts` を作成
  - `GET`メソッドでカテゴリ一覧を取得する処理を実装
  - `POST`メソッドでカテゴリを新規作成する処理を実装
  - `PUT`メソッドでカテゴリを更新する処理を実装
  - `DELETE`メソッドでカテゴリを削除する処理を実装
- [ ] すべてのAPIは認証チェックを行い、未認証アクセスを拒否する

## 3. 受け入れ基準
- [ ] `POST /api/admin/categories` でカテゴリが作成できる
- [ ] `GET /api/admin/categories` でカテゴリ一覧が取得できる
- [ ] `PUT /api/admin/categories` でカテゴリが更新できる
- [ ] `DELETE /api/admin/categories` でカテゴリが削除できる

## 4. 関連Issue/PR
- 関連ドキュメント: `doc/designs/phase-3/04_categories-crud-api.md`
EOF
)" --label "type:feature,scope:backend,priority:high,phase:3" --assignee "hiroto113"

echo "============================================="
echo "All issues have been created successfully!"
echo "Phase 2 issues with status 'done' have been closed."