#!/bin/sh
set -eu

CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-/home/node/.openclaw/openclaw.json}"
DEV_CONFIG_PATH="/home/node/.openclaw-dev/openclaw.json"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Missing OpenClaw dev config at $CONFIG_PATH" >&2
  echo "Expected the generated dev config from scripts/run-feishu-dev.mjs." >&2
  exit 1
fi

mkdir -p /home/node/.openclaw /home/node/.openclaw-dev
cp "$CONFIG_PATH" "$DEV_CONFIG_PATH"

openclaw --dev plugins uninstall openclaw-lark --force >/dev/null 2>&1 || true
openclaw --dev plugins install /workspace --link
openclaw --dev plugins enable openclaw-lark

exec openclaw --dev gateway run --dev
