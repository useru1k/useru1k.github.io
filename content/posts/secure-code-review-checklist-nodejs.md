# Secure Code Review Checklist for Node.js APIs

A focused checklist beats a giant generic checklist. During review, prioritize controls that reduce exploitability and blast radius.

## 1. Authentication

- Is authentication enforced across all sensitive endpoints?
- Are JWT secrets strong and rotated?
- Is token expiry reasonable?

## 2. Authorization

- Is access control checked server-side for every action?
- Are IDs validated against resource ownership?

## 3. Input Handling

- Is schema validation enforced before business logic?
- Are dangerous sinks protected (command execution, template rendering, file paths)?

## 4. Data Protection

- Are secrets absent from logs?
- Is sensitive data encrypted at rest and in transit?
- Is PII minimized in responses?

## 5. Dependency Hygiene

- Are lockfiles committed?
- Are vulnerable transitive dependencies patched or isolated?

Use this checklist early in pull requests to reduce late-stage security rework.
