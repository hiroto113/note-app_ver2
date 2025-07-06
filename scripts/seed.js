import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define schema inline for seed script
const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	description: text('description')
});

const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	excerpt: text('excerpt'),
	content: text('content').notNull(),
	status: text('status', { enum: ['draft', 'published'] })
		.notNull()
		.default('draft'),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

const postsToCategories = sqliteTable('posts_to_categories', {
	postId: integer('post_id')
		.notNull()
		.references(() => posts.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id, { onDelete: 'cascade' })
});

const client = createClient({
	url: process.env.DATABASE_URL || 'file:local.db'
});

const db = drizzle(client);

export async function createAdminUser() {
	const username = 'admin';
	const password = 'admin123';

	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await db.insert(users).values({
			id: randomUUID(),
			username,
			hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		console.log(`Admin user created: ${username} / ${password}`);
	} catch (error) {
		console.log('Admin user might already exist or error occurred:', error);
	}
}

export async function createSampleData() {
	try {
		// Create categories
		const techCategory = await db
			.insert(categories)
			.values({
				name: 'Technology',
				slug: 'technology',
				description: 'Posts about technology and programming'
			})
			.returning();

		const aiCategory = await db
			.insert(categories)
			.values({
				name: 'AI & Machine Learning',
				slug: 'ai-ml',
				description: 'Posts about AI and Machine Learning'
			})
			.returning();

		console.log('Categories created');

		// Get admin user
		const adminUser = await db.select().from(users).limit(1);
		if (!adminUser[0]) {
			console.error('Admin user not found');
			return;
		}

		// Create sample posts
		const samplePosts = [
			{
				title: 'Getting Started with SvelteKit',
				slug: 'getting-started-sveltekit',
				content: `# Getting Started with SvelteKit\n\nSvelteKit is an amazing framework for building web applications. In this post, we'll explore the basics of SvelteKit and how to get started with your first project.\n\n## What is SvelteKit?\n\nSvelteKit is a framework for building web applications using Svelte. It provides:\n\n- Server-side rendering (SSR)\n- Static site generation (SSG)\n- Client-side routing\n- API routes\n- And much more!\n\n## Installation\n\nTo create a new SvelteKit project, run:\n\n\`\`\`bash\nnpm create svelte@latest my-app\ncd my-app\nnpm install\nnpm run dev\n\`\`\`\n\n## Project Structure\n\nA typical SvelteKit project has the following structure:\n\n\`\`\`\nsrc/\n├── routes/\n│   ├── +page.svelte\n│   └── +layout.svelte\n├── lib/\n└── app.html\n\`\`\`\n\nHappy coding!`,
				excerpt:
					'Learn the basics of SvelteKit and how to get started with your first project.',
				status: 'published',
				publishedAt: new Date(),
				userId: adminUser[0].id,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				title: 'Understanding AI and Machine Learning',
				slug: 'understanding-ai-ml',
				content: `# Understanding AI and Machine Learning\n\nArtificial Intelligence and Machine Learning are transforming the world. Let's explore what they are and how they work.\n\n## What is AI?\n\nArtificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn.\n\n## What is Machine Learning?\n\nMachine Learning is a subset of AI that enables machines to learn from data without being explicitly programmed.\n\n### Types of Machine Learning\n\n1. **Supervised Learning**: Learning from labeled data\n2. **Unsupervised Learning**: Finding patterns in unlabeled data\n3. **Reinforcement Learning**: Learning through trial and error\n\n## Applications\n\n- Natural Language Processing\n- Computer Vision\n- Recommendation Systems\n- Autonomous Vehicles\n\nThe future is exciting!`,
				excerpt:
					'An introduction to Artificial Intelligence and Machine Learning concepts.',
				status: 'published',
				publishedAt: new Date(),
				userId: adminUser[0].id,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				title: 'Building Modern Web APIs',
				slug: 'building-modern-web-apis',
				content: `# Building Modern Web APIs\n\nCreating robust and scalable APIs is essential for modern web development. Let's explore best practices for building APIs.\n\n## RESTful Design Principles\n\n- Use proper HTTP methods\n- Design intuitive endpoints\n- Implement proper status codes\n- Version your API\n\n## Security Best Practices\n\n1. **Authentication**: Use JWT or OAuth\n2. **Authorization**: Implement proper access controls\n3. **Rate Limiting**: Prevent abuse\n4. **Input Validation**: Always validate user input\n\n## Performance Optimization\n\n- Implement caching\n- Use pagination for large datasets\n- Optimize database queries\n- Consider GraphQL for complex data needs\n\nBuild APIs that developers love to use!`,
				excerpt: 'Best practices for building modern, secure, and scalable web APIs.',
				status: 'published',
				publishedAt: new Date(Date.now() - 86400000), // 1 day ago
				userId: adminUser[0].id
			}
		];

		// Insert posts
		for (const postData of samplePosts) {
			const [post] = await db.insert(posts).values(postData).returning();

			// Assign categories to posts
			if (post.slug.includes('sveltekit') || post.slug.includes('api')) {
				await db.insert(postsToCategories).values({
					postId: post.id,
					categoryId: techCategory[0].id
				});
			}
			if (post.slug.includes('ai') || post.slug.includes('ml')) {
				await db.insert(postsToCategories).values({
					postId: post.id,
					categoryId: aiCategory[0].id
				});
			}
		}

		console.log('Sample posts created');
	} catch (error) {
		console.error('Error creating sample data:', error);
	}
}

// Run seed
createAdminUser()
	.then(() => createSampleData())
	.then(() => {
		console.log('Seed completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	});
