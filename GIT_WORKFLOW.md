# Git Workflow and CI/CD Policy

This document turns the fork maintenance principles into an execution policy for daily development, integration, and release.

It is intended to answer four practical questions:

1. what `main` is for
2. when `main` may be pushed
3. which branches are used for development versus release
4. how CI and CD should be triggered

This document complements, not replaces, [MAINTAINING.md](/data/Workspace/openclaw-lark/MAINTAINING.md) and [RELEASING.md](/data/Workspace/openclaw-lark/RELEASING.md).
For a concrete implementation draft for GitLab CI, GitHub Actions, release packaging, and branch protection, see [CI_CD_BLUEPRINT.md](/data/Workspace/openclaw-lark/CI_CD_BLUEPRINT.md).

## 1. Goals

This fork is maintained as an upstream-first fork. The workflow must preserve all of the following:

1. `main` stays close to `upstream/main`
2. broadly useful changes remain easy to upstream
3. fork-only behavior stays isolated and low-cost to carry
4. CI gives fast feedback on development branches
5. CD uses explicit release control instead of deploying every integration change automatically

## 2. Branch Roles

### `main`

`main` is the fork integration baseline.

Use `main` for:

1. regularly rebasing onto `upstream/main`
2. integrating reviewed changes that are ready to become part of the maintained fork baseline
3. running full integration CI

Do not use `main` for:

1. day-to-day feature development
2. ad-hoc tenant-specific experiments
3. unreviewed direct commits

`main` should remain as linear and rebase-friendly as practical.

### Working branches

Use short-lived branches for normal work:

- `fix/*`: correctness and reliability fixes
- `feat/*`: new features
- `docs/*`: documentation changes
- `chore/*`: tooling and maintenance work
- `fork/*`: intentionally fork-only changes that are not meant for upstream

All routine development starts from the latest synced `main`.

### Release branches and tags

Use one of these explicit release controls:

- `release/*` branch when a release candidate needs extra verification or release-only preparation
- annotated git tag for a finalized release, such as `v2026.4.10-lh.1`

Production deployment should be triggered from a release branch or release tag, not from arbitrary branch updates.

## 3. `main` Push Policy

`main` may be pushed, but only for controlled maintenance purposes.

Allowed pushes to `main`:

1. syncing the fork with `upstream/main`
2. pushing a reviewed linear integration result
3. release preparation changes that belong on the maintained baseline

Not allowed as normal practice:

1. directly pushing day-to-day feature work
2. directly pushing bug fixes that have not gone through branch review
3. directly pushing fork-only operational tweaks mixed with unrelated shared changes

In practice, treat `main` as maintainer-controlled.

Recommended protection:

1. protect `main`
2. allow direct push only for a small maintainer group
3. require everyone else to use branches and PRs

## 4. Daily Development Flow

Start every change from a fresh sync:

```bash
git fetch upstream origin
git checkout main
git rebase upstream/main
git push --force-with-lease origin main
git checkout -b fix/some-change
```

Then:

1. implement the change on the working branch
2. keep upstreamable and fork-only commits separate
3. run verification locally
4. push the branch to `origin`
5. open a PR
6. merge only after CI passes and the change classification is still clear

If a feature depends on a prerequisite fix, use stacked commits or stacked PRs:

1. commit the prerequisite fix first
2. build the feature on top of it
3. keep each layer independently reviewable
4. upstream the layers separately when appropriate

## 5. Change Classification Rules

### Upstreamable by default

The following should usually be implemented in an upstreamable form:

- correctness fixes
- tests
- API compatibility updates
- docs clarifications
- performance or reliability improvements
- generally useful features

### Fork-only by exception

The following may stay fork-only, but must remain isolated:

- company-specific defaults
- private integrations
- environment-specific routing or policy
- branding
- deployment or operational workflows unique to this fork

Never mix upstreamable and fork-only changes in one commit when they can be separated.

## 6. Merge Strategy

Prefer rebase plus fast-forward style integration over merge bubbles.

Recommended rules:

1. rebase working branches onto the latest `main` before merge when practical
2. keep the final history reviewable and ordered by intent
3. avoid noisy merge commits on `main` unless there is a specific operational reason to keep them

The objective is not aesthetic purity. The objective is keeping the fork easy to compare, rebase, and upstream.

## 7. CI Policy

CI should be split by branch purpose.

### PR CI

Trigger on PRs from:

- `fix/*`
- `feat/*`
- `docs/*`
- `chore/*`
- `fork/*`

Required checks:

1. `pnpm lint`
2. `pnpm format:check`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Purpose:

1. validate the change before it reaches `main`
2. catch breakage early
3. enforce the minimum readiness bar for all routine development

### `main` CI

Trigger on updates to `main`.

Run:

1. the full required check set
2. package build verification
3. optional release dry-run tasks or artifact assembly validation

Purpose:

1. ensure `main` remains a healthy integration baseline
2. verify the fork can still be built and packaged after upstream syncs and merged changes

`main` CI proves integration readiness. It does not automatically mean production release approval.

## 8. CD Policy

CD should be explicit and separate from `main` integration.

Recommended release triggers:

1. push to `release/*`
2. creation of a release tag such as `v2026.4.10-lh.1`

Release jobs may include:

1. full verification
2. artifact packaging
3. checksum generation
4. runtime package creation
5. release note generation
6. deployment to the target OpenClaw environment

Do not auto-deploy every `main` update to production.

Reason:

1. this fork regularly syncs upstream
2. not every integration update is meant to be released immediately
3. deployment control must stay explicit for rollback and auditability

The correct separation is:

- development branches: validate candidate changes
- `main`: validate maintained integration baseline
- `release/*` or tags: authorize and execute actual release

## 9. Recommended Branch Protection

At minimum:

### `main`

1. protected branch
2. direct push limited to maintainers
3. CI required before merge where platform rules allow
4. no routine feature development directly on branch

### `release/*` or release tags

1. creation limited to maintainers
2. release pipeline permissions limited to maintainers
3. deployment credentials unavailable to ordinary development branches

## 10. Example End-to-End Paths

### A normal bug fix

1. sync `main` with `upstream/main`
2. create `fix/some-bug`
3. implement and test
4. push branch and open PR
5. pass PR CI
6. integrate into `main`
7. let `main` CI confirm integration health
8. include in a later release tag or `release/*` branch

### An upstreamable feature with a prerequisite fix

1. create `feat/some-feature`
2. commit `fix: ...` first
3. commit `feat: ...` second
4. push the full stack to `origin`
5. open internal PR for immediate fork use
6. open upstream PRs in dependency order
7. rebase after upstream merges when needed

### A fork-only deployment adaptation

1. create `fork/some-adaptation`
2. isolate the behavior behind configuration or a narrow file boundary
3. keep it separate from shared fixes
4. pass PR CI
5. integrate to `main`
6. ship only through explicit release flow

## 11. Operational Summary

Use this repository with the following mental model:

- `main` is allowed to move, but not as a casual development branch
- development happens on short-lived branches
- CI runs on both PRs and `main`
- CD runs only from explicit release controls
- upstreamability is the default design constraint

If a proposed workflow makes `main` hard to rebase, makes upstream PRs hard to prepare, or makes production release happen implicitly on every sync, it is the wrong workflow for this fork.
