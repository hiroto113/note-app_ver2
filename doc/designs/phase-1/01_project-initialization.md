# プロジェクト初期化 詳細設計書

## 1. 概要

- Noteアプリケーションの基盤となるSvelteKitプロジェクトを初期化し、開発環境を整備します。
- 関連する全体設計：`design.md` の「テクノロジースタック」および「開発プロセス」に基づいて実装します。

## 2. 実装仕様

### 2.1 プロジェクト初期化

SvelteKitの最新バージョンを使用してプロジェクトを初期化します。

```bash
pnpm create svelte@latest .
```

選択オプション：

- Skeleton project
- TypeScript使用
- ESLint追加
- Prettier追加
- Playwright追加（E2Eテスト用）
- Vitest追加（ユニットテスト用）

### 2.2 依存関係のインストール

基本的な依存関係をインストールします：

```json
{
	"devDependencies": {
		"@sveltejs/adapter-auto": "latest",
		"@sveltejs/kit": "latest",
		"@types/node": "latest",
		"svelte": "latest",
		"typescript": "latest",
		"vite": "latest",
		"autoprefixer": "latest",
		"postcss": "latest",
		"tailwindcss": "latest"
	}
}
```

### 2.3 開発環境設定ファイル

#### .env.example

```
DATABASE_URL="file:./sqlite.db"
PUBLIC_APP_NAME="Note App"
PUBLIC_APP_URL="http://localhost:5173"
```

#### tsconfig.json

- SvelteKitの推奨設定を使用
- strictモードを有効化
- パスエイリアスを設定（$lib, $app等）

#### vite.config.ts

- SvelteKitプラグインの設定
- 開発サーバーのポート設定（5173）

### 2.4 Tailwind CSS設定

#### tailwind.config.js

```javascript
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: []
};
```

#### postcss.config.js

```javascript
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	}
};
```

### 2.5 プロジェクト構造の初期化

```
note/
├── src/
│   ├── app.d.ts        # TypeScript型定義
│   ├── app.html        # HTMLテンプレート
│   ├── app.css         # グローバルCSS（Tailwind含む）
│   ├── lib/            # 共有コンポーネント・ユーティリティ
│   │   ├── components/
│   │   ├── server/
│   │   └── utils/
│   └── routes/         # SvelteKitルート
├── static/             # 静的ファイル
├── tests/              # テストファイル
└── drizzle/            # データベースマイグレーション
```

## 3. データモデル

Phase 1では基本的なプロジェクト構造のみを設定するため、データモデルの実装は含みません。

## 4. UI/UXデザイン

Phase 1では基本的なレイアウト構造のみを設定：

- app.htmlにメタタグとfavicon設定
- app.cssにTailwindディレクティブを追加
- 基本的なエラーページ（+error.svelte）

## 5. テスト計画

- プロジェクトの初期化が正しく完了することを確認
- 開発サーバーが起動することを確認
- ビルドが成功することを確認
- 基本的なルーティングが動作することを確認

## 6. 関連ドキュメント

- 全体設計書：`/doc/design.md`
- 開発プロセス：`/doc/development.md`
- Phase 1 Issue定義：`/doc/issues/phase-1/` （作成予定）
