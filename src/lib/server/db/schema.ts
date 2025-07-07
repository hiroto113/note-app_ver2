import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Sessions table for Auth.js
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Categories table
export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Posts table
export const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	content: text('content').notNull(),
	excerpt: text('excerpt'),
	status: text('status', { enum: ['draft', 'published'] })
		.notNull()
		.default('draft'),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

// Many-to-many relationship table for posts and categories
export const postsToCategories = sqliteTable(
	'posts_to_categories',
	{
		postId: integer('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' })
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.categoryId] }),
		postIdIdx: index('posts_to_categories_post_id_idx').on(table.postId),
		categoryIdIdx: index('posts_to_categories_category_id_idx').on(table.categoryId)
	})
);

// Media table for uploaded files
export const media = sqliteTable('media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	filename: text('filename').notNull().unique(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	url: text('url').notNull(),
	uploadedBy: text('uploaded_by')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	posts: many(posts),
	sessions: many(sessions),
	media: many(media)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
	author: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	postsToCategories: many(postsToCategories)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	postsToCategories: many(postsToCategories)
}));

export const postsToCategoriesRelations = relations(postsToCategories, ({ one }) => ({
	post: one(posts, {
		fields: [postsToCategories.postId],
		references: [posts.id]
	}),
	category: one(categories, {
		fields: [postsToCategories.categoryId],
		references: [categories.id]
	})
}));

export const mediaRelations = relations(media, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [media.uploadedBy],
		references: [users.id]
	})
}));

// Quality metrics table for dashboard
export const qualityMetrics = sqliteTable('quality_metrics', {
	id: text('id').primaryKey(),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	commitHash: text('commit_hash').notNull(),
	branch: text('branch').notNull(),

	// Lighthouse scores
	lighthousePerformance: integer('lighthouse_performance'),
	lighthouseAccessibility: integer('lighthouse_accessibility'),
	lighthouseBestPractices: integer('lighthouse_best_practices'),
	lighthouseSeo: integer('lighthouse_seo'),
	lighthousePwa: integer('lighthouse_pwa'),

	// Core Web Vitals
	lcp: integer('lcp'), // Largest Contentful Paint (ms)
	fid: integer('fid'), // First Input Delay (ms)
	cls: integer('cls'), // Cumulative Layout Shift (x1000)

	// Test results
	testUnitTotal: integer('test_unit_total'),
	testUnitPassed: integer('test_unit_passed'),
	testUnitFailed: integer('test_unit_failed'),
	testUnitCoverage: integer('test_unit_coverage'), // percentage x100
	testIntegrationTotal: integer('test_integration_total'),
	testIntegrationPassed: integer('test_integration_passed'),
	testIntegrationFailed: integer('test_integration_failed'),
	testIntegrationCoverage: integer('test_integration_coverage'), // percentage x100
	testE2eTotal: integer('test_e2e_total'),
	testE2ePassed: integer('test_e2e_passed'),
	testE2eFailed: integer('test_e2e_failed'),
	testE2eCoverage: integer('test_e2e_coverage'), // percentage x100

	// Performance metrics
	bundleSize: integer('bundle_size'), // bytes
	loadTime: integer('load_time'), // ms
	ttfb: integer('ttfb'), // Time to First Byte (ms)

	// Accessibility
	wcagScore: integer('wcag_score'), // percentage x100
	axeViolations: integer('axe_violations'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type QualityMetrics = typeof qualityMetrics.$inferSelect;
export type NewQualityMetrics = typeof qualityMetrics.$inferInsert;
