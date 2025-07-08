# Test Data Factory Migration Guide

2025 Best Practice: Migrating from manual test data creation to TypeScript-first factories

## Overview

This guide helps migrate existing tests from manual data creation patterns to the new factory-based approach using Fishery.

## Benefits of the New System

- **Type Safety**: Full TypeScript support with schema validation
- **Consistency**: Standardized test data across all tests
- **Maintainability**: Single source of truth for test data patterns
- **Productivity**: Faster test writing with pre-built scenarios
- **Realism**: Realistic test data that matches production patterns

## Migration Examples

### 1. User Creation

#### Before (Manual)

```typescript
// Old way - verbose and error-prone
const userData = {
	id: 'test-user-1',
	username: 'testuser',
	hashedPassword: await bcrypt.hash('password', 10),
	createdAt: new Date(),
	updatedAt: new Date()
};
const [user] = await db.insert(users).values(userData).returning();
```

#### After (Factory)

```typescript
// New way - clean and consistent
const user = await fixtures.createUser({ username: 'testuser' });
// Or for multiple users:
const users = await fixtures.createUsers(5);
```

### 2. Post with Categories

#### Before (Manual)

```typescript
// Old way - complex relationship setup
const user = await createUser();
const category = await createCategory();
const postData = {
	title: 'Test Post',
	slug: 'test-post',
	content: 'Test content...',
	excerpt: 'Test excerpt',
	status: 'published',
	userId: user.id,
	createdAt: new Date(),
	updatedAt: new Date(),
	publishedAt: new Date()
};
const [post] = await db.insert(posts).values(postData).returning();
await db.insert(postsToCategories).values({
	postId: post.id,
	categoryId: category.id
});
```

#### After (Factory)

```typescript
// New way - relationships handled automatically
const admin = await fixtures.createAdminUser();
const { tech } = await fixtures.createDefaultCategories();
const { post } = await fixtures.createPostWithCategories(
	{ title: 'Test Post', status: 'published' },
	[tech.id],
	admin.id
);
```

### 3. Quality Metrics

#### Before (Manual)

```typescript
// Old way - hardcoded values
const metricsData = {
	id: randomUUID(),
	timestamp: new Date(),
	commitHash: 'abc123',
	branch: 'main',
	lighthousePerformance: 85,
	lighthouseAccessibility: 92,
	testUnitTotal: 100,
	testUnitPassed: 95,
	testUnitCoverage: 8500, // 85%
	createdAt: new Date()
};
const [metrics] = await db.insert(qualityMetrics).values(metricsData).returning();
```

#### After (Factory)

```typescript
// New way - realistic random values
const metrics = await fixtures.createQualityMetrics();
// Or for high-quality metrics:
const highMetrics = await fixtures.createHighQualityMetrics();
// Or for trend analysis:
const trend = await fixtures.createQualityMetricsTrend(5);
```

## Common Migration Patterns

### 1. Basic Entity Creation

```typescript
// Before
const categoryData = {
	name: 'Technology',
	slug: 'technology',
	description: 'Tech posts',
	createdAt: new Date(),
	updatedAt: new Date()
};
const [category] = await db.insert(categories).values(categoryData).returning();

// After
const category = await fixtures.createCategory({
	name: 'Technology',
	slug: 'technology',
	description: 'Tech posts'
});
```

### 2. Test Scenarios

```typescript
// Before - manual setup for each test
beforeEach(async () => {
	const admin = await createUser({ username: 'admin' });
	const tech = await createCategory({ name: 'Technology' });
	const post = await createPost({ userId: admin.id });
	// ... more setup
});

// After - predefined scenarios
beforeEach(async () => {
	const setup = await testScenarios.full(fixtures);
	// Everything is ready: admin, categories, posts
});
```

### 3. Realistic Content

```typescript
// Before - simple placeholder content
const post = await createPost({
	title: 'Test Post',
	content: 'Test content',
	excerpt: 'Test excerpt'
});

// After - realistic blog content
const techPost = await fixtures.createTechPost();
// Contains realistic markdown content about web development
```

## Test Utility Functions

### Date Handling

```typescript
// Before
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// After
const yesterday = testUtils.testDate.daysAgo(1);
const nextWeek = testUtils.testDate.daysFromNow(7);
```

### Content Generation

```typescript
// Before
const title = `Test Post ${Math.random()}`;
const slug = title.toLowerCase().replace(/\s+/g, '-');

// After
const title = testUtils.content.title('Blog');
const slug = testUtils.content.slug(title);
```

