import type { Post, Category, User, Session } from '$lib/server/db/schema';
import type { TestDataSet } from './test-data';

/**
 * インメモリデータベースモック
 */
export class DatabaseMock {
	private data: {
		users: Map<string, User>;
		sessions: Map<string, Session>;
		posts: Map<number, Post>;
		categories: Map<number, Category>;
		postsToCategories: Map<string, { postId: number; categoryId: number }>;
	};

	constructor() {
		this.data = {
			users: new Map(),
			sessions: new Map(),
			posts: new Map(),
			categories: new Map(),
			postsToCategories: new Map()
		};
	}

	/**
	 * テストデータをロード
	 */
	loadTestData(testData: TestDataSet): void {
		// Clear existing data
		this.clear();

		// Load users
		testData.users.forEach((user) => {
			if (user.id) {
				this.data.users.set(user.id, user as User);
			}
		});

		// Load sessions
		testData.sessions.forEach((session) => {
			if (session.id) {
				this.data.sessions.set(session.id, session as Session);
			}
		});

		// Load categories
		testData.categories.forEach((category) => {
			if (category.id) {
				this.data.categories.set(category.id, category as Category);
			}
		});

		// Load posts
		testData.posts.forEach((post) => {
			if (post.id) {
				this.data.posts.set(post.id, post as Post);
			}
		});
	}

	/**
	 * ユーザー操作
	 */
	async getUser(id: string): Promise<User | null> {
		return this.data.users.get(id) || null;
	}

	async getUserByUsername(username: string): Promise<User | null> {
		return Array.from(this.data.users.values()).find((u) => u.username === username) || null;
	}

	async createUser(user: User): Promise<User> {
		this.data.users.set(user.id, user);
		return user;
	}

	/**
	 * セッション操作
	 */
	async getSession(id: string): Promise<Session | null> {
		return this.data.sessions.get(id) || null;
	}

	async createSession(session: Session): Promise<Session> {
		this.data.sessions.set(session.id, session);
		return session;
	}

	async deleteSession(id: string): Promise<void> {
		this.data.sessions.delete(id);
	}

	/**
	 * 記事操作
	 */
	async getPost(id: number): Promise<Post | null> {
		return this.data.posts.get(id) || null;
	}

	async getPostBySlug(slug: string): Promise<Post | null> {
		return Array.from(this.data.posts.values()).find((p) => p.slug === slug) || null;
	}

	async getPosts(options: {
		status?: 'published' | 'draft';
		limit?: number;
		offset?: number;
	} = {}): Promise<Post[]> {
		let posts = Array.from(this.data.posts.values());

		// Filter by status
		if (options.status) {
			posts = posts.filter((p) => p.status === options.status);
		}

		// Filter published posts by date
		if (options.status === 'published') {
			const now = new Date();
			posts = posts.filter((p) => p.publishedAt && p.publishedAt <= now);
		}

		// Sort by publishedAt desc
		posts.sort((a, b) => {
			const dateA = a.publishedAt || a.createdAt;
			const dateB = b.publishedAt || b.createdAt;
			return dateB.getTime() - dateA.getTime();
		});

		// Apply pagination
		if (options.offset !== undefined) {
			posts = posts.slice(options.offset);
		}
		if (options.limit !== undefined) {
			posts = posts.slice(0, options.limit);
		}

		return posts;
	}

	async createPost(post: Post): Promise<Post> {
		const id = post.id || this.generatePostId();
		const newPost = { ...post, id };
		this.data.posts.set(id, newPost);
		return newPost;
	}

	async updatePost(id: number, updates: Partial<Post>): Promise<Post | null> {
		const post = this.data.posts.get(id);
		if (!post) return null;

		const updatedPost = { ...post, ...updates, updatedAt: new Date() };
		this.data.posts.set(id, updatedPost);
		return updatedPost;
	}

