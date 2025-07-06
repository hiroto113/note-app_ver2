import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Users and Sessions Database Integration', () => {
	beforeEach(async () => {
		// Clean up database
		await testDb.delete(sessions);
		await testDb.delete(users);
	});

	afterEach(async () => {
		// Clean up
		await testDb.delete(sessions);
		await testDb.delete(users);
	});

	describe('User CRUD Operations', () => {
		it('should create a new user', async () => {
			const hashedPassword = await bcrypt.hash('testpass123', 10);
			const userData = {
				id: crypto.randomUUID(),
				username: 'testuser',
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const [user] = await testDb.insert(users).values(userData).returning();

			expect(user).toBeDefined();
			expect(user.id).toBe(userData.id);
			expect(user.username).toBe(userData.username);
			expect(user.hashedPassword).toBe(hashedPassword);
		});

		it('should read a user by id', async () => {
			const userId = crypto.randomUUID();
			const hashedPassword = await bcrypt.hash('testpass123', 10);

			const [created] = await testDb
				.insert(users)
				.values({
					id: userId,
					username: 'testuser',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [found] = await testDb.select().from(users).where(eq(users.id, created.id));

			expect(found).toBeDefined();
			expect(found.id).toBe(userId);
			expect(found.username).toBe('testuser');
		});

		it('should update a user', async () => {
			const hashedPassword = await bcrypt.hash('oldpass', 10);
			const [created] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'oldusername',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const newHashedPassword = await bcrypt.hash('newpass', 10);
			const newUsername = 'newusername';

			await testDb
				.update(users)
				.set({
					username: newUsername,
					hashedPassword: newHashedPassword,
					updatedAt: new Date()
				})
				.where(eq(users.id, created.id));

			const [updated] = await testDb.select().from(users).where(eq(users.id, created.id));

			expect(updated.username).toBe(newUsername);
			expect(updated.hashedPassword).toBe(newHashedPassword);
			// Updated timestamp should be equal or greater than created timestamp
			expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(updated.createdAt.getTime());
		});

		it('should delete a user', async () => {
			const [created] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'todelete',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			await testDb.delete(users).where(eq(users.id, created.id));

			const found = await testDb.select().from(users).where(eq(users.id, created.id));
			expect(found).toHaveLength(0);
		});
	});

	describe('Session Management', () => {
		let testUserId: string;

		beforeEach(async () => {
			// Create test user
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'sessionuser',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();
			testUserId = user.id;
		});

		it('should create a session', async () => {
			const sessionData = {
				id: crypto.randomUUID(),
				userId: testUserId,
				expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
				createdAt: new Date()
			};

			const [session] = await testDb.insert(sessions).values(sessionData).returning();

			expect(session).toBeDefined();
			expect(session.id).toBe(sessionData.id);
			expect(session.userId).toBe(testUserId);
			expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
		});

		it('should retrieve active sessions for a user', async () => {
			const now = new Date();
			const future = new Date(Date.now() + 86400000);
			const past = new Date(Date.now() - 86400000);

			// Create multiple sessions
			await testDb.insert(sessions).values([
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: future, // Active
					createdAt: now
				},
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: past, // Expired
					createdAt: new Date(Date.now() - 172800000)
				},
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: future, // Active
					createdAt: now
				}
			]);

			// Get active sessions
			const activeSessions = await testDb
				.select()
				.from(sessions)
				.where(and(eq(sessions.userId, testUserId), gt(sessions.expiresAt, now)));

			expect(activeSessions).toHaveLength(2);
			expect(activeSessions.every((s) => s.expiresAt > now)).toBe(true);
		});

		it('should update session expiry', async () => {
			const [session] = await testDb
				.insert(sessions)
				.values({
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: new Date(Date.now() + 3600000), // 1 hour
					createdAt: new Date()
				})
				.returning();

			const newExpiry = new Date(Date.now() + 86400000); // 24 hours

			await testDb
				.update(sessions)
				.set({ expiresAt: newExpiry })
				.where(eq(sessions.id, session.id));

			const [updated] = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.id, session.id));

			// Allow for small timestamp differences due to precision
			const timeDiff = Math.abs(updated.expiresAt.getTime() - newExpiry.getTime());
			expect(timeDiff).toBeLessThan(1000); // Within 1 second
		});

		it('should delete expired sessions', async () => {
			const now = new Date();
			const past = new Date(Date.now() - 86400000);
			const future = new Date(Date.now() + 86400000);

			// Create mixed sessions
			await testDb.insert(sessions).values([
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: past, // Expired
					createdAt: new Date(Date.now() - 172800000)
				},
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: future, // Active
					createdAt: now
				}
			]);

			// Delete expired sessions - sessions where expiresAt is less than now
			await testDb.delete(sessions).where(lt(sessions.expiresAt, now));

			const remainingSessions = await testDb.select().from(sessions);
			expect(remainingSessions).toHaveLength(1);
			expect(remainingSessions[0].expiresAt > now).toBe(true);
		});

		it('should cascade delete sessions when user is deleted', async () => {
			// Create sessions for the user
			await testDb.insert(sessions).values([
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				},
				{
					id: crypto.randomUUID(),
					userId: testUserId,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				}
			]);

			// Verify sessions exist
			const sessionsBefore = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, testUserId));
			expect(sessionsBefore).toHaveLength(2);

			// Delete user
			await testDb.delete(users).where(eq(users.id, testUserId));

			// Verify sessions are also deleted
			const sessionsAfter = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, testUserId));
			expect(sessionsAfter).toHaveLength(0);
		});
	});

	describe('Data Integrity', () => {
		it('should enforce unique usernames', async () => {
			const username = 'uniqueuser';
			const hashedPassword = await bcrypt.hash('pass', 10);

			await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username,
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Attempt to insert duplicate username should fail
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

		it('should not allow null username', async () => {
			const hashedPassword = await bcrypt.hash('pass', 10);

			await expect(
				testDb.insert(users).values({
					id: crypto.randomUUID(),
					username: null as any, // Force null
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should enforce foreign key constraint on sessions', async () => {
			const nonExistentUserId = crypto.randomUUID();

			// Attempt to create session with non-existent user
			await expect(
				testDb.insert(sessions).values({
					id: crypto.randomUUID(),
					userId: nonExistentUserId,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				})
			).rejects.toThrow();
		});

		it('should enforce unique session IDs', async () => {
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'testuser',
					hashedPassword: await bcrypt.hash('pass', 10),
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

			// Attempt to insert duplicate session ID should fail
			await expect(
				testDb.insert(sessions).values({
					id: sessionId, // Same ID
					userId: user.id,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				})
			).rejects.toThrow();
		});
	});

	describe('Query Patterns', () => {
		it('should find user by username', async () => {
			const username = 'findme';
			const hashedPassword = await bcrypt.hash('pass', 10);

			await testDb.insert(users).values({
				id: crypto.randomUUID(),
				username,
				hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const [found] = await testDb.select().from(users).where(eq(users.username, username));

			expect(found).toBeDefined();
			expect(found.username).toBe(username);
		});

		it('should list users with active sessions', async () => {
			const now = new Date();
			const future = new Date(Date.now() + 86400000);

			// Create users
			const [user1] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'user1',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const [user2] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'user2',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Create active session for user1 only
			await testDb.insert(sessions).values({
				id: crypto.randomUUID(),
				userId: user1.id,
				expiresAt: future,
				createdAt: now
			});

			// Query users with active sessions
			const usersWithSessions = await testDb
				.selectDistinct({
					user: users,
					sessionCount: sessions.id
				})
				.from(users)
				.innerJoin(sessions, eq(users.id, sessions.userId))
				.where(gt(sessions.expiresAt, now));

			expect(usersWithSessions).toHaveLength(1);
			expect(usersWithSessions[0].user.id).toBe(user1.id);
		});

		it('should count sessions per user', async () => {
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'multiuser',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Create multiple sessions
			const sessionCount = 3;
			for (let i = 0; i < sessionCount; i++) {
				await testDb.insert(sessions).values({
					id: crypto.randomUUID(),
					userId: user.id,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				});
			}

			const userSessions = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, user.id));

			expect(userSessions).toHaveLength(sessionCount);
		});
	});

	describe('Security Considerations', () => {
		it('should never expose plain text passwords', async () => {
			const plainPassword = 'mysecretpass';
			const hashedPassword = await bcrypt.hash(plainPassword, 10);

			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'secureuser',
					hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Verify hash is stored, not plain text
			expect(user.hashedPassword).not.toBe(plainPassword);
			expect(user.hashedPassword).toBe(hashedPassword);

			// Verify bcrypt can validate the password
			const isValid = await bcrypt.compare(plainPassword, user.hashedPassword);
			expect(isValid).toBe(true);
		});

		it('should handle concurrent session creation', async () => {
			const [user] = await testDb
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					username: 'concurrent',
					hashedPassword: await bcrypt.hash('pass', 10),
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Create multiple sessions concurrently
			const sessionPromises = Array.from({ length: 5 }, () =>
				testDb.insert(sessions).values({
					id: crypto.randomUUID(),
					userId: user.id,
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date()
				})
			);

			await expect(Promise.all(sessionPromises)).resolves.not.toThrow();

			const userSessions = await testDb
				.select()
				.from(sessions)
				.where(eq(sessions.userId, user.id));

			expect(userSessions).toHaveLength(5);
		});
	});
});
