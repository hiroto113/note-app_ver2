import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const client = createClient({
	url: env.DATABASE_URL || 'file:local.db'
});

export const db = drizzle(client, { schema });
