# Issue: Database Migration Test Failures - Index and Unique Constraints

## Problem

Database migration tests are failing due to missing indexes and unique constraints in the schema, despite the database tables being created successfully.

## Error Details

```
FAIL tests/integration/database/migrations.test.ts > Database Migrations > Index Verification > should have indexes on posts_to_categories junction table
AssertionError: expected false to be true

FAIL tests/integration/database/migrations.test.ts > Database Migrations > Constraint Verification > should have unique constraints
AssertionError: expected 'CREATE TABLE `posts` ...' to contain 'UNIQUE'
```

**Failing Tests:**

- Index verification on `posts_to_categories` table (2 tests)
- Unique constraint verification on `posts` table slug column (2 tests)

**Root Cause:**
The current database schema is missing:

1. Indexes on the `posts_to_categories` junction table
2. UNIQUE constraint on the `posts.slug` column

## Expected Behavior

- Database schema should include proper indexes for query performance
- `posts.slug` should have a UNIQUE constraint to prevent duplicate slugs
- Migration tests should pass with all expected constraints and indexes

## Solution Requirements

1. **Schema Updates:**
    - Add indexes to `posts_to_categories` table for `post_id` and `category_id`
    - Add UNIQUE constraint to `posts.slug` column
    - Review and add any other missing constraints

2. **Migration Files:**
    - Create new migration to add missing indexes and constraints
    - Ensure migrations are idempotent and safe to run

3. **Test Validation:**
    - Verify all migration tests pass after schema updates
    - Ensure no performance regression from new indexes

## Technical Details

**Affected Files:**

- `src/lib/server/db/schema.ts`
- `drizzle/` migration files
- `tests/integration/database/migrations.test.ts`

**Test Failures:** 4 out of 354 tests (1.1% failure rate)

**Priority:** Medium - Not blocking core functionality but affects data integrity

## Success Criteria

- [ ] All database migration tests pass
- [ ] `posts_to_categories` table has proper indexes
- [ ] `posts.slug` column has UNIQUE constraint
- [ ] No regression in existing functionality
- [ ] Migration can be safely applied to existing databases

## Related Issues

- Discovered during resolution of Issue #78 (Database table schema issues)
- Part of the database test architecture overhaul (Issue #79)
