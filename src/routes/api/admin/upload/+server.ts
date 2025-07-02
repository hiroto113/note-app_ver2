import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import {
	validateFile,
	generateSafeFilename,
	generateUploadPath
} from '$lib/server/file-validation';
import { processImage } from '$lib/server/image-processing';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

// レート制限用のマップ（本来はRedisなどを使用）
const uploadCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * レート制限チェック
 */
function checkRateLimit(userId: string): boolean {
	const now = Date.now();
	const userLimit = uploadCounts.get(userId);

	if (!userLimit || now > userLimit.resetTime) {
		// 新しい制限期間を開始
		uploadCounts.set(userId, {
			count: 1,
			resetTime: now + 60 * 1000 // 1分後
		});
		return true;
	}

	if (userLimit.count >= 10) {
		return false; // 制限に達している
	}

	userLimit.count++;
	return true;
}

/**
 * ファイルアップロードAPI
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// 認証チェック（hooks.server.tsで実行済み）
		const session = await locals.getSession?.();
		const userId = session?.user?.id;

		if (!userId) {
			throw error(401, 'Unauthorized');
		}

		// レート制限チェック
		if (!checkRateLimit(userId)) {
			throw error(429, 'Too many uploads. Please wait before uploading again.');
		}

		// フォームデータを取得
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const type = (formData.get('type') as string) || 'image';

		if (!file) {
			throw error(400, 'No file provided');
		}

		// ファイルタイプの検証
		const category = type === 'document' ? 'document' : 'image';

		// ファイルをバッファに変換
		const arrayBuffer = await file.arrayBuffer();

		// ファイルバリデーション
		const validation = await validateFile(arrayBuffer, file.name, file.type, category);

		if (!validation.isValid) {
			throw error(400, `File validation failed: ${validation.errors.join(', ')}`);
		}

		// UUIDを生成
		const fileUuid = uuidv4();
		const safeFilename = generateSafeFilename(file.name, fileUuid);
		const uploadPath = generateUploadPath(category);
		const fullUploadPath = join('static', uploadPath);
		const filePath = join(fullUploadPath, safeFilename);
		const publicUrl = `/${uploadPath}/${safeFilename}`;

		// ディレクトリを作成
		await mkdir(fullUploadPath, { recursive: true });

		let processedBuffer: Buffer;

		// 画像の場合は処理を実行
		if (category === 'image') {
			processedBuffer = await processImage(arrayBuffer, file.type, {
				removeExif: true,
				optimize: true,
				quality: 90
			});
		} else {
			processedBuffer = Buffer.from(arrayBuffer);
		}

		// ファイルを保存
		await writeFile(filePath, processedBuffer);

		// データベースに記録
		const result = await db
			.insert(media)
			.values({
				filename: safeFilename,
				originalName: file.name,
				mimeType: file.type,
				size: processedBuffer.length,
				url: publicUrl,
				uploadedBy: userId
			})
			.returning();

		const savedMedia = result[0];

		return json(
			{
				success: true,
				file: {
					id: savedMedia.id,
					url: savedMedia.url,
					name: savedMedia.originalName,
					filename: savedMedia.filename,
					size: savedMedia.size,
					type: savedMedia.mimeType,
					uploadedAt: savedMedia.uploadedAt
				}
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Error uploading file:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		return json({ error: 'Failed to upload file' }, { status: 500 });
	}
};

/**
 * アップロード済みファイル一覧取得
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// 認証チェック
		const session = await locals.getSession?.();
		const userId = session?.user?.id;

		if (!userId) {
			throw error(401, 'Unauthorized');
		}

		// クエリパラメータ
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

		const offset = (page - 1) * limit;

		// メディアファイル一覧を取得（フィルタリングは将来実装）
		const files = await db
			.select({
				id: media.id,
				filename: media.filename,
				originalName: media.originalName,
				mimeType: media.mimeType,
				size: media.size,
				url: media.url,
				uploadedAt: media.uploadedAt
			})
			.from(media)
			.orderBy(media.uploadedAt)
			.limit(limit)
			.offset(offset);

		return json({
			files,
			pagination: {
				page,
				limit,
				total: files.length // TODO: 正確な総数を取得
			}
		});
	} catch (err) {
		console.error('Error fetching media files:', err);
		return json({ error: 'Failed to fetch media files' }, { status: 500 });
	}
};
