# EDUCATIONAL PLATFORM — AGENT OPERATING PROTOCOL

## 1. Project Rule

This repository is developed by multiple AI coding agents.

Agents must coordinate through the repository files, Git branches, commits, tests, and documented task status.

No agent may assume another agent's work is correct without verification.

---

## 2. Active Agents

### Cline
Role:
Frontend, UI/UX, accessibility, responsive experience.

Branch:
`agent/cline`

Primary ownership:
- frontend
- UI components
- layouts
- navigation
- responsive behavior
- accessibility
- visual consistency

---

### OpenCode
Role:
Lead systems and backend engineer.

Branch:
`agent/opencode`

Primary ownership:
- architecture
- backend
- APIs
- database
- authentication
- authorization
- integrations
- scalability

---

### Aider
Role:
QA, testing, auditing and regression verification.

Branch:
`agent/aider`

Primary ownership:
- automated tests
- integration tests
- regression testing
- code audits
- performance checks
- reliability checks
- verification

Aider must not approve its own unverified changes.

---

### Continue
Role:
Documentation and codebase intelligence.

Branch:
`agent/continue`

Primary ownership:
- documentation
- developer knowledge
- architecture documentation
- API documentation
- project guides
- consistency checks between documentation and implementation

---

### Roo Code
Role:
Security, DevOps and integration specialist.

Branch:
`agent/roo-code`

Primary ownership:
- security
- deployment
- infrastructure
- environment configuration
- CI/CD
- integration audits
- production-readiness checks

---

## 3. Universal Rules

Every agent MUST:

1. Read `AGENTS.md` before modifying the project.
2. Read the relevant project documentation before starting a task.
3. Check `TASKS.md` before taking work.
4. Check `AGENT_STATUS.md` before modifying shared systems.
5. Never overwrite another agent's uncommitted work.
6. Work only from its assigned branch/worktree.
7. Keep changes focused on the assigned task.
8. Run appropriate tests before declaring completion.
9. Update relevant documentation when behavior changes.
10. Update `AGENT_STATUS.md` when beginning and completing substantial work.
11. Update `CHANGELOG.md` for meaningful project changes.
12. Record important architectural decisions in `DECISIONS.md`.
13. Never commit secrets, API keys, passwords, tokens, or private credentials.
14. Never hard-code production credentials.
15. Never silently change another agent's ownership area.
16. Never claim a task is complete when tests or required verification are failing.

---

## 4. Shared Knowledge

The following files are the project's shared memory:

