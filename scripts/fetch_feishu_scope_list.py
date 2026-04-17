#!/usr/bin/env python3

import argparse
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCOPE_URL = 'https://open.feishu.cn/api/tools/scope/list'
OUT_JSON = ROOT / 'docs' / 'snapshots' / 'feishu' / 'feishu-scope-list.json'


def fetch_scope_list() -> dict:
  req = urllib.request.Request(
    SCOPE_URL,
    headers={
      'User-Agent': 'openclaw-lark-scope-list-fetcher/1.0',
      'Accept': 'application/json',
    },
  )
  with urllib.request.urlopen(req, timeout=30) as response:
    return json.load(response)


def main() -> int:
  parser = argparse.ArgumentParser(description='Fetch the Feishu scope list from the Open Platform docs backend.')
  parser.add_argument('--check', action='store_true', help='Validate that the checked-in JSON snapshot exists and is valid.')
  parser.add_argument('--pretty', action='store_true', help='Pretty-print JSON output when writing to stdout.')
  parser.add_argument('--stdout', action='store_true', help='Print the fetched JSON instead of writing the repo snapshot.')
  args = parser.parse_args()

  if args.check:
    if not OUT_JSON.exists():
      print(f'Missing scope list snapshot: {OUT_JSON}', file=sys.stderr)
      return 1

    try:
      json.loads(OUT_JSON.read_text('utf8'))
    except json.JSONDecodeError as exc:
      print(f'Invalid scope list snapshot: {OUT_JSON} ({exc})', file=sys.stderr)
      return 1
    return 0

  payload = fetch_scope_list()
  rendered = json.dumps(payload, ensure_ascii=False, indent=2 if args.pretty else None)

  if args.stdout:
    print(rendered)
    return 0

  expected = f'{rendered}\n'
  OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
  OUT_JSON.write_text(expected, encoding='utf8')
  print(f'Wrote {OUT_JSON.relative_to(ROOT)}')
  return 0


if __name__ == '__main__':
  try:
    raise SystemExit(main())
  except KeyboardInterrupt:
    print('interrupted', file=sys.stderr)
    raise SystemExit(130)
