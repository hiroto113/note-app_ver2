import sharp from 'sharp';

/**
 * 画像処理のオプション
 */
export interface ImageProcessingOptions {
	removeExif?: boolean;
	optimize?: boolean;
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
}

/**
 * 画像を処理（EXIF削除、最適化、リサイズ）
 */
export async function processImage(
	buffer: ArrayBuffer,
	mimeType: string,
	options: ImageProcessingOptions = {}
): Promise<Buffer> {
	const { removeExif = true, quality = 90, maxWidth = 2048, maxHeight = 2048 } = options;

	let processor = sharp(Buffer.from(buffer));

	// メタデータを取得
	const metadata = await processor.metadata();

	// リサイズが必要かチェック
	if (metadata.width && metadata.height) {
		if (metadata.width > maxWidth || metadata.height > maxHeight) {
			processor = processor.resize(maxWidth, maxHeight, {
				fit: 'inside',
				withoutEnlargement: true
			});
		}
	}

	// SVGは処理をスキップ
	if (mimeType === 'image/svg+xml') {
		return Buffer.from(buffer);
	}

	// フォーマット別の最適化
	switch (mimeType) {
		case 'image/jpeg':
			processor = processor.jpeg({
				quality,
				progressive: true,
				mozjpeg: true
			});
			break;

		case 'image/png':
			processor = processor.png({
				compressionLevel: 8,
				adaptiveFiltering: true
			});
			break;

		case 'image/webp':
			processor = processor.webp({
				quality,
				effort: 6
			});
			break;

		case 'image/gif':
			// GIFはそのまま（Sharpではアニメーション保持が困難）
			return Buffer.from(buffer);

		default:
			// その他の形式はそのまま
			return Buffer.from(buffer);
	}

	// EXIF情報を削除
	if (removeExif) {
		processor = processor.rotate(); // auto-orientでEXIF回転情報を適用してから削除
	}

	return await processor.toBuffer();
}

/**
 * サムネイル生成
 */
export async function generateThumbnail(
	buffer: ArrayBuffer,
	mimeType: string,
	size: number = 200
): Promise<Buffer | null> {
	// SVGやGIFはサムネイル生成をスキップ
	if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
		return null;
	}

	try {
		return await sharp(Buffer.from(buffer))
			.resize(size, size, {
				fit: 'cover',
				position: 'center'
			})
			.jpeg({
				quality: 80,
				progressive: true
			})
			.toBuffer();
	} catch (error) {
		console.error('Failed to generate thumbnail:', error);
		return null;
	}
}

/**
 * 画像の基本情報を取得
 */
export async function getImageInfo(buffer: ArrayBuffer) {
	try {
		const metadata = await sharp(Buffer.from(buffer)).metadata();
		return {
			width: metadata.width,
			height: metadata.height,
			format: metadata.format,
			size: metadata.size,
			hasAlpha: metadata.hasAlpha,
			colorspace: metadata.space
		};
	} catch (error) {
		console.error('Failed to get image info:', error);
		return null;
	}
}
