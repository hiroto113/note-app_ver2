# 認証機能実装 詳細設計書 (Auth.js)

## 1. 概要

- 管理画面へのアクセスを制御するため、管理者向けの認証機能（ログイン・ログアウト）を実装する。
- 認証ライブラリとして、SvelteKit公式でサポートされている `Auth.js` (`@auth/sveltekit`) を採用する。

## 2. 実装仕様

- **ライブラリのインストール**:
    - `@auth/sveltekit`: SvelteKit用インテグレーション
    - `@auth/core`: Auth.jsコアライブラリ
    - `@auth/drizzle-adapter`: Drizzle ORM用アダプター
- **Auth.jsの設定**:
    - `src/auth.ts`を作成し、`SvelteKitAuth` の設定を行う。
        - プロバイダーとして `Credentials` を設定し、ユーザー名とパスワードによる認証を許可する。
        - Drizzleアダプター (`@auth/drizzle-adapter`) を接続する。
- **データベーススキーマの更新**:
    - `src/lib/server/db/schema.ts` に、Auth.jsが必要とするテーブル（`users`, `accounts`, `sessions`, `verificationTokens`）を追加する。
- **フックの設定**:
    - `src/hooks.server.ts` を作成または編集し、`SvelteKitAuth` の `handle` 関数を組み込む。これにより、認証関連のエンドポイント (`/auth/*`) が自動的に処理される。
- **ログインページの作成**:
    - `src/routes/login/+page.svelte` に、ユーザー名とパスワードを入力するフォームを作成する。
    - このフォームは `/auth/callback/credentials` にPOSTリクエストを送信し、Auth.jsの認証フローを開始させる。
- **アクセス制御の実装**:
    - `src/(admin)/+layout.server.ts` を作成し、`load`関数内でセッション情報を確認する。
    - 未認証のユーザーがアクセスした場合、ログインページ（`/login`）にリダイレクトさせる。
    - `event.locals.getSession()` を利用してセッション情報を取得する。

## 3. データモデル

- `src/lib/server/db/schema.ts` に、`@auth/drizzle-adapter` が要求する以下のテーブルスキーマを定義する。
    - `users`
    - `accounts`
    - `sessions`
    - `verificationTokens`

## 4. UI/UXデザイン

- シンプルなログインフォームを`/login`に配置する。
- 管理画面のレイアウト（`(admin)/+layout.svelte`）にログアウトボタンを配置する。ログアウトは `/auth/signout` へのリンクまたはPOSTリクエストで行う。

## 5. テスト計画

- [ ] 正しい認証情報でログインできることを確認する。
- [ ] 間違った認証情報でログインが失敗することを確認する。
- [ ] 未ログイン状態で管理画面URLにアクセスした際、ログインページにリダイレクトされることを確認する。
- [ ] ログイン状態で管理画面URLにアクセスできることを確認する。
- [ ] ログアウトボタンを押すと `/auth/signout` が実行され、セッションが切れ、管理画面にアクセスできなくなることを確認する。

## 6. 関連ドキュメント

- `doc/designs/phase-3/01_database-setup.md`
- `doc/issues/phase-3/issue_02_authentication.md`
- Auth.js for SvelteKit: [https://authjs.dev/getting-started/frameworks/sveltekit](https://authjs.dev/getting-started/frameworks/sveltekit)
- Drizzle Adapter: [https://authjs.dev/getting-started/adapters/drizzle](https://authjs.dev/getting-started/adapters/drizzle)
