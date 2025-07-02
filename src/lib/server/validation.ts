import { json } from '@sveltejs/kit';

// バリデーションエラーの型定義
export interface ValidationError {
	field: string;
	message: string;
}

// バリデーション結果の型定義
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

// 記事作成/更新用のバリデーション
export function validatePost(data: {
	title?: string;
	content?: string;
	excerpt?: string;
	status?: string;
	categoryIds?: number[];
}): ValidationResult {
	const errors: ValidationError[] = [];

	// タイトルの検証
	if (!data.title || typeof data.title !== 'string') {
		errors.push({ field: 'title', message: 'Title is required and must be a string' });
	} else if (data.title.trim().length === 0) {
		errors.push({ field: 'title', message: 'Title cannot be empty' });
	} else if (data.title.length > 255) {
		errors.push({ field: 'title', message: 'Title must be 255 characters or less' });
	}

	// コンテンツの検証
	if (!data.content || typeof data.content !== 'string') {
		errors.push({ field: 'content', message: 'Content is required and must be a string' });
	} else if (data.content.trim().length === 0) {
		errors.push({ field: 'content', message: 'Content cannot be empty' });
	}

	// 抜粋の検証（オプション）
	if (data.excerpt !== undefined && data.excerpt !== null) {
		if (typeof data.excerpt !== 'string') {
			errors.push({ field: 'excerpt', message: 'Excerpt must be a string' });
		} else if (data.excerpt.length > 500) {
			errors.push({ field: 'excerpt', message: 'Excerpt must be 500 characters or less' });
		}
	}

	// ステータスの検証
	if (data.status && !['draft', 'published'].includes(data.status)) {
		errors.push({ field: 'status', message: 'Status must be either "draft" or "published"' });
	}

	// カテゴリIDの検証（オプション）
	if (data.categoryIds !== undefined) {
		if (!Array.isArray(data.categoryIds)) {
			errors.push({ field: 'categoryIds', message: 'Category IDs must be an array' });
		} else {
			const invalidIds = data.categoryIds.filter((id) => !Number.isInteger(id) || id <= 0);
			if (invalidIds.length > 0) {
				errors.push({
					field: 'categoryIds',
					message: 'All category IDs must be positive integers'
				});
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

// カテゴリ作成/更新用のバリデーション
export function validateCategory(data: {
	name?: string;
	description?: string;
	id?: number;
}): ValidationResult {
	const errors: ValidationError[] = [];

	// 名前の検証
	if (!data.name || typeof data.name !== 'string') {
		errors.push({ field: 'name', message: 'Name is required and must be a string' });
	} else if (data.name.trim().length === 0) {
		errors.push({ field: 'name', message: 'Name cannot be empty' });
	} else if (data.name.length > 100) {
		errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
	}

	// 説明の検証（オプション）
	if (data.description !== undefined && data.description !== null) {
		if (typeof data.description !== 'string') {
			errors.push({ field: 'description', message: 'Description must be a string' });
		} else if (data.description.length > 500) {
			errors.push({
				field: 'description',
				message: 'Description must be 500 characters or less'
			});
		}
	}

	// IDの検証（更新時）
	if (data.id !== undefined) {
		if (!Number.isInteger(data.id) || data.id <= 0) {
			errors.push({ field: 'id', message: 'ID must be a positive integer' });
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

// ページネーション用のバリデーション
export function validatePagination(data: { page?: string | null; limit?: string | null }): {
	page: number;
	limit: number;
	errors: ValidationError[];
} {
	const errors: ValidationError[] = [];
	let page = 1;
	let limit = 10;

	// ページ番号の検証
	if (data.page) {
		const pageNum = parseInt(data.page);
		if (isNaN(pageNum) || pageNum < 1) {
			errors.push({ field: 'page', message: 'Page must be a positive integer' });
		} else {
			page = pageNum;
		}
	}

	// リミットの検証
	if (data.limit) {
		const limitNum = parseInt(data.limit);
		if (isNaN(limitNum) || limitNum < 1) {
			errors.push({ field: 'limit', message: 'Limit must be a positive integer' });
		} else if (limitNum > 50) {
			errors.push({ field: 'limit', message: 'Limit must be 50 or less' });
		} else {
			limit = limitNum;
		}
	}

	return { page, limit, errors };
}

// バリデーションエラーレスポンス生成
export function createValidationErrorResponse(errors: ValidationError[]) {
	return json(
		{
			error: 'Validation failed',
			details: errors
		},
		{ status: 400 }
	);
}
