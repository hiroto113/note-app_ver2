# Note App Development Instructions for Claude Code

## Project Overview

This is a blog/note-taking application built with SvelteKit, featuring a full admin panel for content management.

## Claude Code Usage

### Essential Commands

- `/help` - Get help with using Claude Code
- `/model` - Check or change the AI model
- `/memory` - Manage Claude's memory about this project
- `/clear` - Clear conversation history

### Working with Claude Code

1. **Always use absolute paths** - Claude Code requires absolute paths for all file operations
2. **Batch operations** - Use multiple tool calls in parallel for better performance
3. **Todo management** - Use TodoWrite/TodoRead tools to track tasks
4. **Verification first** - Always verify file existence before operations

## Project Structure

- `src/routes/` - SvelteKit routes
    - `(admin)/admin/` - Admin panel routes
        - `posts/` - Post management (list, create, edit, delete)
        - `categories/` - Category management
        - `settings/` - Site settings
- `src/lib/` - Shared components and utilities
    - `components/` - Reusable UI components
    - `server/` - Server-side utilities
        - `db/` - Database schema and connections
        - `api/` - API endpoints for CRUD operations
- `drizzle/` - Database migrations
- `doc/` - Documentation and design files
    - `designs/` - Phase-specific design documents
    - `issues/` - Phase-specific issue definitions
    - `templates/` - Document templates
- `.github/` - GitHub-related configurations
    - `ISSUE_TEMPLATE/` - Issue templates
    - `pull_request_template.md` - PR template

## Documentation Structure

### Core Documents

- **CLAUDE.md** (This file) - Claude Code specific instructions and project overview
- **doc/design.md** - System architecture and design specifications
- **doc/development.md** - Development process and workflow guidelines
- **doc/assistant_development_rules.md** - AI assistant collaboration rules
- **doc/ai_development_guide.md** - General guide for AI-assisted development

### Phase-specific Documents

