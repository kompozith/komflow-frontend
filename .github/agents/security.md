# Purpose

Define security rules for application changes. These rules extend `.github/agents/base.md`.

extends: ./base.md

## Scope

- Apply this file when editing authentication, authorization, HTTP calls, forms, storage, HTML rendering, configuration, deployment, or user-controlled data flows.
- For Angular implementation details, also apply `.agents/angular.md`.

## Input And Output Handling

- Validate user input with framework validators or explicit runtime checks before using it in requests, state changes, or rendering.
- Treat server responses, route params, query params, local storage values, and uploaded files as untrusted until validated.
- Do not render dynamic HTML unless it is sanitized with Angular's sanitization APIs or a project-approved sanitizer.
- Do not bypass Angular template binding protections with direct DOM writes unless the use case is documented and reviewed.

## Secrets And Storage

- Do not commit secrets, API keys, tokens, private certificates, or credentials.
- Do not store sensitive values in local storage unless encryption and lifecycle requirements are explicitly defined.
- `[TO DEFINE]` Secret scanning command or CI check.
- `[TO DEFINE]` Approved client-side storage policy for tokens and sensitive profile data.

## HTTP And Auth

- Route authenticated HTTP calls through the existing auth interceptor pattern when one exists.
- Do not manually attach tokens in individual services when an interceptor owns token attachment.
- Keep runtime configuration outside the compiled bundle when the project provides runtime config loading.
- Do not hardcode environment-specific URLs in services.

## Dependencies

- Do not add a dependency for behavior that the framework or existing repository utilities already provide.
- `[TO DEFINE]` Dependency approval process.
- `[TO DEFINE]` Vulnerability audit command.
