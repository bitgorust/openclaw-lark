# Fork Deployment and Version Switching

This fork does not change the plugin's business usage flow in Feishu. End-user usage should continue to follow the official guide:

- https://bytedance.larkoffice.com/docx/MFK7dDFLFoVlOGxWCv5cTXKmnMh

What this fork changes is the deployment source of the plugin on our company-managed OpenClaw instance.

The release policy for producing those deployable fork artifacts is documented in [RELEASING.md](/data/Workspace/openclaw-lark/RELEASING.md).

## Important Constraint

The current package is still wired to the official installer path:

- [`package.json`](/data/Workspace/openclaw-lark/package.json) sets `openclaw.install.npmSpec` to `@larksuite/openclaw-lark`
- [`bin/openclaw-lark.js`](/data/Workspace/openclaw-lark/bin/openclaw-lark.js) forwards to `@larksuite/openclaw-lark-tools`

So `npx -y @larksuite/openclaw-lark install/update` can only install official releases. Publishing this fork as-is under another npm scope does not automatically create a working fork installer.

## Supported Deployment Modes

### 1. Recommended: Artifact Deployment to the OpenClaw Extension Directory

Use a built release artifact and deploy it into the plugin directory used by OpenClaw. This package declares the target local path as `extensions/feishu`.

Release on CI or a build host:

```bash
pnpm install
pnpm build
npm pack
```

This produces a tarball such as:

```bash
larksuite-openclaw-lark-2026.3.30.tgz
```

Deploy a fork version to the OpenClaw instance:

```bash
VERSION_TGZ=./larksuite-openclaw-lark-2026.3.30-lh.1.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$VERSION_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload the OpenClaw instance and verify with:

```text
/feishu start
/feishu doctor
```

### 2. Optional Later: Internal Installer Package

If we want the same one-line experience as the official package, we need to build and publish our own installer wrapper and point it at our own tools package. That does not exist in this fork today.

## Versioning Policy

Use a version string that preserves the upstream base version and adds a fork suffix.

Examples:

- official upstream: `2026.3.30`
- our fork: `2026.3.30-lh.1`
- next fork patch on same upstream base: `2026.3.30-lh.2`

This makes rollback and upstream comparison straightforward.

## Install a Specific Fork Version

1. Build or retrieve the exact tarball for the desired fork release.
2. Deploy it into `extensions/feishu`.
3. Restart or reload OpenClaw.
4. Run `/feishu start` and `/feishu doctor`.

## Update to a Newer Fork Version

Use the same deployment procedure with a newer tarball.

```bash
NEW_TGZ=./larksuite-openclaw-lark-2026.4.02-lh.1.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$NEW_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw and rerun health checks.

## Roll Back to an Older Fork Version

Keep previous tarballs or extracted release directories. Rollback is just redeploying the previous known-good artifact to the same target directory.

```bash
OLD_TGZ=./larksuite-openclaw-lark-2026.3.30-lh.1.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$OLD_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Because the deployment is artifact-based, rollback does not depend on npm registry state at rollback time.

## Switch Back to an Official Version

Two clean ways exist.

### Option A: Deploy the Official Tarball the Same Way

Fetch or build the official package tarball for the target version, then deploy it to the same `extensions/feishu` directory.

Example:

```bash
npm pack @larksuite/openclaw-lark@2026.3.30
OFFICIAL_TGZ=./larksuite-openclaw-lark-2026.3.30.tgz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$OFFICIAL_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

### Option B: Re-adopt the Official Installer Flow

If you intentionally want the instance back on the official distribution track, use the official installer and let it manage future updates:

```bash
npx -y @larksuite/openclaw-lark install
```

For a pinned official installer/tool version:

```bash
npx -y @larksuite/openclaw-lark --tools-version 2026.3.30 install
```

Use this only when the goal is to move the instance back to official release management, not when preserving fork deployment control.

## Operational Checklist

For every install, update, rollback, or switch:

1. record the exact deployed version and source artifact
2. keep the previous known-good artifact
3. restart or reload OpenClaw cleanly
4. run `/feishu start`
5. run `/feishu doctor`
6. verify one DM scenario and one authorized tool scenario

## Recommendation

For this fork, the safest current workflow is:

1. release tarball artifacts for every fork version
2. deploy by replacing `extensions/feishu`
3. keep official and fork releases both as artifacts
4. switch versions only through explicit artifact deployment

That keeps the fork fully controllable, rollback-friendly, and separate from the official installer path.