- **doc/designs/phase-N/** - Detailed design documents for each development phase
    - Must follow the template in `doc/templates/design_template.md`
    - Created before implementation starts
- **doc/issues/phase-N/** - Issue definitions for each phase
    - Created after design approval
    - Used as source for GitHub Issue creation

### GitHub Templates

- **.github/ISSUE_TEMPLATE/**
    - `feature.md` - Feature request template
    - `bug.md` - Bug report template
    - `docs.md` - Documentation update template
- **.github/pull_request_template.md** - PR template

### Document Management Rules

1. **Hierarchy**: CLAUDE.md is the primary reference for Claude Code usage
2. **Updates**: Design changes must be reflected in both design.md and CLAUDE.md
3. **Phase Documentation**: Each phase requires design docs before implementation
4. **Issue Flow**: Design → Issue definition files → GitHub Issues
5. **Format**: All documentation in Markdown format

## Development Commands

- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server (http://localhost:5173)
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run migrate` - Run database migrations
- `pnpm run seed` - Seed database with sample data
- `pnpm run check` - Run SvelteKit sync and type checking

## Database

- SQLite database with Drizzle ORM
- Schema defined in `src/lib/server/db/schema.ts`
- Database file: `sqlite.db`
- Tables:
    - `posts` - Blog post content and metadata
    - `categories` - Post categories
    - `users` - User accounts
    - `sessions` - User sessions

## Authentication

- Session-based authentication with Auth.js
- Login route: `/login`
- Admin area: `/admin/*` (protected)
- All admin routes require authentication

## Content Management System

- **Admin Panel Features:**
    - Create new posts with rich text editor
    - Edit existing posts with live preview
    - Delete posts with confirmation
    - Category management (CRUD)
    - Media upload and management
    - SEO metadata editing
    - Publish/draft status control
- **Post Management Flow:**
    1. Login to admin panel at `/admin`
    2. Navigate to Posts section
    3. Create/Edit/Delete posts through UI
    4. Changes are saved to database immediately
    5. Public posts appear on frontend instantly

## Key Technologies

- SvelteKit (frontend/backend)
- TypeScript
- Tailwind CSS
- Drizzle ORM
- SQLite
- Auth.js (authentication)
- Rich text editor (for admin panel)
- Vercel (deployment)

## Development Workflow with Claude Code

### Before Starting Development

1. Use `Bash` tool to check current directory: `pwd`
2. Read relevant files with `Read` tool before editing
3. Use `Glob` or `Grep` for file searches
4. Create todo list with `TodoWrite` for complex tasks

### During Development

1. Use `Edit` or `MultiEdit` for file modifications (not `Write` unless creating new)
2. Run tests after changes: `pnpm run check`
3. Update todo status as you progress
4. Use `Bash` for all command executions

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation branches

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test related changes
- `chore:` - Build/tool changes

## System Construction Flow (MUST FOLLOW)

1. Overall design → Phase decomposition → Phase detailed design
2. Issue decomposition → GitHub Issue creation → Implementation
3. Quality checks → Phase completion confirmation
4. All designs must be documented in `/doc/designs/phase-N/`
5. Issues must be defined in `/doc/issues/phase-N/` before GitHub creation

## Development Phases

- Phase 1-2: Foundation and core features ✓
- Phase 3: Database and authentication setup (current)
- Phase 4: Admin UI implementation
    - Post CRUD interface
    - Category management
    - Rich text editor integration
- Phase 5: Backend API development
    - RESTful endpoints for posts
    - Category APIs
    - Media upload handling
- Phase 6-8: UI/UX, SEO, monitoring

## Admin Panel Requirements

- **Post Editor:**
    - Rich text editing capabilities
    - Image upload and management
    - SEO fields (title, description, keywords)
    - Slug generation and editing
    - Publish date scheduling
    - Draft/Published status

- **UI Components Needed:**
    - Data tables for post listing
    - Form components for editing
    - Modal dialogs for confirmations
    - Toast notifications for actions
    - File upload components

## Security & Performance Requirements

- CSP configuration required
- XSS protection in rich text content
- CORS settings configuration
- Input validation on all forms
- File upload restrictions (type, size)
- Target Lighthouse scores: 90+ for all metrics
- Error handling at application and component levels

## Claude Code Development Rules (CRITICAL)

### Core Principles

1. **Do what has been asked; nothing more, nothing less**
2. **Use absolute paths ALWAYS** - Never use relative paths
3. **Verify before action** - Check file existence with Read/LS before editing
4. **Batch operations** - Use parallel tool calls for efficiency

### File Operations Best Practices

- **NEVER use Write tool on existing files** - Use Edit/MultiEdit instead
- **ALWAYS read files first** - Use Read tool before any modifications
- **Prefer MultiEdit** - When making multiple changes to same file
- **Use Glob/Grep for searches** - Don't use find or grep commands in Bash

### Command Execution

- **Use Bash tool** - For all command line operations
- **Avoid interactive commands** - No `-i` flags (git rebase -i, etc.)
- **Chain commands carefully** - Use `&&` or `;` for multiple commands
- **Always show working directory** - Include `pwd` when relevant

### Verification Requirements

- Run `pnpm run check` after code changes
- Verify build succeeds before marking tasks complete
- Test functionality after implementation
- Check for TypeScript errors

### Working with Todos

- Create todos for multi-step tasks (3+ steps)
- Update status immediately when starting/completing
- Only one task `in_progress` at a time
- Mark completed only when fully done

## API Endpoints (To Be Implemented)

- `GET /api/posts` - List all posts
- `GET /api/posts/[id]` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

## Documentation Management

- All design changes MUST be reflected in `design.md`
- Keep CLAUDE.md updated with project-specific instructions
- Document new patterns and conventions as established
- Use markdown for all documentation

## Important Notes

- Always run type checking before committing
- Test database migrations locally before applying
- Ensure proper authentication for admin routes
- Follow existing code patterns and conventions
- Verify environment separation (dev/staging/production)
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- Use descriptive commit messages following convention
- Keep todo list updated throughout development
- Sanitize all user input, especially rich text content
- Implement proper error boundaries in admin panel
