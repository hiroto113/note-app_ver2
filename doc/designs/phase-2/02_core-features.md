# Phase 2 詳細設計書: コア機能

## 1. 概要
このドキュメントは、Phase 2で実装するコア機能（基本レイアウト、記事一覧、記事詳細）に関する詳細な設計を定義します。

## 2. 対象Issue
- **基本レイアウトの実装**: #3
- **記事一覧表示機能**: #6 (予定)
- **記事詳細表示機能**: (未定)

---

## 3. 基本レイアウトの実装 (Issue #3)

### 3.1. 目的
サイト全体の共通レイアウトをコンポーネントとして実装し、各ページで再利用可能な基盤を構築します。Note風のミニマルなデザインを目指します。

### 3.2. 実装コンポーネント
- `src/lib/components/layout/Header.svelte`: ヘッダーコンポーネント
- `src/lib/components/layout/Footer.svelte`: フッターコンポーネント
- `src/routes/+layout.svelte`: 全ページに適用されるルートレイアウト

### 3.3. `Header.svelte`
- **機能**:
  - サイトタイトルを表示し、トップページへのリンクとする。
  - ナビゲーションメニュー（例：「記事一覧」「学習ログ」など）を配置する。
- **UI**:
  - `tailwindcss`の`container`クラスを使用して中央揃え。
  - `flexbox`を使用してタイトルとナビゲーションを配置。
  - シンプルなボーダーを下に表示。

### 3.4. `Footer.svelte`
- **機能**:
  - コピーライト情報を表示する。
- **UI**:
  - `tailwindcss`の`container`クラスを使用して中央揃え。
  - `text-sm`や`text-gray-500`などを使用して控えめなデザインにする。
  - ページ下部に固定表示。

### 3.5. `src/routes/+layout.svelte`
- **機能**:
  - 各ページのコンテンツを`<slot />`で受け取り、`Header`と`Footer`で囲む。
  - サイト全体の背景色やフォントなどを`app.css`で定義したスタイルを適用する。
  - ページのメインコンテンツ領域に適切な`padding`や`margin`を設定する。
- **構成**:
  ```html
  <script>
    import Header from '$lib/components/layout/Header.svelte';
    import Footer from '$lib/components/layout/Footer.svelte';
    import '../app.css';
  </script>

  <div class="flex flex-col min-h-screen">
    <Header />

    <main class="flex-grow container mx-auto px-4 py-8">
      <slot />
    </main>

    <Footer />
  </div>
  ```

### 3.6. 受け入れ基準
- すべてのページで共通のヘッダーとフッターが表示されること。
- サイトタイトルをクリックするとトップページに遷移すること。
- メインコンテンツ領域が中央に配置され、適切な余白が設定されていること。
- レスポンシブデザインに対応し、スマートフォン表示でもレイアウトが崩れないこと。

---

## 4. 記事一覧表示機能 (Issue #6 (予定))

### 4.1. 目的
Markdownファイルから記事情報を取得し、トップページに一覧として表示します。

### 4.2. 実装方針
- SvelteKitのサーバーサイドレンダリング（SSR）を活用し、ビルド時ではなくリクエスト時に動的にMarkdownファイルを読み込みます。
- まずは全ての記事を単純に表示し、ページネーションやカテゴリ分類は別Issueで対応します。

### 4.3. 実装コンポーネント
- `src/routes/+page.server.js`: サーバーサイドで記事データを読み込むスクリプト。
- `src/routes/+page.svelte`: 記事一覧を表示するメインページ。
- `src/lib/components/post/PostCard.svelte`: 個々の記事を表すカードコンポーネント。

### 4.4. `+page.server.js`
- **機能**:
  - `src/posts` ディレクトリ内のすべての `.md` ファイルを探索する。
  - 各ファイルのフロントマター（`title`, `publishedAt`, `description`, `categories`など）を解析する。
  - 記事データを `publishedAt`（公開日）の降順でソートする。
  - 処理した記事データの配列を `load` 関数から返す。
