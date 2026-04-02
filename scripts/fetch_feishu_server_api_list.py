#!/usr/bin/env python3

import argparse
import json
import sys
import urllib.request

API_URL = 'https://open.feishu.cn/api/tools/server-side-api/list'


def fetch_api_list() -> dict:
  req = urllib.request.Request(
    API_URL,
    headers={
      'User-Agent': 'openclaw-lark-api-list-fetcher/1.0',
      'Accept': 'application/json',
    },
  )
  with urllib.request.urlopen(req, timeout=30) as response:
    return json.load(response)


def build_compact_items(payload: dict) -> list[dict]:
  apis = payload.get('data', {}).get('apis', [])
  return [
    {
      'name': api.get('name'),
      'url': api.get('url'),
      'bizTag': api.get('bizTag'),
      'project': api.get('meta', {}).get('Project'),
      'resource': api.get('meta', {}).get('Resource'),
      'version': api.get('meta', {}).get('Version'),
      'supportAppTypes': api.get('supportAppTypes'),
      'doc': api.get('fullPath'),
    }
    for api in apis
  ]


def main() -> int:
  parser = argparse.ArgumentParser(description='Fetch the Feishu server API list from the Open Platform docs backend.')
  parser.add_argument('--raw', action='store_true', help='Print the raw JSON response.')
  parser.add_argument('--count-only', action='store_true', help='Print only the API count.')
  parser.add_argument('--pretty', action='store_true', help='Pretty-print JSON output.')
  args = parser.parse_args()

  payload = fetch_api_list()
  apis = payload.get('data', {}).get('apis', [])

  if args.count_only:
    print(len(apis))
    return 0

  if args.raw:
    print(json.dumps(payload, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0

  output = {
    'count': len(apis),
    'source': API_URL,
    'apis': build_compact_items(payload),
  }
  print(json.dumps(output, ensure_ascii=False, indent=2 if args.pretty else None))
  return 0


if __name__ == '__main__':
  try:
    raise SystemExit(main())
  except KeyboardInterrupt:
    print('interrupted', file=sys.stderr)
    raise SystemExit(130)