	async deletePost(id: number): Promise<boolean> {
		// Delete post-category relationships
		Array.from(this.data.postsToCategories.keys()).forEach((key) => {
			const rel = this.data.postsToCategories.get(key)!;
			if (rel.postId === id) {
				this.data.postsToCategories.delete(key);
			}
		});

		return this.data.posts.delete(id);
	}

	/**
	 * カテゴリ操作
	 */
	async getCategory(id: number): Promise<Category | null> {
		return this.data.categories.get(id) || null;
	}

	async getCategoryBySlug(slug: string): Promise<Category | null> {
		return Array.from(this.data.categories.values()).find((c) => c.slug === slug) || null;
	}

	async getCategories(): Promise<Category[]> {
		return Array.from(this.data.categories.values()).sort((a, b) => 
			a.name.localeCompare(b.name)
		);
	}

	async createCategory(category: Category): Promise<Category> {
		const id = category.id || this.generateCategoryId();
		const newCategory = { ...category, id };
		this.data.categories.set(id, newCategory);
		return newCategory;
	}

	async updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
		const category = this.data.categories.get(id);
		if (!category) return null;

		const updatedCategory = { ...category, ...updates, updatedAt: new Date() };
		this.data.categories.set(id, updatedCategory);
		return updatedCategory;
	}

	async deleteCategory(id: number): Promise<boolean> {
		// Delete post-category relationships
		Array.from(this.data.postsToCategories.keys()).forEach((key) => {
			const rel = this.data.postsToCategories.get(key)!;
			if (rel.categoryId === id) {
				this.data.postsToCategories.delete(key);
			}
		});

		return this.data.categories.delete(id);
	}

	/**
	 * 記事とカテゴリの関連付け
	 */
	async addPostToCategory(postId: number, categoryId: number): Promise<void> {
		const key = `${postId}-${categoryId}`;
		this.data.postsToCategories.set(key, { postId, categoryId });
	}

	async removePostFromCategory(postId: number, categoryId: number): Promise<void> {
		const key = `${postId}-${categoryId}`;
		this.data.postsToCategories.delete(key);
	}

	async getPostCategories(postId: number): Promise<Category[]> {
		const categoryIds = Array.from(this.data.postsToCategories.values())
			.filter((rel) => rel.postId === postId)
			.map((rel) => rel.categoryId);

		return categoryIds
			.map((id) => this.data.categories.get(id))
			.filter((c): c is Category => c !== undefined);
	}

	async getCategoryPosts(categoryId: number): Promise<Post[]> {
		const postIds = Array.from(this.data.postsToCategories.values())
			.filter((rel) => rel.categoryId === categoryId)
			.map((rel) => rel.postId);

		return postIds
			.map((id) => this.data.posts.get(id))
			.filter((p): p is Post => p !== undefined);
	}

	/**
	 * ユーティリティメソッド
	 */
	private generatePostId(): number {
		const ids = Array.from(this.data.posts.keys());
		return ids.length > 0 ? Math.max(...ids) + 1 : 1;
	}

	private generateCategoryId(): number {
		const ids = Array.from(this.data.categories.keys());
		return ids.length > 0 ? Math.max(...ids) + 1 : 1;
	}

	/**
	 * 全データをクリア
	 */
	clear(): void {
		this.data.users.clear();
		this.data.sessions.clear();
		this.data.posts.clear();
		this.data.categories.clear();
		this.data.postsToCategories.clear();
	}

	/**
	 * 統計情報を取得
	 */
	getStats(): {
		users: number;
		sessions: number;
		posts: number;
		categories: number;
		relationships: number;
	} {
		return {
			users: this.data.users.size,
			sessions: this.data.sessions.size,
			posts: this.data.posts.size,
			categories: this.data.categories.size,
			relationships: this.data.postsToCategories.size
		};
	}
}

/**
 * グローバルなDatabaseMockインスタンス
 */
export const dbMock = new DatabaseMock();