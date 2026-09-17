# Purpose

Define how UI is built in this workspace so screens stay consistent as they are
migrated off Angular Material. These rules extend `.github/agents/base.md`,
`.github/agents/coding.md`, and `.agents/angular.md`.

extends: ../.github/agents/base.md
extends: ../.github/agents/coding.md
extends: ./angular.md

## Scope

- Apply this file when writing or changing any markup, style, or component that
  a user sees.
- The design system lives in `src/styles/tailwind.css` (the `.ds-*` classes and
  the `@theme` token map) and in `src/assets/scss/theme-variables/`.

## Source Of Truth

- Figma file `lc4rJ5hqRPiIxUJgy26u4N` ("TEMPLATES KOMPOZITH"), page **Komflow
  redesign**, is the reference for sizes, radii, colors, and spacing.
- Measure the design before changing a value. Do not infer a size from a
  neighbouring element or from how a screenshot looks.
- Access is through the Figma REST API with the token at `~/.figma-token`. There
  is no local Figma MCP server: it ships with the Figma desktop app, which has
  no Linux build.

## Tokens

- Colors come from semantic `--ds-*` variables declared per theme in
  `theme-variables/_light-theme-variables.scss` and `_dark-theme-variables.scss`,
  and exposed to Tailwind through `@theme` in `tailwind.css`.
- Current surfaces: `field` (control background), `hairline` and
  `hairline-strong` (borders), `panel`, `card`, `track` (segmented control).
- Radii: `--radius-control` 13px, `--radius-panel` 20px, `--radius-card` 24px,
  `--radius-shell` 32px.
- Do not hardcode a Figma hex value in a component. Add or reuse a `--ds-*`
  token so the dark theme can answer with its own value.

## Components And Sizes

- Build controls from `.ds-input`, `.ds-btn`, `.ds-segmented`, `.ds-menu-panel`,
  `.ds-icon-btn`, and the surfaces `.ds-shell`, `.ds-panel`, `.ds-card`.
- Heights are fixed by the design system: 48px for a form field or button, 36px
  in a toolbar (`--sm`), 52px for the primary call to action on the auth screens
  (`--lg`). A control never states its own height.
- Reach for an existing `.ds-*` class before writing utilities. If a third
  screen needs the same combination, promote it to a `.ds-*` class rather than
  copying the utility list a third time.

## The Cascade Trap

- The `.ds-*` rules are written after Tailwind's utilities import, so at equal
  specificity **they win over a plain utility on the same element**. Putting
  `tw:h-10` on a `.ds-input` does nothing; the element still renders at 48px.
- Change a design-system value through a modifier class (`.ds-input--sm`,
  `.ds-btn--lg`), never by adding a competing utility to the element.
- A modifier that must beat a property the base class already sets has to be
  declared after it in the file — that is why `.ds-menu-panel--scroll` sits
  below `.ds-menu-panel`.
- Angular Material's component styles are injected after the global stylesheet
  and use class selectors, so `.mat-*` rules outrank element selectors in the
  global sheet. Match or exceed their specificity when overriding.

## Preflight Is Disabled

- Tailwind's base reset is deliberately not imported, so browser defaults
  survive. Consequences to write explicitly:
  - A `<button>` keeps its grey `ButtonFace` background and 3D border. Any
    button-like control must set its own background and border.
  - The reset in `tailwind.css` that strips button borders must skip every
    control that draws its own (`.ds-input`, `.ds-btn--outline`); its selector
    weighs more than those class rules and silently wins otherwise.
  - A custom element host (`<app-foo>`, `<ds-menu>`) defaults to
    `display: inline`. Give it an explicit `display` when layout depends on it.

## Layout

- Do not rely on `margin: auto` for centering inside a flex container: on the
  cross axis, auto margins absorb the free space **and** suppress the default
  `align-self: stretch`, so the element shrink-wraps. Set an explicit width, or
  center with the container's own alignment.
- Page content belongs in `.pageWrapper`, which already provides the 24px gutter
  and full width.

## Menus And Overlays

- Use the `ds-menu` component for any dropdown. It renders through the CDK
  overlay, so it is immune to clipping by an ancestor's `overflow`.
- Never hand-roll an absolutely-positioned panel inside a scrollable container:
  `overflow-x: auto` forces `overflow-y` to `auto`, which clips the panel and
  adds a scrollbar that shifts the layout.
- Style menu contents with `.ds-menu-panel` and `.ds-menu-item`.

## Data Tables

- Wrap a data table in `.table-responsive`; the system lives in
  `assets/scss/override-component/_table.scss`.
- Columns are sized by their content and capped at `$table-cell-max-width` (20rem); a
  long value truncates rather than starving its neighbours. Do not pin columns
  with `width: 1%` or let one column absorb the leftover space.
- Below 768px each row becomes a card. Give every data cell a `data-label` with
  its column name, and mark the identity cell `.cell-primary`, the row actions
  `.cell-actions`, and row numbers or checkboxes `.cell-hide-card`.

## Audit Patterns

- Search for `tw:h-`, `tw:rounded-`, `tw:bg-` on an element that already carries
  a `.ds-*` class: it is either dead or fighting the cascade.
- Search for hardcoded hex values in templates and component styles.
- Search for `absolute` panels near `overflow-` containers when a dropdown is
  reported as clipped or as shifting content.
