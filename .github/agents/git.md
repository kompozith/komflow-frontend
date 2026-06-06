# Purpose

Define git workflow, commit, branch, and pull request rules. These rules extend `.github/agents/base.md`.

extends: ./base.md

## Scope

- Apply this file when staging, committing, branching, rebasing, merging, or preparing pull requests.

## Working Tree

- Check `git status --short` before committing or preparing a final summary.
- Do not revert, overwrite, or stage unrelated user changes.
- Keep one concern per commit.
- Do not mix feature work, bug fixes, formatting-only edits, and refactors in the same commit unless the user asks for a single commit.

## Commit Messages

- Use Conventional Commits.
- Allowed types inferred from existing rules: `feat`, `fix`, `refactor`, `style`, `chore`.
- `[TO DEFINE]` Policy for `test`, `docs`, `build`, `ci`, and `perf` commit types.
- Use the imperative mood in the subject.
- Keep the subject focused on the changed behavior or rule.

## Branches

- `[TO DEFINE]` Branch naming convention.
- `[TO DEFINE]` Base branch for pull requests.
- `[TO DEFINE]` Rebase versus merge policy.

## Pull Requests

- Include a concise summary of behavior changes.
- Include validation commands and outcomes.
- Link related issue or task IDs when available.
- `[TO DEFINE]` Required reviewers.
- `[TO DEFINE]` Required labels.
