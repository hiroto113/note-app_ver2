import type { User, Session } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';

/**
 * テスト用の認証モック
 */
export class AuthMock {
	private users: Map<string, User> = new Map();
	private sessions: Map<string, Session> = new Map();

	constructor() {
		// デフォルトのテストユーザーを作成
		this.createUser({
			id: 'test-user-1',
			username: 'testuser',
			password: 'testpass123'
		});

		this.createUser({
			id: 'test-admin-1',
			username: 'admin',
			password: 'admin123'
		});
	}

	/**
	 * テストユーザーを作成
	 */
	async createUser(data: { id?: string; username: string; password: string }): Promise<User> {
		const hashedPassword = await bcrypt.hash(data.password, 10);
		const user: User = {
			id: data.id || crypto.randomUUID(),
			username: data.username,
			hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.users.set(user.id, user);
		return user;
	}

	/**
	 * ユーザー認証
	 */
	async authenticate(username: string, password: string): Promise<User | null> {
		const user = Array.from(this.users.values()).find((u) => u.username === username);
		if (!user) return null;

		const isValid = await bcrypt.compare(password, user.hashedPassword);
		return isValid ? user : null;
	}

	/**
	 * セッションを作成
	 */
	createSession(userId: string, expiresIn: number = 86400000): Session {
		const session: Session = {
			id: crypto.randomUUID(),
			userId,
			expiresAt: new Date(Date.now() + expiresIn),
			createdAt: new Date()
		};

		this.sessions.set(session.id, session);
		return session;
	}

	/**
	 * セッションを検証
	 */
	validateSession(sessionId: string): { user: User; session: Session } | null {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		if (session.expiresAt < new Date()) {
			this.sessions.delete(sessionId);
			return null;
		}

		const user = this.users.get(session.userId);
		if (!user) return null;

		return { user, session };
	}

	/**
	 * セッションを削除
	 */
	deleteSession(sessionId: string): void {
		this.sessions.delete(sessionId);
	}

	/**
	 * 全データをクリア
	 */
	clear(): void {
		this.users.clear();
		this.sessions.clear();
	}
}

/**
 * グローバルなAuthMockインスタンス
 */
export const authMock = new AuthMock();

/**
 * テスト用の認証ヘルパー関数
 */
export async function createAuthenticatedUser(
	username: string = 'testuser',
	password: string = 'testpass123'
): Promise<{ user: User; session: Session }> {
	const user = await authMock.createUser({ username, password });
	const session = authMock.createSession(user.id);
	return { user, session };
}

/**
 * テスト用の認証ヘッダーを生成
 */
export function createAuthHeaders(sessionId: string): Record<string, string> {
	return {
		Cookie: `session=${sessionId}`,
		Authorization: `Bearer ${sessionId}`
	};
}

/**
 * リクエストモックを作成
 */
export function createMockRequest(options: {
	url?: string;
	method?: string;
	headers?: Record<string, string>;
	body?: any;
}): Request {
	const { url = 'http://localhost:5173', method = 'GET', headers = {}, body } = options;

	return new Request(url, {
		method,
		headers: new Headers(headers),
		body: body ? JSON.stringify(body) : undefined
	});
}
