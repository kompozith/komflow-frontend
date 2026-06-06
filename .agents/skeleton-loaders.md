# Purpose

Define DeleevX skeleton loader rules for async UI states. These rules extend the reusable agent setup and the Angular rules.

extends: ../.github/agents/base.md
extends: ../.agents/angular.md

## Scope

- Apply this file to every component, page, dialog, section, card, table, list, or detail view that loads async data.
- Apply this file when adding or changing `isLoading`, `isPageLoading`, `isSaving`, `isDeleting`, `isRefreshing`, resource loading states, HTTP subscriptions, or user-triggered async actions.

## Core Rule

- Initial async page loading must use structured skeleton placeholders that mirror the final UI.
- A standalone page-level `mat-spinner` is not allowed for initial page loading.
- User-triggered async actions after the page has loaded must use disabled controls and inline progress indicators, not page skeletons.

## Initial Page Loading

- Use `isPageLoading` or an equivalent explicit page-loading state for first render data fetches.
- While initial data is loading, replace the data-driven UI with skeletons.
- Include skeleton placeholders for titles, subtitles, stats, avatars, images, badges, cards, tables, lists, and initial action buttons when those elements appear in the final UI.
- Match the final UI structure closely enough that layout dimensions do not jump when data arrives.
- Add `aria-hidden="true"` to decorative skeleton blocks.
- Do not show an empty page, a centered spinner, or a single generic loader where the final screen has structured content.

## User-Triggered Actions

- Use separate action flags such as `isSaving`, `isDeleting`, `isRefreshing`, or `isDeletingId`.
- Disable the triggering button or control while the action is pending.
- Show `mat-spinner` inline inside the triggering button when using Angular Material buttons.
- For icon buttons, replace the icon with an inline spinner only for the pending item.
- Do not replace a loaded page section with skeletons for save, delete, approve, reject, refresh, or submit actions.

## Loading State Reset

- Reset page loading and action pending flags in both success and error paths.
- Prefer `finalize()` for RxJS flows and `finally` for Promise or `async` flows.
- Do not set a loading flag to `false` only in `complete` when the stream can error.

## Existing Skeleton Assets

- Prefer existing shared skeleton components before building a new inline skeleton.
- Use list skeletons for table and list views when a matching shared component exists.
- Use detail skeletons for entity detail and form-like pages when a matching shared component exists.
- Use shared skeleton utility classes for small inline placeholders when a full shared component would add unnecessary indirection.
- Create a new shared skeleton preset only when at least two screens need the same skeleton structure.

## Expected Skeleton Shapes

- Text line: a skeleton line with an approximate width matching the final label or value.
- Avatar or logo: a circular or rounded skeleton matching final dimensions.
- Badge or status: a short rounded skeleton matching final badge dimensions.
- Image: a block skeleton with the final image aspect ratio.
- Button during initial page load: a skeleton action block matching button size.
- Table or list: repeated row skeletons with the same column rhythm as the loaded state.
- Detail page: grouped skeleton blocks matching header, metadata, stats, and action areas.

## Review Checklist

- Verify every async data region has an initial skeleton.
- Verify the skeleton mirrors the final hierarchy and approximate dimensions.
- Verify action buttons are disabled while their action is pending.
- Verify action spinners are inline and scoped to the triggering control.
- Verify page loading and action flags reset on errors.
- Verify no page-level spinner is used as the only initial loading state.
- Verify shared skeleton components or utility classes are reused when available.

## Audit Patterns

- Search templates for `mat-spinner` and check whether it is page-level or inline in an action.
- Search TypeScript for `isLoading`, `isPageLoading`, `isSaving`, `isDeleting`, `isRefreshing`, `loading`, and resource loading state access.
- Search RxJS flows for missing `finalize()` when a loading flag is set before subscription.
- Search templates for async data references without an adjacent loading branch.
