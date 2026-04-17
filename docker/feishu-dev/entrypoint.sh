#!/bin/sh
set -eu

CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-/home/node/.openclaw/openclaw.json}"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Missing OpenClaw dev config at $CONFIG_PATH" >&2
  echo "Expected the generated dev config from scripts/run-feishu-dev.mjs." >&2
  exit 1
fi

exec openclaw gateway run
