# Runtime Package Deployment

This document defines the deployable artifact format for this fork.

## Why Runtime Packages

The raw npm tarball from `npm pack` is not sufficient for direct deployment on a company-managed OpenClaw instance.

This plugin keeps several dependencies external at runtime, including:

- `@larksuiteoapi/node-sdk`
- `openclaw`

So a deployment that only extracts the npm tarball into the extension directory can fail at startup with missing-module errors.

The reliable deployment artifact is therefore a **runtime package**:

1. unpack the npm tarball
2. install production dependencies into the unpacked `package/`
3. install the target OpenClaw runtime package version into the same `package/`
4. archive that prepared `package/` directory as a deployable runtime artifact

## Artifact Types

Every release may produce two artifact layers:

1. npm tarball
   Example: `larksuite-openclaw-lark-2026.4.1-lh.1.tgz`
2. runtime package
   Example: `openclaw-lark-runtime-2026.4.1-lh.1.tar.gz`

Operations should deploy the runtime package, not the raw npm tarball.

## Build a Runtime Package

Use the release script:

```bash
pnpm release -- --version 2026.4.1-lh.1 --upstream-base 2026.4.1 --openclaw-version 2026.3.31
```

This produces:

- npm tarball
- npm tarball SHA256
- runtime package
- runtime package SHA256
- release note scaffold
- release summary JSON

## Deploy a Runtime Package

Upload the runtime package to the target host, then deploy:

```bash
RUNTIME_TGZ=/tmp/openclaw-lark-runtime-2026.4.1-lh.1.tar.gz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$RUNTIME_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

Then restart or reload OpenClaw and run:

```text
/feishu start
/feishu doctor
```

## Rollback

Rollback uses the same procedure with the previous known-good runtime package, including the last known-good official runtime package.

Example:

```bash
RUNTIME_TGZ=/tmp/openclaw-lark-runtime-2026.4.1-official.tar.gz
TARGET_DIR=/path/to/openclaw/extensions/feishu
TMP_DIR=$(mktemp -d)

tar -xzf "$RUNTIME_TGZ" -C "$TMP_DIR"
rsync -a --delete "$TMP_DIR/package/" "$TARGET_DIR/"
```

## OpenClaw Version Matching

The runtime package should install the same OpenClaw package version that the target instance runs.

If the target instance runs:

```text
OpenClaw 2026.3.31
```

then the runtime package should be built with:

```bash
--openclaw-version 2026.3.31
```

Do not assume compatibility across arbitrary OpenClaw versions without verification.
