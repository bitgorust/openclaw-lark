# Fork Maintenance Policy

This repository is maintained as an internal fork of the official upstream project:

- `upstream`: `https://github.com/larksuite/openclaw-lark.git`
- `origin`: our maintained fork

The maintenance goal is strict: keep this fork easy to sync with upstream, keep our local value, and make every meaningful change either upstreamable or cleanly isolated.

## Core Rules

1. `main` stays rebase-friendly.
   Base all work on top of the latest `upstream/main`. Do not let `main` accumulate ad-hoc tenant-specific hacks.
2. Prefer upstream-compatible changes first.
   Bug fixes, refactors, docs corrections, tests, API correctness fixes, and broadly useful features should be implemented in a form that can be proposed upstream with minimal or no rewriting.
3. Isolate fork-only behavior explicitly.
   If a change is specific to our deployment, policy, branding, or workflow, isolate it behind configuration, extension points, or narrowly scoped files. Do not spread fork-only assumptions across shared code paths.
4. Never mix upstreamable and fork-only changes in one commit.
   A reviewer must be able to cherry-pick the upstreamable commit series directly.

## Branching Model

- `main`: our integration branch, kept close to `upstream/main`
- `feat/*`, `fix/*`, `docs/*`, `chore/*`: short-lived working branches
- `fork/*`: fork-only work that is intentionally not proposed upstream

Before starting work:

```bash
git fetch upstream origin
git checkout main
git rebase upstream/main
git push --force-with-lease origin main
git checkout -b fix/some-change
```

## Change Classification

### Upstreamable by default

- correctness fixes
- tests
- API compatibility updates
- docs clarifications
- generally useful features
- performance and reliability improvements

### Fork-only by exception

- company-specific defaults
- private integrations
- environment-specific policy or routing
- branding or operational workflows unique to our deployment

Fork-only changes must be easy to disable or remove.

## Commit and PR Discipline

- Keep commits small, ordered, and reviewable.
- If a branch has both shared and fork-only work, split it into two commit stacks.
- Open an internal PR to `origin` first when needed, but preserve a clean subset that can become an upstream PR.
- For upstreamable work, include:
  - problem statement
  - rationale
  - tests
  - notes on backward compatibility

## Stacked Changes and Upstream PRs

When a feature depends on one or more prerequisite fixes, do not block fork development waiting for upstream to merge the fix first. Instead:

1. split the work into ordered commits
2. keep prerequisite fixes independently understandable
3. build the feature on top of those fix commits
4. submit upstream in layers

Recommended structure:

- `fix: ...` prerequisite correction with standalone value
- `feat: ...` feature implementation
- `test:` or `docs:` follow-up commits when helpful

Recommended upstream workflow:

1. push the full stack to `origin` so the fork can use it immediately
2. open the fix PR upstream first
3. open the feature PR as a stacked PR when needed, and explicitly state the dependency
4. after the fix is merged upstream, rebase the feature PR onto `upstream/main`

Do not merge a standalone fix into a feature commit just because the feature depends on it. Only keep them together when the "fix" has no independent value outside the feature itself.

## Sync Strategy

- Sync from `upstream/main` regularly using rebase, not merge bubbles.
- Resolve conflicts by preserving upstream behavior unless we have a documented fork-only reason not to.
- After upstream accepts an equivalent patch, drop or replace our local fork patch instead of carrying duplicate logic.

## Review Gate

A change is ready only if reviewers can answer yes to both:

1. Can the upstreamable part be proposed to upstream as-is or with trivial cleanup?
2. If any fork-only part remains, is it clearly isolated and low-cost to maintain during future rebases?
