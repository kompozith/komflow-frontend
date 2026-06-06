# Purpose

Define reusable coding rules for readable, maintainable implementation work. These rules extend `.github/agents/base.md`.

extends: ./base.md

## Scope

- Apply this file when editing application code, shared utilities, services, components, styles, or templates.
- For Angular-specific APIs, also apply `.agents/angular.md`.

## Code Structure

- Keep one responsibility per function, class, component, service, or file.
- Extract shared logic only after verifying at least two concrete call sites need the same behavior.
- Place pure functions in utility modules when they do not require framework injection or mutable shared state.
- Place shared stateful logic behind an injectable service when it requires dependency injection or coordinates multiple consumers.
- Do not introduce a wrapper abstraction when direct use of an existing local API keeps the call sites shorter and clearer.
- Before creating a helper, search for an existing equivalent in shared or core code.

## Type Safety

- Do not use `any`; use explicit interfaces, generics, unions, `unknown` with narrowing, or framework-provided types.
- Keep runtime data boundaries typed and validated before use.
- Avoid non-null assertions unless the value is guaranteed by the framework lifecycle or an explicit guard in the same flow.

## Error Handling

- Handle expected failures at the boundary where the user, caller, or retry logic can act on them.
- Reset loading and pending flags in both success and error paths; use `finalize` or `finally` when available.
- Do not leave production `console.log` calls in committed code.

## Formatting

- Follow `.editorconfig`: UTF-8, spaces, two-space indentation, final newline, and trimmed trailing whitespace.
- Use single quotes in TypeScript.
- Preserve existing file organization unless the change requires moving code.

## Duplication

- Remove repeated code only when the extracted form has a stable name and preserves behavior at all call sites.
- Do not factor domain-specific logic into a shared helper unless the rule is truly shared across the call sites.
- Verify imports and consumers after extraction.
