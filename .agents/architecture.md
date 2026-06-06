# Purpose

Define project structure and design pattern rules that can be reused across Angular applications. These rules extend `.github/agents/base.md` and `.github/agents/coding.md`.

extends: ../.github/agents/base.md
extends: ../.github/agents/coding.md

## Scope

- Apply this file when creating, moving, or extracting components, services, routes, utilities, shared UI, styles, and configuration.
- Keep application-specific folder names out of this file unless an adopting project defines them separately.

## Structure

- Put singleton services, interceptors, guards, and application-wide providers in a core area.
- Put reusable presentational components, directives, and pipes in a shared area.
- Put feature-specific screens, routes, and state in feature folders.
- Put pure helper functions in utilities modules that do not depend on framework injection.
- Put static assets, translation files, theme variables, and global style helpers under the project asset or style structure already used by the app.

## Dependency Direction

- Features may depend on core and shared code.
- Shared UI must not depend on feature-specific services or feature-specific route structure.
- Core services must not depend on feature modules or feature components.
- Utilities must not depend on Angular dependency injection.
- Do not introduce circular dependencies between features, shared code, and core code.

## Refactoring

- Search for existing core, shared, and utility implementations before adding a new one.
- Extract duplicated logic only when the extracted API can be named by behavior rather than by a single caller.
- Keep feature-specific business rules inside the feature that owns them.
- Confirm all consumers after moving code.
- Do not change public service or component contracts without checking all usages.

## Routing And Loading

- Prefer lazy-loaded feature routes when the existing application structure supports lazy loading.
- Keep route guards and resolvers focused on route access or data preparation.
- Do not fetch data in routing code when component-level loading and error states are required.

## Undefined Rules

- `[TO DEFINE]` Exact folder names for core, shared, feature, and utility areas in each adopting project.
- `[TO DEFINE]` Naming conventions for shared components and services.
- `[TO DEFINE]` Route organization policy for large feature areas.
