# Issue: SQLite Concurrency Limitations in Transaction Tests

## Problem

SQLite concurrency limitations are causing intermittent test failures in transaction isolation tests, preventing 100% CI success rate.

## Error Details

```
FAIL tests/integration/database/transactions.test.ts > Database Transactions > Transaction Isolation > should isolate concurrent transactions
LibsqlError: SQLITE_BUSY: database is locked

FAIL tests/integration/database/transactions.test.ts > Database Transactions > Batch Operations in Transactions > should efficiently handle bulk inserts in transaction
LibsqlError: SQLITE_BUSY: cannot commit transaction - SQL statements in progress
```

**Failing Tests:**
- Transaction isolation test (concurrent transactions)
- Bulk operations test (large transaction commits)

**Root Cause:**
SQLite has inherent limitations for concurrent transaction handling:
1. Database-level locking prevents true concurrent transactions
2. WAL mode limitations in test environments
3. Transaction timeouts under heavy load

## Current Status

- **Test Success Rate**: 352/354 tests passing (99.4%)
- **Issue Impact**: 2 tests failing intermittently
- **Severity**: Low - Does not affect core functionality

## Expected Behavior

- All transaction tests should pass consistently
- Concurrent transaction handling should work reliably
- No database locking errors during test execution

## Solution Requirements

1. **Database Architecture Review:**
   - Evaluate alternatives to SQLite for concurrent workloads
   - Consider connection pooling strategies
   - Implement retry mechanisms for locked database scenarios

2. **Test Strategy Updates:**
   - Implement proper transaction timeout handling
   - Add retry logic for concurrent transaction tests
   - Consider mocking concurrent scenarios instead of real parallelism

3. **Long-term Solutions:**
   - Evaluate PostgreSQL for production/testing
   - Implement proper connection management
   - Add database-specific test configurations

## Technical Details

**Affected Files:**
- `tests/integration/database/transactions.test.ts`
- `tests/integration/setup.ts`
- `vitest.config.ts`

**SQLite Limitations:**
- Single writer at a time
- WAL mode still has locking contention
- No true concurrent transaction support

**Priority:** Low - Not blocking deployment but affects test reliability

## Success Criteria

- [ ] All transaction tests pass consistently (100% success rate)
- [ ] No SQLITE_BUSY errors in CI
- [ ] Concurrent transaction scenarios work reliably
- [ ] Test execution time remains acceptable

## Potential Solutions

### Option 1: Test Strategy Changes
- Mock concurrent scenarios instead of real parallelism
- Add retry logic for database lock scenarios
- Implement proper test isolation

### Option 2: Database Technology
- Evaluate PostgreSQL for better concurrency
- Implement database-specific test configurations
- Use in-memory databases with better concurrency support

### Option 3: SQLite Optimization
- Fine-tune SQLite configuration for testing
- Implement connection pooling
- Add proper timeout and retry mechanisms

## Related Issues

- Part of database test architecture improvements (Issue #79)
- Discovered during migration test fixes (Issue #81)
- Related to overall CI/CD stability goals