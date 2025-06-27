import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Sessions table for Auth.js
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Categories table
export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Posts table
export const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	content: text('content').notNull(),
	excerpt: text('excerpt'),
	status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

// Many-to-many relationship table for posts and categories
export const postsToCategories = sqliteTable('posts_to_categories', {
	postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' })
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	posts: many(posts),
	sessions: many(sessions)
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

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;