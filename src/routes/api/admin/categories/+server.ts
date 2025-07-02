import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/slug';
import { eq, desc } from 'drizzle-orm';
import { validateCategory, createValidationErrorResponse } from '$lib/server/validation';
import type { RequestHandler } from './$types';

// GET /api/admin/categories - Get all categories
export const GET: RequestHandler = async () => {
	try {
		const allCategories = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description,
				createdAt: categories.createdAt,
				updatedAt: categories.updatedAt
			})
			.from(categories)
			.orderBy(desc(categories.createdAt));

		return json({ categories: allCategories });
	} catch (err) {
		console.error('Error fetching categories:', err);
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	}
};

// POST /api/admin/categories - Create new category
export const POST: RequestHandler = async ({ request }) => {
	try {
		const categoryData = await request.json();
		const { name, description } = categoryData;

		// バリデーション実行
		const validation = validateCategory(categoryData);
		if (!validation.isValid) {
			return createValidationErrorResponse(validation.errors);
		}

		// Generate unique slug
		const baseSlug = generateSlug(name);
		let slug = baseSlug;
		let counter = 1;

		// Check if slug exists and make it unique
		while (true) {
			const existingCategory = await db
				.select({ id: categories.id })
				.from(categories)
				.where(eq(categories.slug, slug))
				.get();

			if (!existingCategory) break;

			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		const now = new Date();

		// Create category
		const result = await db
			.insert(categories)
			.values({
				name,
				slug,
				description: description || null,
				createdAt: now,
				updatedAt: now
			})
			.returning({ id: categories.id });

		const categoryId = result[0].id;

		return json({ id: categoryId, slug }, { status: 201 });
	} catch (err) {
		console.error('Error creating category:', err);
		return json({ error: 'Failed to create category' }, { status: 500 });
	}
};

// PUT /api/admin/categories - Update category
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const categoryData = await request.json();
		const { id, name, description } = categoryData;

		// バリデーション実行
		const validation = validateCategory(categoryData);
		if (!validation.isValid) {
			return createValidationErrorResponse(validation.errors);
		}

		// Check if category exists
		const existingCategory = await db
			.select({ id: categories.id, slug: categories.slug })
			.from(categories)
			.where(eq(categories.id, id))
			.get();

		if (!existingCategory) {
			throw error(404, 'Category not found');
		}

		// Generate new slug if name changed
		let slug = existingCategory.slug;
		const newSlug = generateSlug(name);

		if (newSlug !== existingCategory.slug) {
			const baseSlug = newSlug;
			let counter = 1;
			slug = baseSlug;

			// Check if new slug exists (excluding current category)
			while (true) {
				const conflictingCategory = await db
					.select({ id: categories.id })
					.from(categories)
					.where(eq(categories.slug, slug))
					.get();

				if (!conflictingCategory || conflictingCategory.id === id) break;

				slug = `${baseSlug}-${counter}`;
				counter++;
			}
		}

		const now = new Date();

		// Update category
		await db
			.update(categories)
			.set({
				name,
				slug,
				description: description || null,
				updatedAt: now
			})
			.where(eq(categories.id, id));

		return json({ success: true, slug });
	} catch (err) {
		console.error('Error updating category:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to update category' }, { status: 500 });
	}
};

// DELETE /api/admin/categories - Delete category
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id || !Number.isInteger(id) || id <= 0) {
			return json({ error: 'Valid ID is required' }, { status: 400 });
		}

		// Check if category exists
		const existingCategory = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.id, id))
			.get();

		if (!existingCategory) {
			throw error(404, 'Category not found');
		}

		// Delete category (posts_to_categories will be deleted automatically due to foreign key cascade)
		await db.delete(categories).where(eq(categories.id, id));

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting category:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		return json({ error: 'Failed to delete category' }, { status: 500 });
	}
};
