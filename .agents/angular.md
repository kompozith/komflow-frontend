# Purpose

Define Angular-specific implementation rules for modern Angular projects. These rules extend `.github/agents/base.md`, `.github/agents/coding.md`, `.github/agents/testing.md`, and `.github/agents/security.md`.

extends: ../.github/agents/base.md
extends: ../.github/agents/coding.md
extends: ../.github/agents/testing.md
extends: ../.github/agents/security.md

## Scope

- Apply this file to Angular TypeScript, HTML templates, SCSS connected to Angular components, guards, interceptors, resolvers, pipes, directives, and routes.
- The current project uses Angular 20, standalone components, SCSS, Angular Material, RxJS, and Angular Signals.

## Components

- Create standalone components; do not add `NgModule` wrappers unless a third-party integration requires one.
- Use `ChangeDetectionStrategy.OnPush` on new components.
- Use `input()`, `output()`, and `model()` instead of `@Input()` and `@Output()`.
- Use `inject()` instead of constructor parameter properties for dependency injection.
- Use functional guards, resolvers, and interceptors with `inject()` where Angular supports them.
- Do not import `CommonModule`, `BrowserModule`, `NgIf`, `NgFor`, or `NgSwitch` only to support deprecated template syntax.

## Templates

- Use `@if`, `@for`, and `@switch` instead of `*ngIf`, `*ngFor`, and `*ngSwitch`.
- Add an explicit `track` expression to every `@for`.
- Convert Observables used by templates to signals with `toSignal()` in the component class.
- Use `@let` for template-local values derived from signals.
- Keep user-facing text behind the project i18n mechanism when translation files exist.

## State And Async

- Use `signal()`, `computed()`, and `effect()` for local reactive state when they reduce template subscription work.
- Use RxJS for stream composition and HTTP flows when the source API is Observable-based.
- Use `takeUntilDestroyed()` instead of manual `Subject` cleanup or manual `unsubscribe()` in `ngOnDestroy`.
- Reset page loading and action pending flags in success and error paths.
- Use a structured skeleton for initial async page loading when the project has skeleton components or skeleton utility classes.
- Use inline button spinners and disabled states for user-triggered async actions after initial load.

## Runtime Configuration

- Do not import `environment.development` into application services or components.
- Use the existing runtime configuration service when the project provides one.
- Resolve API base URLs lazily through the runtime configuration service instead of module-level constants.

## Styling

- Use SCSS for component styles.
- Use design-system tokens or existing SCSS variables for colors.
- Do not wrap a page component template in `container-fluid`, `container`, or any Bootstrap container div. The full layout already applies `pageWrapper` which provides `padding: 24px`; adding a container inside it creates double indentation relative to pages that omit it.
- Do not use hardcoded hex, RGB, HSL, or named colors in component SCSS when tokens exist.
- Do not add component-level `.dark-theme` overrides to compensate for hardcoded colors.
- Allow `transparent`, `inherit`, and `currentColor` where they express CSS behavior rather than a theme color.

## i18n

- Use the existing translation pipe or translation service for visible text.
- Keep translation key names consistent and namespaced by feature or shared area.
- Maintain key parity across supported translation JSON files.
- `[TO DEFINE]` Product-specific terminology glossary for each application that adopts these rules.

## Angular Tests

- Use Angular TestBed for components, directives, pipes, services, guards, resolvers, and interceptors that require Angular dependency injection.
- Current workspace test runner is Karma/Jasmine through `@angular/build:karma`.
- Use `npm test` for the configured test suite.
- Use `npm run build` to verify production Angular compilation.

## Audit Patterns

- Search for `class="container-fluid"` or `class="container"` as root or near-root elements in page component templates and remove them; `pageWrapper` already provides the outer spacing.
- Search for `*ngIf`, `*ngFor`, and `*ngSwitch` when modernizing templates.
- Search for `@Input(`, `@Output(`, `EventEmitter`, and constructor parameter properties when modernizing components.
- Search for `destroy$`, `takeUntil(`, `ngOnDestroy`, and `.unsubscribe()` when modernizing subscription cleanup.
- Search for `| async` in templates when moving template Observables to signals.
- Search for `environment.development` when checking runtime configuration.
