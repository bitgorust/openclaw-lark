# Release Checklist

This checklist is for replacing the official `openclaw-lark` plugin on a company-managed OpenClaw instance with a fork release while preserving a clean rollback path.

## 1. Release Scope Freeze

- Confirm the production baseline version currently running on the target OpenClaw instance.
- Confirm the exact fork release target version, for example `2026.4.1-lh.1`.
- Record the upstream base version, for example `2026.4.1`.
- Record the release commit SHA.
- List the included `fix` and `feat` commits.
- Mark each included change as upstreamable, already upstreamed, pending upstream, or fork-only.
- Exclude unfinished or unverified changes from the release scope.

## 2. Preconditions

- Confirm Node `>=22` and `pnpm` `10.x` on the build host.
- Confirm the target OpenClaw version satisfies the plugin peer requirement in [package.json](/data/Workspace/openclaw-lark/package.json).
- Confirm the target deployment path for the plugin, typically `extensions/feishu`.
- Confirm the OpenClaw operator has restart or reload access for the target instance.
- Confirm the current official tarball or currently deployed plugin artifact has been archived.
- Confirm the previous known-good fork tarball is available if one exists.
- Confirm the deployment window, verifier, and rollback owner.

## 3. Verification Before Tagging

Run on the release commit:

```bash
pnpm release -- --version 2026.4.1-lh.1 --upstream-base 2026.4.1
```

If you must run steps manually, the minimum verification set is:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
npm pack
```

Record pass or explicit exception for:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `npm pack`

## 4. Pre-Production Functional Checks

Deploy the built tarball to a non-production or controlled validation instance using the artifact deployment flow from [DEPLOYMENT.md](/data/Workspace/openclaw-lark/DEPLOYMENT.md).

Required checks:

- `/feishu start` succeeds.
- `/feishu doctor` succeeds.
- DM message receive and reply succeeds.
- Group chat trigger works under expected policy.
- An already-authorized user can execute one user-identity tool path.
- An unauthorized user is guided into the expected authorization flow.
- One read scenario succeeds.
- One write scenario succeeds.
- One expected failure path returns a controlled error.

## 5. Release Outputs

For every production release, retain all of the following together:

- Git tag, for example `v2026.4.1-lh.1`
- Release tarball in `release/`
- SHA256 checksum file
- Release note
- Previous known-good fork tarball
- Last known-good official tarball

Store the release outputs in durable internal storage. Do not keep the only copy on a developer machine.

## 6. Deployment Window Checklist

- Announce the maintenance window.
- Confirm no concurrent plugin change is in progress.
- Confirm the exact tarball and checksum to deploy.
- Confirm the previous version and rollback tarball are present on the operator host.
- Record the deployment start time.

Deploy using the artifact flow:

```bash
VERSION_TGZ=./larksuite-openclaw-lark-2026.4.1-lh.1.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$VERSION_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw according to your instance procedure.

## 7. Immediate Post-Deploy Checks

- Verify the target instance now serves the intended plugin version.
- Run `/feishu start`.
- Run `/feishu doctor`.
- Run one DM smoke test.
- Run one authorized tool smoke test.
- Check OpenClaw logs for plugin load errors.
- Check recent Feishu API failures, authorization failures, and callback failures.

## 8. Monitoring During Rollout

Watch for at least 30 to 60 minutes:

- OpenClaw process restarts or crash loops
- Plugin load failures
- Message send or reply failures
- Elevated Feishu API 4xx or 5xx rates
- Elevated timeout rates
- Elevated OAuth or permission errors
- Card callback or event callback errors
- User-reported regressions in key business groups or DMs

## 9. Rollback Triggers

Roll back immediately if any of the following persists beyond the agreed observation window:

- `/feishu doctor` fails
- DM baseline messaging is broken
- A critical authorized tool path is broken
- Error rate or timeout rate exceeds the agreed threshold
- OpenClaw cannot reliably load the plugin
- A production-impacting regression is confirmed

## 10. Rollback Procedure

Redeploy the previous known-good tarball using the same artifact deployment process from [DEPLOYMENT.md](/data/Workspace/openclaw-lark/DEPLOYMENT.md).

```bash
OLD_TGZ=./larksuite-openclaw-lark-2026.4.1.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$OLD_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw and repeat the post-deploy checks.

## 11. Closeout

- Record the final outcome: success, rollback, or partial rollout.
- Record the final deployed version and artifact checksum.
- Link the release note, deployment record, and monitoring window.
- Record any incident, bug, or follow-up work created from the rollout.
- Update upstream tracking status for included changes.
