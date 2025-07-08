/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { authMock, createAuthenticatedUser } from '$lib/test-utils';

describe('Authentication Flow Integration', () => {
	beforeEach(async () => {
		// Clean up database
		await testDb.delete(sessions);
		await testDb.delete(users);

		// Clear auth mock
		authMock.clear();
	});

	afterEach(async () => {
		// Clean up
		await testDb.delete(sessions);
		await testDb.delete(users);
		authMock.clear();
	});

	describe('User Creation and Authentication', () => {
		it('should create a user with hashed password', async () => {
			const username = 'testuser';
			const password = 'testpass123';
			const hashedPassword = await bcrypt.hash(password, 10);

			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username,
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			expect(user).toBeDefined();
			expect(user.username).toBe(username);
			expect(user.hashedPassword).not.toBe(password); // Should be hashed
			expect(await bcrypt.compare(password, user.hashedPassword)).toBe(true);
		});

		it('should authenticate user with correct credentials', async () => {
			const username = 'testuser';
			const password = 'testpass123';
			const hashedPassword = await bcrypt.hash(password, 10);

			await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username,
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Test authentication logic
			const [user] = await testDb.select().from(users).where(eq(users.username, username));
			const isValid = await bcrypt.compare(password, user.hashedPassword);

			expect(isValid).toBe(true);
		});

		it('should reject authentication with wrong password', async () => {
			const username = 'testuser';
			const password = 'testpass123';
			const wrongPassword = 'wrongpass';
			const hashedPassword = await bcrypt.hash(password, 10);

			await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username,
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const [user] = await testDb.select().from(users).where(eq(users.username, username));
			const isValid = await bcrypt.compare(wrongPassword, user.hashedPassword);

			expect(isValid).toBe(false);
		});

		it('should handle non-existent user', async () => {
			const result = await testDb
				.select()
				.from(users)
				.where(eq(users.username, 'nonexistent'));
			expect(result).toHaveLength(0);
		});
	});

	describe('Session Management', () => {
		let testUserId: string;

		beforeEach(async () => {
			const hashedPassword = await bcrypt.hash('testpass', 10);
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'testuser',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();
			testUserId = user.id;
		});

		it('should create a session for authenticated user', async () => {
			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + 86400000); // 24 hours

			const [session] = await testDb
				.insert(sessions)
				.values({
					id: sessionId,
					userId: testUserId,
					expiresAt,
					createdAt: new Date()
				})
				.returning();

			expect(session).toBeDefined();
			expect(session.userId).toBe(testUserId);
			// タイムスタンプの精度の問題があるため、秒単位で比較
			expect(Math.floor(new Date(session.expiresAt).getTime() / 1000)).toBe(
				Math.floor(expiresAt.getTime() / 1000)
			);
		});

		it('should validate active session', async () => {
			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + 86400000); // Future

			await testDb.insert(sessions).values({
				id: sessionId,
				userId: testUserId,
				expiresAt,
				createdAt: new Date()
			});

			const [session] = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.id, sessionId));
			const now = new Date();

			expect(session).toBeDefined();
			expect(session.expiresAt > now).toBe(true);
		});

		it('should reject expired session', async () => {
			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(Date.now() - 86400000); // Past

			await testDb.insert(sessions).values({
				id: sessionId,
				userId: testUserId,
				expiresAt,
				createdAt: new Date()
			});

			const [session] = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.id, sessionId));
			const now = new Date();

			expect(session.expiresAt < now).toBe(true);
		});

		it('should delete session on logout', async () => {
			const sessionId = crypto.randomUUID();

			await testDb.insert(sessions).values({
				id: sessionId,
				userId: testUserId,
				expiresAt: new Date(Date.now() + 86400000),
				createdAt: new Date()
			});

			// Simulate logout
			await testDb.delete(sessions).where(eq(sessions.id, sessionId));

			const result = await testDb.select().from(sessions).where(eq(sessions.id, sessionId));
			expect(result).toHaveLength(0);
		});

		it('should cascade delete sessions when user is deleted', async () => {
			const sessionId = crypto.randomUUID();

			await testDb.insert(sessions).values({
				id: sessionId,
				userId: testUserId,
				expiresAt: new Date(Date.now() + 86400000),
				createdAt: new Date()
			});

			// Delete user
			await testDb.delete(users).where(eq(users.id, testUserId));

			// Session should be deleted too
			const sessionResult = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.id, sessionId));
			expect(sessionResult).toHaveLength(0);
		});
	});

	describe('AuthMock Integration', () => {
		it('should create authenticated user through AuthMock', async () => {
			const { user, session } = await createAuthenticatedUser('testuser', 'testpass123');

			expect(user).toBeDefined();
			expect(user.username).toBe('testuser');
			expect(session).toBeDefined();
			expect(session.userId).toBe(user.id);
		});

		it('should authenticate user through AuthMock', async () => {
			await authMock.createUser({
				username: 'testuser',
				password: 'testpass123'
			});

			const authenticatedUser = await authMock.authenticate('testuser', 'testpass123');
			expect(authenticatedUser).not.toBeNull();
			expect(authenticatedUser!.username).toBe('testuser');

			const failedAuth = await authMock.authenticate('testuser', 'wrongpass');
			expect(failedAuth).toBeNull();
		});

		it('should manage sessions through AuthMock', async () => {
			const user = await authMock.createUser({
				username: 'testuser',
				password: 'testpass123'
			});

			const session = authMock.createSession(user.id);
			expect(session).toBeDefined();
			expect(session.userId).toBe(user.id);

			const validation = authMock.validateSession(session.id);
			expect(validation).not.toBeNull();
			expect(validation!.user.id).toBe(user.id);
			expect(validation!.session.id).toBe(session.id);
		});

		it('should expire sessions correctly', async () => {
			const user = await authMock.createUser({
				username: 'testuser',
				password: 'testpass123'
			});

			// Create session that expires in 1ms
			const session = authMock.createSession(user.id, 1);

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 10));

			const validation = authMock.validateSession(session.id);
			expect(validation).toBeNull();
		});

		it('should delete sessions', async () => {
			const user = await authMock.createUser({
				username: 'testuser',
				password: 'testpass123'
			});

			const session = authMock.createSession(user.id);

			// Validate session exists
			let validation = authMock.validateSession(session.id);
			expect(validation).not.toBeNull();

			// Delete session
			authMock.deleteSession(session.id);

			// Validate session is gone
			validation = authMock.validateSession(session.id);
			expect(validation).toBeNull();
		});
	});

	describe('Authentication Edge Cases', () => {
		it('should handle duplicate username attempts', async () => {
			const username = 'duplicate';
			const hashedPassword = await bcrypt.hash('password', 10);

			await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username,
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Attempt to create duplicate user should fail
			await expect(
				testDb.insert(users).values({
					id: crypto.randomUUID(),
					username, // Same username
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should handle empty password', async () => {
			const result = await bcrypt.compare('', await bcrypt.hash('realpassword', 10));
			expect(result).toBe(false);
		});

		it('should handle very long passwords', async () => {
			const longPassword = 'a'.repeat(1000);
			const hashedPassword = await bcrypt.hash(longPassword, 10);
			const isValid = await bcrypt.compare(longPassword, hashedPassword);
			expect(isValid).toBe(true);
		});

		it('should handle special characters in username', async () => {
			const username = 'user@example.com';
			const hashedPassword = await bcrypt.hash('password', 10);

			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username,
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			expect(user.username).toBe(username);
		});

		it('should handle session cleanup for deleted users', async () => {
			const hashedPassword = await bcrypt.hash('password', 10);
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'tempuser',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const sessionId = crypto.randomUUID();
			await testDb.insert(sessions).values({
				id: sessionId,
				userId: user.id,
				expiresAt: new Date(Date.now() + 86400000),
				createdAt: new Date()
			});

			// Delete user (should cascade delete sessions)
			await testDb.delete(users).where(eq(users.id, user.id));

			// Verify session is gone
			const sessionResult = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, user.id));
			expect(sessionResult).toHaveLength(0);
		});
	});

	describe('Security Considerations', () => {
		it('should hash passwords with sufficient complexity', async () => {
			const password = 'testpassword';
			const hash = await bcrypt.hash(password, 10);

			// Hash should be significantly different from original
			expect(hash).not.toBe(password);
			expect(hash.length).toBeGreaterThan(50);
			expect(hash.startsWith('$2b$')).toBe(true);
		});

		it('should generate unique session IDs', async () => {
			const sessionIds = new Set();

			for (let i = 0; i < 100; i++) {
				const id = crypto.randomUUID();
				expect(sessionIds.has(id)).toBe(false);
				sessionIds.add(id);
			}
		});

		it('should handle concurrent sessions for same user', async () => {
			const hashedPassword = await bcrypt.hash('password', 10);
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'multiuser',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Create multiple sessions for same user
			const session1Id = crypto.randomUUID();
			const session2Id = crypto.randomUUID();

			await testDb.insert(sessions).values([
				{
					id: session1Id,
					userId: user.id,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				},
				{
					id: session2Id,
					userId: user.id,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				}
			]);

			const userSessions = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, user.id));
			expect(userSessions).toHaveLength(2);
		});
	});
});
