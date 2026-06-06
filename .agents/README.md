# Purpose

Explain how to use and extend the reusable agent instruction setup in this repository.

extends: ../.github/agents/base.md

## File Map

- `.github/agents/base.md`: universal rules for all agent work.
- `.github/agents/coding.md`: implementation style, type safety, duplication, and formatting.
- `.github/agents/testing.md`: test strategy, test placement, and validation reporting.
- `.github/agents/git.md`: commit, branch, and pull request rules.
- `.github/agents/review.md`: review order, severity, and output format.
- `.github/agents/security.md`: input validation, secrets, storage, HTTP, auth, and dependency rules.
- `.agents/angular.md`: Angular-specific rules.
- `.agents/architecture.md`: project structure and dependency direction.
- `.agents/skeleton-loaders.md`: DeleevX async loading UX and skeleton loader rules.
- `.agents/business.md`: DeleevX terminology, i18n, and business-rule boundaries.

## Loading Order

1. Load `.github/agents/base.md`.
2. Load the topic file that matches the task: coding, testing, git, review, or security.
3. Load `.agents/angular.md` for Angular work.
4. Load `.agents/architecture.md` for structure, extraction, or shared-code decisions.
5. Load `.agents/skeleton-loaders.md` for async UI loading states.
6. Load `.agents/business.md` for product terminology or business workflow changes.

## Extension Rules

- Add a new file only when the responsibility is not covered by an existing file.
- Do not duplicate rules from another file; reference the source file in an `extends:` line.
- Keep each file focused on one responsibility.
- Mark project-specific decisions as `[TO DEFINE]` until the adopting project defines them.
- Keep business terminology and product workflows outside reusable agent files.
- Keep project-specific business and UX policy in `.agents/` files that extend the reusable base.

## Audit Summary

- Removed duplicated Angular syntax, SCSS token, i18n, skeleton, refactor, and review pipeline rules from old tool-specific files.
- Moved business-specific glossary, product actors, currency, feature names, and skeleton policy out of reusable rules and into project layers.
- Replaced project-bound agent files with project-agnostic Angular and architecture guidance.
- Preserved inferred rules for Angular 20, standalone components, signals, runtime configuration, design tokens, i18n parity, skeleton loading states, Conventional Commits, and security basics.
- Marked missing or inconsistent policies as `[TO DEFINE]`.

## Known Gaps

- `[TO DEFINE]` Lint command.
- `[TO DEFINE]` Coverage threshold and coverage command.
- `[TO DEFINE]` End-to-end test framework.
- `[TO DEFINE]` Branch naming and pull request reviewer policy.
- `[TO DEFINE]` Dependency approval and vulnerability audit process.
