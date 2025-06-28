#!/bin/bash

# Script to create GitHub labels for note-app_ver2 repository
# Make sure you're authenticated with gh CLI before running this script

echo "Creating GitHub labels for note-app_ver2..."

# Type labels
gh label create "type:feature" --color "0366d6" --description "New feature or enhancement"
gh label create "type:bug" --color "d73a4a" --description "Something isn't working"
gh label create "type:docs" --color "0075ca" --description "Documentation improvements"

# Scope labels
gh label create "scope:frontend" --color "6f42c1" --description "Frontend related changes"
gh label create "scope:backend" --color "f97316" --description "Backend related changes"

# Priority labels
gh label create "priority:high" --color "b60205" --description "High priority issue"
gh label create "priority:medium" --color "fbca04" --description "Medium priority issue"
gh label create "priority:low" --color "0e8a16" --description "Low priority issue"

# Phase labels
gh label create "phase:1" --color "808080" --description "Phase 1: Project foundation"
gh label create "phase:2" --color "808080" --description "Phase 2: Core features"
gh label create "phase:3" --color "808080" --description "Phase 3: Database and authentication"
gh label create "phase:4" --color "808080" --description "Phase 4: Admin UI implementation"
gh label create "phase:5" --color "808080" --description "Phase 5: Backend API development"
gh label create "phase:6" --color "808080" --description "Phase 6: UI/UX enhancements"
gh label create "phase:7" --color "808080" --description "Phase 7: SEO optimization"
gh label create "phase:8" --color "808080" --description "Phase 8: Monitoring and analytics"

# Status labels
gh label create "status:done" --color "0e8a16" --description "Task completed"

echo "All labels created successfully!"