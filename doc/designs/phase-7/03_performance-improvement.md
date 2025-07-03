# パフォーマンス改善 詳細設計書

## 1. 概要

- Webサイトのパフォーマンスを向上させ、ユーザー体験を改善します
- Core Web Vitalsの各指標を最適化します
- 関連する全体設計（`design.md`）: 4.1 パフォーマンス要件

## 2. 実装仕様

### 2.1 画像最適化

#### 実装内容

1. **WebP対応**
    - 画像をWebP形式で配信
    - pictureタグでフォールバック対応

2. **遅延読み込み**
    - Intersection Observerを使用
    - loading="lazy"属性の活用

3. **レスポンシブ画像**
    - srcset属性で複数サイズ提供
    - sizesで適切なサイズ選択

#### Image.svelteコンポーネント

```svelte
<picture>
	<source type="image/webp" srcset={generateSrcSet(src, 'webp')} {sizes} />
	<img {src} srcset={generateSrcSet(src, 'jpg')} {sizes} loading="lazy" {alt} />
</picture>
```

### 2.2 Code Splitting

#### 実装方針

- 動的インポートの活用
- ルートベースの分割
- コンポーネントレベルの遅延読み込み

#### 適用箇所

1. **管理画面**
    - 管理画面全体を別バンドルに分離
    - リッチテキストエディタの遅延読み込み

2. **アニメーション**
    - アニメーションライブラリの遅延読み込み
    - 必要時のみロード

### 2.3 Critical CSS

#### 実装内容

1. **インラインCSS**
    - Above-the-foldのCSSをインライン化
    - 残りのCSSは非同期読み込み

2. **CSS最小化**
    - 未使用CSSの削除
    - PurgeCSSの設定最適化

### 2.4 キャッシュ戦略

#### 実装方針

1. **静的アセット**
    - 長期キャッシュ（1年）
    - ファイル名にハッシュ付与

2. **APIレスポンス**
    - 適切なCache-Controlヘッダー
    - ETagの活用

3. **Service Worker**
    - オフライン対応
    - キャッシュファースト戦略

### 2.5 フォント最適化

#### 実装内容

1. **サブセット化**
    - 日本語フォントのサブセット作成
    - 使用文字のみ含める

2. **プリロード**
    - 重要フォントのpreload
    - font-displayの最適化

## 3. データモデル

変更なし

## 4. UI/UXデザイン

- ローディングスケルトンの実装
- プログレッシブエンハンスメント
- 体感速度の向上

## 5. テスト計画

### パフォーマンステスト

- Lighthouse CI の導入
- Web Vitals の継続的監視
- 各種デバイスでの実機テスト

### 測定項目

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

## 6. 関連ドキュメント

- 関連Issue定義書: `/doc/issues/phase-7/issue_performance-improvement.md`
- 全体設計書: `/doc/design.md` - 4.1 パフォーマンス要件