- **データ構造**:
  ```typescript
  export interface Post {
    slug: string;
    title: string;
    publishedAt: string;
    description: string;
    categories: string[];
  }
  ```

### 4.5. `PostCard.svelte`
- **機能**:
  - `Post`オブジェクトをプロパティとして受け取る。
  - 記事のタイトル、説明、公開日、カテゴリを表示する。
  - カード全体が、対応する記事詳細ページ（例: `/posts/slug-name`）へのリンクになる。
- **UI**:
  - `tailwindcss` を使用したカードデザイン。
  - `hover`時に影が濃くなるなどのインタラクションを追加。

### 4.6. `+page.svelte`
- **機能**:
  - `+page.server.js` から渡された記事データ配列を受け取る。
  - `{#each}` ブロックを使用して、記事データを `PostCard` コンポーネントに渡して繰り返し表示する。
- **構成**:
  ```html
  <script lang="ts">
    import PostCard from '$lib/components/post/PostCard.svelte';
    export let data;
  </script>

  <div class="space-y-8">
    {#each data.posts as post}
      <PostCard {post} />
    {/each}
  </div>
  ```

### 4.7. 受け入れ基準
- トップページにアクセスすると、`src/posts` ディレクトリ内の記事が一覧で表示されること。
- 記事は公開日の新しい順に並んでいること。
- 各記事カードには、タイトル、説明、公開日、カテゴリが表示されていること。
- 記事カードをクリックすると、適切な記事詳細ページ（URL）に遷移すること（現時点では404でOK）。
- テスト用のMarkdownファイル（2〜3個）が `src/posts` ディレクトリに作成されていること。

---

## 5. 記事詳細表示機能

### 5.1. 目的
ユーザーが選択した単一の記事ページを動的に生成し、Markdownで記述されたコンテンツを整形されたHTMLとして表示します。

### 5.2. 実装方針
- SvelteKitの動的ルーティング機能 `[slug]` を活用して、記事のスラッグ（ファイル名）に基づいたページを生成します。
- `+page.server.ts` で該当するMarkdownファイルを読み込み、MDsveXがフロントエンドでレンダリングするために必要なデータを渡します。
- MDsveXの機能（シンタックスハイライト、見出しリンク）が正しく適用されることを確認します。

### 5.3. 実装コンポーネント・ファイル
- `src/routes/posts/[slug]/+page.server.ts`: サーバーサイドで特定のスラッグに一致する記事データを読み込むスクリプト。
- `src/routes/posts/[slug]/+page.svelte`: 記事のコンテンツとメタデータを表示するページコンポーネント。

### 5.4. `src/routes/posts/[slug]/+page.server.ts`
- **機能**:
  - `params.slug` を使して、リクエストされた記事のスラッグを取得します。
  - `src/posts` ディレクトリから `{slug}.md` というファイルを探索します。
  - ファイルが見つからない場合は、`404 Not Found`エラーを返します。
  - ファイルが見つかった場合、ファイルの内容（フロントマターと本文）を解析します。
  - 解析したデータ（タイトル、公開日、カテゴリなどのメタデータと、レンダリング前のMarkdown本文）を `load` 関数から返します。
- **データ構造**:
  ```typescript
  export interface PostDetail extends App.Post {
    content: string; // Markdown本文
  }
  ```

### 5.5. `src/routes/posts/[slug]/+page.svelte`
- **機能**:
  - `+page.server.ts` から渡された記事データを受け取ります。
  - 記事のメタデータ（タイトル、公開日など）をページの適切な場所に表示します。
  - MDsveXによってHTMLに変換された本文コンテンツを、`<svelte:component>`などを使って動的にレンダリングします。

### 5.6. 受け入れ基準
- `/posts/first-post` のようなURLにアクセスすると、対応する記事の内容が表示されること。
- 記事のタイトル、公開日、カテゴリが正しく表示されること。
- Markdown本文がHTMLとして適切にレンダリングされていること。
- コードブロックがシンタックスハイライトされていること。
- h2やh3などの見出しに、アンカーリンクが自動で付与されていること。
- 存在しないスラッグにアクセスした場合、404エラーページが表示されること。 