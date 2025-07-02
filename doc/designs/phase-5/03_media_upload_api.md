# メディアアップロードAPI 詳細設計書

## 1. 概要

- 管理画面から画像などのメディアファイルをアップロードするためのAPIを実装します
- ファイルサイズとファイル形式の制限を設け、セキュアなアップロード機能を提供します
- 関連する全体設計: `design.md` セクション3.1（記事管理機能）

## 2. 実装仕様

### 2.1 コンポーネント設計

#### ディレクトリ構造

```
src/routes/api/admin/
└── upload/
    └── +server.ts      # POST: ファイルアップロード

static/uploads/         # アップロードされたファイルの保存先
└── images/
    └── [year]/
        └── [month]/
            └── [filename]
```

### 2.2 APIエンドポイント

#### 2.2.1 ファイルアップロードAPI

- **URL**: `/api/admin/upload`
- **Method**: `POST`
- **Headers**:
    - `Authorization: Bearer {session_token}`
    - `Content-Type: multipart/form-data`
- **Request Body**: FormData
    - `file`: アップロードするファイル
    - `type`: 'image' | 'document' (optional, default: 'image')
- **Response**:
    ```json
    {
    	"success": true,
    	"file": {
    		"url": "/uploads/images/2024/06/filename.jpg",
    		"name": "filename.jpg",
    		"size": 1024000,
    		"type": "image/jpeg",
    		"uploadedAt": "2024-06-20T00:00:00Z"
    	}
    }
    ```

### 2.3 ファイル制限

#### 2.3.1 ファイルサイズ制限

- 画像: 最大5MB
- ドキュメント: 最大10MB

#### 2.3.2 許可するファイル形式

- 画像: JPEG, PNG, GIF, WebP, SVG
- ドキュメント: PDF, TXT, MD

#### 2.3.3 ファイル名処理

- アップロード時にUUIDベースのファイル名に変更
- 元のファイル名はメタデータとして保存
- 例: `original.jpg` → `a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

### 2.4 セキュリティ対策

1. **ファイル検証**
    - MIMEタイプの検証
    - ファイル拡張子の検証
    - マジックナンバーによる実際のファイル形式確認

2. **アップロード制限**
    - レート制限: 1分間に10ファイルまで
    - 1日のアップロード容量制限: 100MB

3. **ストレージ保護**
    - アップロードディレクトリの実行権限無効化
    - ディレクトリトラバーサル対策

### 2.5 画像処理

アップロード時に以下の処理を実行：

1. EXIF情報の削除（プライバシー保護）
2. 画像の最適化（品質90%でのJPEG再圧縮）
3. サムネイル生成（オプション）

## 3. データモデル

メディアファイルのメタデータを管理するテーブルを追加：

```sql
CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 4. UI/UXデザイン

- ドラッグ&ドロップ対応のアップロードエリア
- アップロード進捗表示
- プレビュー機能
- アップロード履歴の表示

## 5. テスト計画

### 5.1 ユニットテスト

- ファイルバリデーションのテスト
- ファイル名生成のテスト
- セキュリティチェックのテスト

### 5.2 統合テスト

- 実際のファイルアップロードテスト
- 大容量ファイルの処理テスト
- 同時アップロードのテスト

### 5.3 セキュリティテスト

- 悪意のあるファイルのアップロード試行
- ディレクトリトラバーサル攻撃の試行
- DoS攻撃（大量アップロード）の試行

## 6. 関連ドキュメント

- 全体設計書: `/doc/design.md`
- Issue定義書: `/doc/issues/phase-5/issue_media_upload.md`
- セキュリティガイドライン: 内部ドキュメント参照
