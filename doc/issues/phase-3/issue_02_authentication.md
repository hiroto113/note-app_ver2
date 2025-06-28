---
name: Feature Request
about: 認証機能実装（ログイン/ログアウト）
title: '[Phase3] [feature] 認証機能実装（ログイン/ログアウト）'
assignees: 'hiroto113'
labels:
    - 'type:feature'
    - 'scope:backend'
    - 'priority:high'
    - 'phase:3'
---

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
