# Documentation Guidelines

## Overview

This document outlines the guidelines for maintaining documentation in the Service Marketplace project. Proper documentation ensures that all team members have a clear understanding of the project's progress, implemented features, and future plans.

## Documentation Structure

The documentation for the Service Marketplace project is centralized in the `rules` folder and consists of the following key files:

1. **Project Outline** - High-level description of the project's goals, requirements, and architecture.
2. **Project Checklist** - Detailed breakdown of tasks with implementation status.
3. **CHANGELOG.md** - Record of all notable changes to the project, organized by version.
4. **IMPLEMENTATION_NOTES.md** - Current status of implemented features and any discrepancies between documentation and actual implementation.
5. **README.md** - General project information and setup instructions.

## Documentation Update Process

### When to Update Documentation

Documentation should be updated in the following scenarios:

1. **New Feature Implementation** - When a new feature is implemented, update both the CHANGELOG.md and Project Checklist.
2. **Bug Fixes** - Document significant bug fixes in the CHANGELOG.md.
3. **Architecture Changes** - Record any changes to the project architecture or design decisions.
4. **Implementation Status Changes** - Update the IMPLEMENTATION_NOTES.md whenever the status of a feature changes.

### How to Update Documentation

#### Updating CHANGELOG.md

1. Add new entries under the appropriate section (Added, Changed, Fixed, Removed).
2. Group related changes under a single feature description.
3. Use clear, concise language to describe each change.
4. Include all significant changes, no matter how small.

Example:
```markdown
### Added
- Review System with full Firebase integration
  - Added `ReviewForm` component for creating and editing reviews
  - Created `ReviewItem` component for displaying reviews
```

#### Updating IMPLEMENTATION_NOTES.md

1. Update the status of features (✅ for complete, ❌ for pending, ✓ for recently completed).
2. Document any discrepancies between planned and actual implementation.
3. Maintain the "Next Implementation Priorities" section.

#### Updating Project Checklist

1. Mark completed tasks with [x].
2. Add details about implementation under relevant tasks.
3. Add new tasks if they emerge during development.

## Consistency Guidelines

1. **Single Source of Truth** - All documentation should be in the `rules` folder.
2. **No Duplicate Documentation** - Avoid maintaining separate changelogs or implementation notes in different locations.
3. **Regular Updates** - Update documentation as part of the development process, not as an afterthought.
4. **Cross-References** - Reference related documents where appropriate (e.g., "See Project Checklist for detailed implementation status").

## Final Notes

Maintaining up-to-date documentation is crucial for project success. It helps onboard new team members, track progress, and ensure all stakeholders have a clear understanding of the project's current state.

Remember: **Good code tells you how; good documentation tells you why.** 