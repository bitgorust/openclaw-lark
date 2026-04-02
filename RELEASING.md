# Fork Release Process

This document defines the minimum viable release process for this fork. The goal is simple: every deployed version must be reproducible, traceable, easy to roll back, and easy to compare with upstream.

## Release Principles

1. Release artifacts, not ad-hoc working trees.
2. Keep the fork version visibly tied to its upstream base.
3. Every release must have a matching git tag, tarball, and short release note.
4. Rollback must reuse a previously published artifact, not rebuild from memory.

## Version Scheme

Use the upstream version plus a fork suffix:

- upstream: `2026.3.30`
- fork first release on that base: `2026.3.30-lh.1`
- next fork release on same upstream base: `2026.3.30-lh.2`

When rebasing to a newer upstream version, restart the fork suffix:

- `2026.4.10-lh.1`

## Required Release Outputs

Every release must produce all of the following:

1. git tag: `v2026.3.30-lh.1`
2. npm-style tarball from `npm pack`
3. short release note with:
   - version
   - upstream base
   - commit SHA
   - notable fork-only changes
   - upstreamable changes already proposed or still pending

## Release Branch Flow

1. sync `main` with `upstream/main`
2. finish the release changes on a short-lived branch
3. merge to `main`
4. update `package.json` version to the fork release version
5. build, test, and pack
6. tag the release commit
7. publish the tarball to artifact storage
8. deploy from that exact artifact

## Build and Verification

Run the standard verification set before tagging:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
npm pack
```

If a verification step cannot run in the release environment, record that explicitly in the release note.

## Artifact Naming

Keep artifact names predictable and version-first. Example:

```text
larksuite-openclaw-lark-2026.3.30-lh.1.tgz
```

Store artifacts in a durable internal location such as:

- GitLab Release assets
- internal object storage
- CI artifact retention with long retention and mirrored backup

Do not rely on a developer laptop as the only copy.

## Release Note Template

Use a short structured note for every release:

```text
Version: 2026.3.30-lh.1
Upstream base: 2026.3.30
Commit: <sha>

Included:
- fix: ...
- feat: ...

Fork-only:
- ...

Upstream status:
- PR opened / not yet proposed / already merged upstream

Verification:
- lint: pass
- typecheck: pass
- test: pass
- build: pass
```

## Deployment Inputs

Operations should only need these inputs:

1. target OpenClaw instance
2. release tarball
3. release note
4. previous known-good tarball

That is enough to install, update, or roll back using [DEPLOYMENT.md](/data/Workspace/openclaw-lark/DEPLOYMENT.md).

## Rollback Policy

For each deployed release, retain at least:

- current release tarball
- previous release tarball
- last known-good official release tarball

Rollback should be tested procedurally, not assumed.

## Upstream Tracking

Each release note should state which changes are:

- already merged upstream
- proposed upstream
- intentionally fork-only

This keeps the fork from silently accumulating unowned divergence.

## What Not to Build Yet

Do not build a fork installer until the artifact release process is stable. The installer is optional convenience; the release artifact is the real control point.

The correct order is:

1. stable version scheme
2. stable artifact build
3. stable deployment and rollback
4. only then, optional fork installer
