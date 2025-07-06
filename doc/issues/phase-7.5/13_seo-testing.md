# Issue: SEOテストの実装

## 基本情報

- **Issue Type**: Task
- **Priority**: High
- **Estimated Time**: 2-3日
- **Assignee**: 開発者
- **Labels**: `testing`, `seo`, `meta-tags`, `phase-7.5`

## 概要

SEO最適化の包括的なテストを実装し、メタタグ、OGP、構造化データ、サイトマップの適切性を検証します。

## 現在の状況

- SEOテストが未実装
- メタタグの検証が不足
- 構造化データの検証が不十分

## 実装タスク

### 1. メタタグテスト

- [ ] title要素の適切性検証
- [ ] meta descriptionの適切性検証
- [ ] meta keywordsの適切性検証
- [ ] canonical URLの検証
- [ ] robots metaの検証

### 2. OGPテスト

- [ ] og:titleの適切性検証
- [ ] og:descriptionの適切性検証
- [ ] og:imageの適切性検証
- [ ] og:urlの適切性検証
- [ ] Twitter Cardsの検証

### 3. 構造化データテスト

- [ ] JSON-LD構造化データの検証
- [ ] Article構造化データの検証
- [ ] BreadcrumbList構造化データの検証
- [ ] WebSite構造化データの検証

### 4. サイトマップ・インデックステスト

- [ ] sitemap.xmlの生成・内容検証
- [ ] robots.txtの内容検証
- [ ] URLの正規化検証
- [ ] 内部リンクの検証

## 完了基準

- [ ] Lighthouse SEOスコア95+の達成
- [ ] 全ページでのメタタグ適切性確認
- [ ] 構造化データの有効性確認
- [ ] 検索エンジンでの表示確認

## 関連ファイル

- `tests/seo/**/*.spec.ts`
- `src/routes/**/*.svelte`
- `src/lib/components/SEO.svelte`
- `static/sitemap.xml`

## 影響範囲

- 検索エンジン最適化
- ソーシャルメディア共有
- ユーザー流入
- ブランド認知

## 備考

- 実際の検索エンジンでの検証
- Google Search Consoleでの確認
- 継続的なSEO監視
