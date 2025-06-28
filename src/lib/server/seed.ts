import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users } from './db/schema.js';
import bcrypt from 'bcryptjs';

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
			id: crypto.randomUUID(),
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	createAdminUser()
		.then(() => {
			console.log('Seed completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Seed failed:', error);
			process.exit(1);
		});
}
