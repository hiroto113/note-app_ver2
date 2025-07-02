import { fileTypeFromBuffer } from 'file-type';

// 許可するファイル形式
export const ALLOWED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml'
];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
export const ALLOWED_EXTENSIONS = {
	image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
	document: ['.pdf', '.txt', '.md']
};

// ファイルサイズ制限（バイト）
export const FILE_SIZE_LIMITS = {
	image: 5 * 1024 * 1024, // 5MB
	document: 10 * 1024 * 1024 // 10MB
};

// ファイルバリデーション結果の型
export interface FileValidationResult {
	isValid: boolean;
	errors: string[];
	detectedType?: string;
	category?: 'image' | 'document';
}

/**
 * ファイルバリデーションを実行
 */
export async function validateFile(
	buffer: ArrayBuffer,
	originalName: string,
	mimeType: string,
	expectedCategory?: 'image' | 'document'
): Promise<FileValidationResult> {
	const errors: string[] = [];

	// ファイル拡張子を取得
	const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));

	// ファイルタイプを検出
	const detectedType = await fileTypeFromBuffer(buffer);
	const detectedMimeType = detectedType?.mime;

	// カテゴリを決定
	let category: 'image' | 'document' | undefined;
	if (expectedCategory) {
		category = expectedCategory;
	} else if (
		ALLOWED_IMAGE_TYPES.includes(mimeType) ||
		ALLOWED_IMAGE_TYPES.includes(detectedMimeType || '')
	) {
		category = 'image';
	} else if (
		ALLOWED_DOCUMENT_TYPES.includes(mimeType) ||
		ALLOWED_DOCUMENT_TYPES.includes(detectedMimeType || '')
	) {
		category = 'document';
	}

	if (!category) {
		errors.push('Unsupported file type');
		return {
			isValid: false,
			errors,
			detectedType: detectedMimeType
		};
	}

	// ファイルサイズチェック
	if (buffer.byteLength > FILE_SIZE_LIMITS[category]) {
		const limitMB = FILE_SIZE_LIMITS[category] / (1024 * 1024);
		errors.push(`File size exceeds ${limitMB}MB limit`);
	}

	// 拡張子チェック
	if (!ALLOWED_EXTENSIONS[category].includes(extension)) {
		errors.push(`Invalid file extension: ${extension}`);
	}

	// MIMEタイプチェック
	const allowedTypes = category === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
	if (!allowedTypes.includes(mimeType)) {
		errors.push(`Invalid MIME type: ${mimeType}`);
	}

	// 実際のファイルタイプとMIMEタイプの整合性チェック
	if (detectedMimeType && detectedMimeType !== mimeType) {
		// SVGは例外（テキストベースのため検出されない場合がある）
		if (!(mimeType === 'image/svg+xml' && extension === '.svg')) {
			errors.push(`MIME type mismatch: declared ${mimeType}, detected ${detectedMimeType}`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		detectedType: detectedMimeType,
		category
	};
}

/**
 * ファイル名をサニタイズ
 */
export function sanitizeFilename(filename: string): string {
	// 危険な文字を除去
	return filename
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '');
}

/**
 * 安全なファイル名を生成（UUID + 元の拡張子）
 */
export function generateSafeFilename(originalName: string, uuid: string): string {
	const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
	return `${uuid}${extension}`;
}

/**
 * アップロードパスを生成（年/月の構造）
 */
export function generateUploadPath(category: 'image' | 'document'): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');

	return `uploads/${category === 'image' ? 'images' : 'documents'}/${year}/${month}`;
}
