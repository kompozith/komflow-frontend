# Purpose

Route coding agents to the reusable instruction set for this Angular workspace.

extends: .github/agents/base.md

## Loading Order

1. `.github/agents/base.md`
2. `.github/agents/coding.md` for implementation work
3. `.github/agents/testing.md` for tests and validation
4. `.github/agents/security.md` for auth, storage, HTTP, forms, and user-controlled data
5. `.github/agents/git.md` for commits, branches, and pull requests
6. `.github/agents/review.md` for reviews and final self-checks
7. `.agents/angular.md` for Angular-specific work
8. `.agents/architecture.md` for structure, extraction, and shared-code decisions
9. `.agents/skeleton-loaders.md` for async UI loading states
10. `.agents/business.md` for DeleevX terminology and business rules

## Rule

- Do not duplicate rules in adapter files; update the canonical topic file instead.
