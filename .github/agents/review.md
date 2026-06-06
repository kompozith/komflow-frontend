# Purpose

Define the code review checklist and review output format. These rules extend `.github/agents/base.md`.

extends: ./base.md

## Scope

- Apply this file when reviewing a diff, checking a pull request, or doing a final self-review before completion.
- Apply specialized review files when relevant: `.agents/angular.md`, `.agents/architecture.md`, and `.github/agents/security.md`.

## Review Order

- Check correctness, regressions, and broken behavior first.
- Check security-sensitive data handling and HTTP/auth behavior next.
- Check tests and verification coverage.
- Check maintainability, duplication, and architecture fit.
- Check formatting, naming, and documentation last.

## Required Checks

- Verify modified files compile or are covered by an appropriate build/type/template check.
- Verify changed behavior has tests or a stated reason tests were not added.
- Verify async UI states cannot remain stuck after an error.
- Verify user-facing text is not hardcoded when an i18n mechanism exists.
- Verify style changes do not introduce hardcoded colors when design tokens exist.
- Verify new shared code has at least two concrete consumers or a clear framework boundary reason.

## Review Output

- Lead with findings ordered by severity.
- Include file and line references for each finding.
- Describe the observed risk and a concrete correction.
- If no issues are found, state that no blocking issues were found and list residual risk or test gaps.

## Severity

- `Critical`: data loss, security exposure, production outage, or build failure.
- `High`: user-visible regression, broken workflow, or missing required validation.
- `Medium`: maintainability or test gap likely to cause future defects.
- `Low`: minor clarity, formatting, or documentation issue.
