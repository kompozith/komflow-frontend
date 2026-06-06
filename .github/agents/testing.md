# Purpose

Define test strategy and verification rules for repository changes. These rules extend `.github/agents/base.md`.

extends: ./base.md

## Scope

- Apply this file when behavior changes, bugs are fixed, public APIs change, or tests are added or updated.
- For Angular component, service, guard, interceptor, pipe, and template tests, also apply `.agents/angular.md`.

## Available Commands

- Use `npm test` for the Angular test suite.
- Use `npm run build` to verify production build and Angular template compilation.
- `[TO DEFINE]` Headless test command for CI-compatible local execution.
- `[TO DEFINE]` Coverage threshold and coverage command.
- `[TO DEFINE]` End-to-end test framework and command.

## Test Placement

- Put Angular unit tests in `*.spec.ts` files covered by `tsconfig.spec.json`.
- Keep tests next to the unit under test unless an existing folder pattern requires a different location.
- Use Angular TestBed for Angular artifacts that depend on dependency injection, templates, routing, or Angular lifecycle.

## Required Coverage Decisions

- Add or update tests when a change alters user-visible behavior, validation, state transitions, service contracts, or error handling.
- Add regression tests for bug fixes when the failing behavior can be reproduced deterministically.
- For refactors that claim behavior preservation, run existing tests that cover the touched area.
- `[TO DEFINE]` Minimum branch or statement coverage for new code.

## Test Quality

- Assert observable behavior instead of private implementation details.
- Cover success, failure, and empty states for async data flows when the component or service exposes those states.
- Verify loading or pending flags return to false after success and error paths when those flags exist.
- Keep mocks limited to dependencies outside the unit being tested.

## Reporting

- State which test or build command was run.
- State any skipped test scope and the concrete reason.
