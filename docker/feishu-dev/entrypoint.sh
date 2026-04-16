#!/bin/sh
set -eu

CONFIG_PATH="/home/node/.openclaw-dev/openclaw.json"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Missing OpenClaw dev config at $CONFIG_PATH" >&2
  echo "Prepare .openclaw-dev.feishu.json in the repository before running pnpm dev:feishu." >&2
  exit 1
fi

openclaw --dev plugins uninstall openclaw-lark --force >/dev/null 2>&1 || true
openclaw --dev plugins install /workspace --link
openclaw --dev plugins enable openclaw-lark

exec openclaw --dev gateway run --dev
