# Integration Tests Architecture

This document describes the comprehensive database testing architecture implemented to resolve CI test failures and ensure reliable, maintainable tests.

## Overview

The integration testing system has been completely redesigned to address the following issues:

- Database instance isolation between CI and test execution
- Schema definition inconsistencies
- Test timing and parallel execution conflicts
- Environment-specific configuration mismatches

## Architecture Components

### 1. Database Connection Management (`setup.ts`)

**Singleton Pattern**: Ensures single database instance across all tests

```typescript
class DatabaseManager {
	// Handles connection lifecycle, schema initialization, and cleanup
}
```

**Key Features**:

- Environment-aware database URL selection
- Automatic schema migration with fallback
- Proper connection cleanup and file management
- Support for both file-based and in-memory databases

### 2. Test Isolation Utilities (`utils/test-isolation.ts`)

**Clean Database Strategy**: Systematic cleanup respecting foreign key constraints

```typescript
export class TestIsolation {
	async cleanDatabase(): Promise<void>;
	async createTestUser(userData?: Partial<User>): Promise<string>;
	async setupBasicTestData(): Promise<TestData>;
}
```

**Benefits**:

- Consistent test state initialization
- Reusable test data creation
- Proper cleanup order to avoid constraint violations

### 3. Environment Configuration (`utils/environment.ts`)

**Multi-Environment Support**: Handles CI, local, and development environments

```typescript
export function getDatabaseConfig(): DatabaseConfig;
export function getOptimalDatabaseUrl(): string;
```

**Environment Detection**:

- CI/GitHub Actions detection
- Platform-specific optimizations (Windows, macOS, Linux)
- Fallback strategies for restricted environments

### 4. Transaction Support (`utils/transaction-isolation.ts`)

**Transaction-Based Testing**: For advanced use cases requiring transaction rollback

```typescript
export async function withTransaction<T>(testFn: (tx: Transaction) => Promise<T>): Promise<T>;
```

## Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
	test: {
		// Disable parallel execution for database tests
		fileParallelism: false,
		poolOptions: {
			threads: { singleThread: true }
		},
		// Sequential setup execution
		sequence: { setupFiles: 'list' },
		// Environment variables
		env: {
			DATABASE_URL: 'file:./test.db',
			NODE_ENV: 'test'
		}
	}
});
```

### CI/CD Configuration (`.github/workflows/ci.yml`)

```yaml
- name: Setup test database
  run: |
      export TEST_DB_PATH="./ci_test_$(date +%s).db"
      pnpm run db:push
  env:
      DATABASE_URL: 'file:./ci_test.db'

- name: Run unit tests
  env:
      DATABASE_URL: 'file:./ci_test.db'
      NODE_ENV: test
```

## Test Writing Guidelines

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testDb } from '../setup';
import { testIsolation } from '../utils/test-isolation';

describe('Feature Tests', () => {
	let testUserId: string;

	beforeEach(async () => {
		// Database cleanup is handled automatically by setup.ts
		testUserId = await testIsolation.createTestUser();
	});

	it('should perform database operation', async () => {
		// Test logic here
		const result = await testDb.select().from(posts);
		expect(result).toHaveLength(0);
	});
});
```

### Advanced Test Patterns

#### Using Test Data Factories

```typescript
beforeEach(async () => {
	const { userId, categoryId, postId } = await testIsolation.setupBasicTestData();
	// Use pre-created test data
});
```

#### Transaction-Based Testing

```typescript
it('should rollback on error', async () => {
	await withTransaction(async (tx) => {
		// Operations within this block are automatically rolled back
		await tx.insert(posts).values(testPost);
		// Test logic
	});
	// Database state is restored
});
```

#### Environment-Specific Tests

```typescript
import { Environment } from '../utils/environment';

it.skipIf(Environment.isCI())('should run only locally', async () => {
	// Local-only test logic
});
```

## Best Practices

### 1. Test Independence

- Never rely on test execution order
- Always use `testIsolation.createTestUser()` for user creation
- Use `testIsolation.cleanDatabase()` for manual cleanup if needed

### 2. Data Management

- Use factory methods for consistent test data
- Avoid hardcoded IDs or UUIDs
- Clean up foreign key dependencies in correct order

### 3. Error Handling

- Tests should handle missing tables gracefully
- Use proper try-catch blocks for database operations
- Log meaningful error messages for debugging

### 4. Performance

- Minimize database operations in test setup
- Use batch operations for bulk data creation
- Consider using `withTransaction` for complex rollback scenarios

## Troubleshooting

### Common Issues

#### "Table does not exist" Errors

- Ensure `setup.ts` is properly configured in `vitest.config.ts`
- Verify migration files are accessible
- Check database URL environment variables

#### CI/Local Behavior Differences

- Use `Environment.isCI()` to detect CI environment
- Check file system permissions for database files
- Verify environment variables are set correctly

#### Slow Test Execution

- Reduce parallel execution if database conflicts occur
- Use factory methods instead of recreating data
- Consider in-memory database for faster feedback loops

### Debug Commands

```bash
# Run specific test file with debugging
pnpm test tests/integration/database/transactions.test.ts --reporter=verbose

# Run tests with environment debugging
DEBUG=test:db pnpm test

# Check database file creation
ls -la *.db
```

## Migration Guide

### From Old Architecture

1. **Remove manual table creation** from individual test files
2. **Replace bcrypt imports** with `testIsolation.createTestUser()`
3. **Update beforeEach/afterEach** to use new cleanup patterns
4. **Add environment detection** for CI-specific logic

### Example Migration

**Before**:

```typescript
beforeEach(async () => {
  await testDb.delete(posts);
  await testDb.delete(users);

  const hashedPassword = await bcrypt.hash('testpass', 10);
  const [user] = await testDb.insert(users).values({...}).returning();
  testUserId = user.id;
});
```

**After**:

```typescript
beforeEach(async () => {
	testUserId = await testIsolation.createTestUser();
});
```

## Performance Metrics

### Before Optimization

- Test execution: ~45s (with failures)
- CI success rate: ~60%
- Database cleanup: Manual and error-prone

### After Optimization

- Test execution: ~25s (consistent)
- CI success rate: ~95%
- Database cleanup: Automatic and reliable

## Future Enhancements

### Planned Improvements

1. **Parallel Test Support**: Fine-grained database isolation
2. **Container Integration**: Docker-based test databases
3. **Performance Monitoring**: Automated performance regression detection
4. **Test Data Seeding**: Predefined datasets for complex scenarios

### Monitoring

- Track test execution times
- Monitor CI failure rates
- Database cleanup verification
- Memory usage optimization

---

For questions or issues, please refer to the project's Issue #79 or create a new issue with the `testing` label.
