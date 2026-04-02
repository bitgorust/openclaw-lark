# Development Readiness

This document defines the minimum readiness standard for ongoing fix and feature work in this fork.

## Current Development Priorities

1. keep closing correctness and API-compatibility fixes
2. start the first new feature from `feishu-approval`
3. preserve upstreamability for shared improvements
4. isolate fork-only operational behavior when unavoidable

## Definition of Ready

A change is ready to start only if all of the following are clear:

1. the change is classified as upstreamable or fork-only
2. the target user scenario is written down
3. the Feishu API or MCP surface has been identified
4. the expected test scope is known
5. the release impact is known

## Definition of Done

A change is done only if all of the following are true:

1. code is implemented
2. user-facing docs or skill guidance are updated if behavior changed
3. tests are added or updated for the changed path
4. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass, or gaps are explicitly recorded
5. the change is still cleanly upstreamable, or the fork-only reason is documented

## Daily Development Flow

```bash
git fetch upstream origin
git checkout main
git rebase upstream/main
git checkout -b fix/some-change
```

Then implement, verify, and keep commits separated by concern:

- bug fix commits
- test commits if useful
- fork-only adaptation commits only when necessary

If a feature depends on a prerequisite fix, keep the change stack layered instead of waiting for upstream merge:

- commit the fix first
- build the feature on top of the fix
- keep the fix independently upstreamable
- submit upstream as stacked PRs when appropriate

## CI Gates

Both repository-hosted CI definitions should stay aligned:

- GitHub Actions: `.github/workflows/ci.yml`
- GitLab CI: `.gitlab-ci.yml`

Required checks:

- lint
- format check
- typecheck
- test
- build

Special rule for `.gitlab-ci.yml`:

- if `.gitlab-ci.yml` is changed, do not commit it until the user confirms they have run GitLab Web CI Lint against the final content
- local compatibility checks may help, but they do not replace GitLab Web CI Lint for our GitLab CE 11.6.x environment

## First Feature Track: `feishu-approval`

The first new feature should be implemented in this order:

1. OAPI tool support for approval instances and approval tasks
2. focused tests for request shaping and result normalization
3. user-facing skill guidance
4. rollout docs and release note entry

The detailed scope is documented in [FEISHU_APPROVAL_PLAN.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_PLAN.md).

## Key References

- [MAINTAINING.md](/data/Workspace/openclaw-lark/MAINTAINING.md)
- [RELEASING.md](/data/Workspace/openclaw-lark/RELEASING.md)
- [DEPLOYMENT.md](/data/Workspace/openclaw-lark/DEPLOYMENT.md)
- [WORKFLOWS.md](/data/Workspace/openclaw-lark/WORKFLOWS.md)