- `PROJECT_SPEC.md`
- `ARCHITECTURE.md`
- `TASKS.md`
- `AGENT_STATUS.md`
- `DECISIONS.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `TESTING.md`
- `DEPLOYMENT.md`

Agents must treat these files as authoritative project coordination documents.

---

## 5. Task Protocol

Before starting work:

1. Read the task.
2. Check dependencies.
3. Check whether another agent is modifying the same area.
4. Record ownership/status.
5. Implement the task.
6. Test the implementation.
7. Document relevant changes.
8. Commit the work.
9. Mark the task ready for verification.

A completed task is NOT automatically considered verified.

---

## 6. Verification Protocol

When an agent completes a task requiring verification:

1. The assigned verifier must inspect the changes.
2. The verifier must run relevant tests.
3. The verifier must check for regressions.
4. The verifier must record PASS or FAIL.
5. If FAIL, the original owner must correct the issue.
6. Verification must be repeated after corrections.

Required default verification:

- Cline → Aider
- OpenCode → Aider
- Continue → relevant owning agent
- Roo Code → Aider
- Aider → another appropriate agent

No agent may be the sole authority approving its own critical work.

---

## 7. Git Rules

Agents must:

- work only on their assigned branch;
- make small, descriptive commits;
- never force-push;
- never rewrite shared history;
- never commit directly to `main`;
- never merge their own critical work without required verification;
- pull/rebase only when safe and documented;
- resolve conflicts carefully;
- preserve another agent's valid work.

`main` represents the stable integration branch.

---

## 8. Main Branch Protection

`main` must contain only tested, reviewed and integration-ready work.

Agents should never directly develop features on `main`.

Changes reach `main` through controlled integration after verification.

---

## 9. Ownership Boundaries

Ownership is guidance, not permission to ignore dependencies.

Agents may inspect any part of the repository.

Before modifying another agent's primary ownership area:

1. document why;
2. coordinate through `TASKS.md` / `AGENT_STATUS.md`;
3. avoid unnecessary duplication;
4. preserve existing contracts;
5. notify the owning agent through the project coordination files.

---

## 10. Architecture Principles

The educational platform must be designed for:

- scalability;
- maintainability;
- modularity;
- security;
- accessibility;
- responsive design;
- large content volumes;
- future educational sections;
- configurable permissions;
- API-driven AI integration;
- provider independence;
- low infrastructure cost;
- easy migration;
- reliable backups;
- observability;
- automated testing.

Do not hard-code assumptions that prevent future expansion.

---

## 11. Content Architecture

Educational content must be data-driven.

Do not hard-code every class, subject, chapter or section into frontend source code.

The system must allow future administrators/owners to add:

- educational sections;
- classes;
- subjects;
- topics;
- chapters;
- categories;
- content types;
- access rules.

without rebuilding the entire application.

---

## 12. Access Control

The platform will support configurable access levels.

Initial levels:

### Level 1 — Owner / Premium
100% access.

### Level 2 — Member
Approximately 50% of available content according to configured access rules.

### Level 3 — Co-member
Approximately 25% according to configured access rules.

### Level 4 — Public
Publicly available content only.

The exact access percentage must NOT be implemented as unsafe frontend-only logic.

Authorization must ultimately be enforced server-side.

Locked content may be visible in the catalog, but unauthorized protected content must remain protected.

Where appropriate, locked content displays:

- 🔒 Access it
- Contact with owner

---

## 13. Security

Security takes priority over convenience.

Never trust:

- frontend role values;
- client-side permissions;
- URL parameters;
- hidden UI elements;
- local storage values;
- client-provided ownership claims.

Server-side authorization must determine access to protected resources.

Secrets belong in environment variables or secure secret storage.

---

## 14. AI Integration

AI functionality must be provider-independent where practical.

Do not hard-code one AI provider into the entire architecture.

AI integrations should use an abstraction layer so providers/models can be replaced later.

API keys must never be committed.

The application must continue functioning safely when an AI provider is unavailable.

---

## 15. Scalability

The architecture must avoid unnecessary coupling.

Prefer:

- modular services;
- indexed database queries;
- pagination;
- lazy loading;
- caching where appropriate;
- asynchronous processing where appropriate;
- object/file storage for large files;
- separation of application data and uploaded files;
- database migrations;
- reusable components;
- API versioning where appropriate.

Never load an entire large content library into the browser unnecessarily.

---

## 16. Quality Gate

Before a task is considered complete:

- implementation works;
- relevant tests pass;
- build passes;
- no obvious console errors remain;
- no secrets are exposed;
- documentation is updated when necessary;
- accessibility is considered;
- responsive behavior is considered;
- performance impact is considered;
- required verification is complete.

---

## 17. Conflict Rule

If two agents modify the same file:

1. stop and inspect the changes;
2. do not blindly overwrite;
3. preserve valid work from both sides where possible;
4. resolve the conflict deliberately;
5. run tests afterward;
6. document significant resolution decisions.

---

## 18. New Agent Registration

A new agent may be added only after registering:

- name;
- role;
- branch;
- workspace;
- ownership;
- responsibilities;
- restrictions;
- verification responsibilities.

The new agent must read this file and all relevant project documentation before making changes.

---

## 19. No Guessing Rule

If requirements are ambiguous, an agent must not invent critical business rules.

It must:

1. inspect existing specifications;
2. inspect architecture decisions;
3. document the ambiguity;
4. choose the safest reversible option when possible;
5. record the decision.

---

## 20. Completion Rule

"Code written" does not mean "task completed."

Completion means:

IMPLEMENTED → TESTED → VERIFIED → DOCUMENTED → COMMITTED

Only then should a task be marked complete.