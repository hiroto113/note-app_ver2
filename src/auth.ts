import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	secret: env.AUTH_SECRET || 'development-secret-key',
	providers: [
		Credentials({
			name: 'credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					return null;
				}

				const user = await db
					.select()
					.from(users)
					.where(eq(users.username, credentials.username as string))
					.get();

				if (!user) {
					return null;
				}

				const isValidPassword = await bcrypt.compare(
					credentials.password as string,
					user.hashedPassword
				);

				if (!isValidPassword) {
					return null;
				}

				return {
					id: user.id,
					name: user.username,
					email: null
				};
			}
		})
	],
	pages: {
		signIn: '/login'
	},
	session: {
		strategy: 'jwt'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.id) {
				session.user.id = token.id as string;
			}
			return session;
		}
	}
});
