# Purpose

Route Copilot to the canonical reusable instruction files.

extends: ../.github/agents/base.md

## Loading Order

- Always read `.github/agents/base.md`.
- For code changes, read `.github/agents/coding.md`.
- For tests, read `.github/agents/testing.md`.
- For git and pull request work, read `.github/agents/git.md`.
- For reviews, read `.github/agents/review.md`.
- For security-sensitive work, read `.github/agents/security.md`.
- For Angular work, read `.agents/angular.md`.
- For structure or extraction decisions, read `.agents/architecture.md`.
- For async UI loading states, read `.agents/skeleton-loaders.md`.
- For DeleevX terminology and business workflows, read `.agents/business.md`.

## Rule

- Keep this file as an adapter; do not add implementation rules here.
