# Plugin Change Request Template

Use this template for production release approval when deploying a forked `openclaw-lark` version to a company-managed OpenClaw instance.

## 1. Change Summary

- Change title:
- Change type: plugin release / upgrade / rollback / switch back to official
- Target instance:
- Maintenance window:
- Operator:
- Verifier:

## 2. Version Information

- Current production version:
- Target version:
- Upstream base version:
- Release commit SHA:
- Git tag:
- Tarball path:
- SHA256:

## 3. Scope

- Included fixes:
- Included features:
- Fork-only changes:
- Changes intentionally excluded from this release:
- Upstream status of included changes:

## 4. Risk Assessment

- User-facing impact:
- Main technical risks:
- Data or permission risk:
- Feishu callback or OAuth risk:
- Expected blast radius:

## 5. Preconditions

- Previous known-good fork tarball available: yes / no
- Last known-good official tarball available: yes / no
- OpenClaw restart or reload access confirmed: yes / no
- Feishu app configuration unchanged or verified: yes / no
- Validation environment result attached: yes / no

## 6. Validation Evidence

- `pnpm install --frozen-lockfile`:
- `pnpm lint`:
- `pnpm format:check`:
- `pnpm typecheck`:
- `pnpm test`:
- `pnpm build`:
- `npm pack`:
- `/feishu start` result:
- `/feishu doctor` result:
- DM smoke test result:
- Authorized tool smoke test result:

## 7. Deployment Procedure

```bash
VERSION_TGZ=<release tarball>
TARGET_DIR=<openclaw extensions/feishu path>
TMP_DIR=$(mktemp -d)

tar -xzf "$VERSION_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw according to the instance procedure.

## 8. Rollback Plan

- Rollback target version:
- Rollback tarball:
- Rollback trigger:
- Rollback owner:

Rollback command:

```bash
OLD_TGZ=<previous known-good tarball>
TARGET_DIR=<openclaw extensions/feishu path>
TMP_DIR=$(mktemp -d)

tar -xzf "$OLD_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw and rerun `/feishu start`, `/feishu doctor`, the DM smoke test, and the authorized tool smoke test.

## 9. Monitoring Plan

- Metrics or dashboards to watch:
- Log queries to watch:
- Observation window:
- Alert thresholds:
- Escalation contacts:

## 10. Approval Record

- Requester:
- Reviewer:
- Operations approver:
- Approval timestamp:
- Final outcome:
