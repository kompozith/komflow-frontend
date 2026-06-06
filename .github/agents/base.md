# Purpose

Define universal agent rules for software changes in this repository. These rules are language-agnostic and apply before any specialized rule file.

extends: none

## Scope

- Apply this file to every source, test, documentation, configuration, and workflow change.
- Load specialized files only when their topic is relevant:
  - `.github/agents/coding.md` for code style and maintainability.
  - `.github/agents/testing.md` for test strategy.
  - `.github/agents/git.md` for commits, branches, and pull requests.
  - `.github/agents/review.md` for review checks.
  - `.github/agents/security.md` for security checks.
  - `.agents/angular.md` for Angular-specific work.
  - `.agents/architecture.md` for project structure decisions.

## Operating Rules

- Read existing code before changing it.
- Preserve the current public API unless the task explicitly requires a breaking change.
- Prefer existing local helpers, services, components, and patterns over new abstractions.
- Keep each change scoped to the user request and the files needed to complete it.
- Do not rewrite unrelated code while making a targeted change.
- Do not remove user changes unless the user explicitly asks for that removal.
- Use actionable TODO markers only when the missing decision is outside the current task; include owner or decision context when known.

## File Edits

- Use UTF-8, two-space indentation, trailing newline, and trimmed trailing whitespace.
- Use single quotes in TypeScript.
- Preserve Markdown trailing whitespace only when it is intentional formatting.
- Add comments only when they explain non-obvious constraints, edge cases, or decisions.
- Avoid comments that restate the code.

## Verification

- Run the narrowest available validation that covers the changed behavior.
- Report any validation that was not run and the reason it was skipped.
- Treat build, type, template, and test errors in modified files as blockers unless the user asks for a draft.

## Undefined Rules

- `[TO DEFINE]` Required CI validation command for non-Angular changes.
- `[TO DEFINE]` Repository-wide lint command.
- `[TO DEFINE]` Documentation review owner.