## Migration Checklist

### Phase 1: Setup

- [ ] Install new test utilities: `import { fixtures, testScenarios } from '../../src/lib/test-utils'`
- [ ] Create fixtures instance: `const fixtures = createTestFixtures(getTestDb())`

### Phase 2: Replace Manual Creation

- [ ] Replace manual user creation with `fixtures.createUser()`
- [ ] Replace manual category creation with `fixtures.createCategory()`
- [ ] Replace manual post creation with `fixtures.createPost()`
- [ ] Replace manual quality metrics with `fixtures.createQualityMetrics()`

### Phase 3: Use Scenarios

- [ ] Replace complex setup with `testScenarios.minimal(fixtures)`
- [ ] Use `testScenarios.full(fixtures)` for comprehensive tests
- [ ] Use `testScenarios.qualityMetrics(fixtures)` for dashboard tests

### Phase 4: Leverage Utilities

- [ ] Replace manual date creation with `testUtils.testDate.*`
- [ ] Replace manual content with `testUtils.content.*`
- [ ] Use `testUtils.assert.*` for common assertions

## Performance Benefits

### Before: Individual Database Calls

```typescript
// Multiple separate database operations
const user = await createUser();
const category1 = await createCategory();
const category2 = await createCategory();
const post1 = await createPost({ userId: user.id });
const post2 = await createPost({ userId: user.id });
// Link posts to categories...
```

### After: Optimized Batch Operations

```typescript
// Single optimized call
const setup = await fixtures.createBlogSetup();
// Contains admin, categories, and posts with relationships
```

## Common Gotchas

### 1. Foreign Key Relationships

```typescript
// ❌ Don't: Manual ID management
const user = await fixtures.createUser();
const post = await fixtures.createPost({ userId: user.id });

// ✅ Do: Let fixtures handle relationships
const post = await fixtures.createPost({}, userId); // Pass as parameter
```

### 2. Test Data Isolation

```typescript
// ❌ Don't: Reuse data across tests
let sharedUser;
beforeAll(async () => {
	sharedUser = await fixtures.createUser();
});

// ✅ Do: Fresh data for each test
beforeEach(async () => {
	const user = await fixtures.createUser();
});
```

### 3. Cleanup

```typescript
// ❌ Don't: Manual cleanup
afterEach(async () => {
	await db.delete(posts);
	await db.delete(categories);
	await db.delete(users);
});

// ✅ Do: Use fixtures cleanup
afterEach(async () => {
	await fixtures.cleanAll();
});
```

## Examples in Practice

### API Integration Test

```typescript
// Before
describe('Posts API', () => {
	let testUser, testCategory, testPost;

	beforeEach(async () => {
		testUser = await createUser({ username: 'test' });
		testCategory = await createCategory({ name: 'Test' });
		testPost = await createPost({
			userId: testUser.id,
			title: 'Test Post'
		});
		// Link post to category...
	});

	it('should get posts', async () => {
		const response = await GET('/api/posts');
		expect(response.data).toContain(testPost);
	});
});

// After
describe('Posts API', () => {
	beforeEach(async () => {
		await testScenarios.full(fixtures);
	});

	it('should get posts', async () => {
		const response = await GET('/api/posts');
		expect(response.data).toBeDefined();
		expect(response.data.length).toBeGreaterThan(0);
	});
});
```

### Dashboard Test

```typescript
// Before - complex manual setup
describe('Quality Dashboard', () => {
	beforeEach(async () => {
		// Create multiple metrics manually...
		for (let i = 0; i < 5; i++) {
			await createQualityMetrics({
				lighthousePerformance: 80 + i,
				timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
			});
		}
	});
});

// After - scenario-based
describe('Quality Dashboard', () => {
	beforeEach(async () => {
		await testScenarios.qualityMetrics(fixtures);
	});
});
```

## Next Steps

1. Start with new tests using the factory system
2. Gradually migrate existing tests during maintenance
3. Update test documentation to reference factory patterns
4. Train team members on new testing patterns

## Resources

- Factory definitions: `src/lib/test-utils/factories.ts`
- Fixtures system: `src/lib/test-utils/fixtures.ts`
- Usage examples: `tests/integration/test-data/example-usage.test.ts`
- Factory tests: `tests/integration/test-data/factories.test.ts`
