#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SUPPORTED_OPS_PATH = path.join(repoRoot, 'docs', 'reports', 'feishu', 'feishu-supported-operations.json');
const OUT_CANONICAL_JSON_PATH = path.join(repoRoot, 'docs', 'snapshots', 'feishu', 'feishu-official-security.json');

const SERVER_API_LIST_URL = 'https://open.feishu.cn/api/tools/server-side-api/list';
const SCOPE_LIST_URL = 'https://open.feishu.cn/api/tools/scope/list';

const DOC_PATH_EXCEPTIONS = {
  'POST:/open-apis/approval/v4/instances/add_sign': {
    docPath: '/server-docs/approval-v4/task/approval-task-addsign',
    reviewUrl: 'https://open.feishu.cn/document/server-docs/approval-v4/task/approval-task-addsign',
    reason: '主流程无法稳定从 catalog/fullPath 归一化得到该文档页，需显式绑定官方可审阅链接。',
  },
  'POST:/open-apis/approval/v4/instances/specified_rollback': {
    docPath: '/server-docs/approval-v4/task/specified_rollback',
    reviewUrl: 'https://open.feishu.cn/document/server-docs/approval-v4/task/specified_rollback',
    reason: '主流程无法稳定从 catalog/fullPath 归一化得到该文档页，需显式绑定官方可审阅链接。',
  },
};

function parseArgs(argv) {
  return { write: !argv.includes('--check') };
}

function normalizeEndpointLabel(label) {
  const value = String(label).trim();
  const match = value.match(/^([A-Z]+):(\/open-apis\/[^\s]+)/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function normalizeEndpointPattern(endpointKey) {
  return endpointKey
    .replace(/\$\{[^}]+\}/g, ':_')
    .replace(/:[A-Za-z0-9_]+/g, ':_');
}

function expandEndpointKeyCandidates(endpointKey) {
  const candidates = new Set([endpointKey]);
  if (endpointKey.includes(':/open-apis/drive/v1/export_tasks/file/')) {
    candidates.add(endpointKey.replace(':/open-apis/drive/v1/export_tasks/file/', ':/open-apis/drive/export_tasks/file/'));
  }
  return [...candidates];
}

function loadOfficialEndpoints() {
  const supportedOps = JSON.parse(fs.readFileSync(SUPPORTED_OPS_PATH, 'utf8'));
  const endpointKeys = new Set();
  for (const tool of supportedOps.tools ?? []) {
    for (const operation of tool.operations ?? []) {
      for (const backendLabel of operation.backend ?? []) {
        const endpointKey = normalizeEndpointLabel(backendLabel);
        if (endpointKey) endpointKeys.add(endpointKey);
      }
    }
  }
  return [...endpointKeys].sort();
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'openclaw-lark-official-security-metadata/1.0',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`fetch failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'openclaw-lark-official-security-metadata/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`fetch failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function getCanonicalDocPath(html) {
  const match = html.match(/<link rel="canonical" href="https:\/\/open\.feishu\.cn([^"]+)"/i);
  if (!match?.[1]) return null;
  return new URL(`https://open.feishu.cn${match[1]}`).pathname;
}

function normalizeDocPath(input) {
  if (!input) return null;
  if (input.startsWith('/server-docs/')) return input;
  if (input.startsWith('/document/')) return input.slice('/document'.length);
  return null;
}

function deriveServerDocsPath(input) {
  if (!input) return null;
  const match = input.match(/\/reference\/(.+)$/);
  if (!match?.[1]) return null;
  return `/server-docs/${match[1]}`;
}

function toReviewUrl(docPath) {
  return `https://open.feishu.cn${docPath.startsWith('/document') ? '' : '/document'}${docPath}`;
}

function toGetDetailCandidates(apiFullPath, canonicalPath, endpointKey) {
  const candidates = new Set();
  const normalizedCatalogPath = normalizeDocPath(apiFullPath);
  const exception = DOC_PATH_EXCEPTIONS[endpointKey];

  if (normalizedCatalogPath) candidates.add(normalizedCatalogPath);
  const derivedCatalogPath = deriveServerDocsPath(apiFullPath);
  if (derivedCatalogPath) candidates.add(derivedCatalogPath);
  if (canonicalPath) {
    const normalizedCanonicalPath = normalizeDocPath(canonicalPath) ?? canonicalPath;
    candidates.add(normalizedCanonicalPath);
    const derivedCanonicalPath = deriveServerDocsPath(canonicalPath);
    if (derivedCanonicalPath) candidates.add(derivedCanonicalPath);
  }
  if (exception?.docPath) candidates.add(exception.docPath);

  return [...candidates];
}

function classifyPayload(payload) {
  if (payload?.code !== 0 || !payload?.data) return 'invalid';
  const apiSchema = payload.data?.schema?.apiSchema;
  if (apiSchema?.path && apiSchema?.httpMethod) return 'full';
  if (typeof payload.data?.content === 'string' && payload.data.content.length > 0) return 'content-only';
  return 'invalid';
}

function unique(items) {
  return [...new Set(items.filter(Boolean))].sort();
}

function parseScopeNeedTypeFromContent(content) {
  if (!content) return 'all';
  if (content.includes('开启其中任意一项权限即可调用') || content.includes('开启任一权限即可')) return 'one';
  if (content.includes('开启所有权限')) return 'all';
  return 'all';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSectionBlock(content, sectionTitle) {
  if (!content) return '';
  const pattern =
    `<md-th[^>]*>[\\s\\S]*?${escapeRegExp(sectionTitle)}[\\s\\S]*?<\\/md-th>[\\s\\S]*?<md-td[^>]*>([\\s\\S]*?)<\\/md-td>[\\s\\S]*?<\\/md-tr>`;
  const match = content.match(new RegExp(pattern, 'i'));
  return match?.[1] ?? '';
}

function extractSectionPerms(content, sectionTitle) {
  const section = extractSectionBlock(content, sectionTitle);
  return unique(Array.from(section.matchAll(/<md-perm\s+name="([^"]+)"/g), (match) => match[1]));
}

function parseTokensFromContent(content) {
  const tokens = unique(Array.from(content.matchAll(/type="token-([^"]+)"/g), (match) => match[1]));
  return tokens.map((token) => {
    if (token === 'tenant') return 'tenant_access_token';
    if (token === 'user') return 'user_access_token';
    if (token === 'app') return 'app_access_token';
    return `${token}_access_token`;
  });
}

function parseContentSecurity(content) {
  return {
    requiredScopes: extractSectionPerms(content, '权限要求'),
    fieldRequiredScopes: extractSectionPerms(content, '字段权限要求'),
    supportedAccessToken: parseTokensFromContent(content),
    scopeNeedType: parseScopeNeedTypeFromContent(content),
  };
}

function buildSecurityFromPayload(payload) {
  const apiSchema = payload.data?.schema?.apiSchema;
  const security = apiSchema?.security;
  const content = payload.data?.content ?? '';
  const contentDerived = parseContentSecurity(content);

  if (security) {
    return {
      requiredScopes: unique(security.requiredScopes ?? []),
      fieldRequiredScopes: unique(security.fieldRequiredScopes ?? []),
      supportedAccessToken: unique(security.supportedAccessToken ?? []),
      supportedAppTypes: unique(security.supportedAppTypes ?? []),
      scopeNeedType: contentDerived.scopeNeedType,
    };
  }

  return {
    requiredScopes: contentDerived.requiredScopes,
    fieldRequiredScopes: contentDerived.fieldRequiredScopes,
    supportedAccessToken: contentDerived.supportedAccessToken,
    supportedAppTypes: [],
    scopeNeedType: contentDerived.scopeNeedType,
  };
}

function findUnknownScopes(scopes, knownScopes) {
  return unique(scopes.filter((scope) => !knownScopes.has(scope)));
}

function writeFileIfChanged(filePath, content, write) {
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (previous === content) return 'unchanged';
  if (!write) return 'different';
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return previous == null ? 'created' : 'updated';
}

function getEndpointServiceName(endpointKey) {
  const pathPart = endpointKey.split(':').slice(1).join(':');
  const segments = pathPart.split('/').filter(Boolean);
  const openApisIndex = segments.indexOf('open-apis');
  if (openApisIndex < 0) return 'unknown';
  return segments[openApisIndex + 1] ?? 'unknown';
}

function formatUnresolvedEndpoints(endpointKeys) {
  const groups = new Map();
  for (const endpointKey of endpointKeys) {
    const service = getEndpointServiceName(endpointKey);
    if (!groups.has(service)) groups.set(service, []);
    groups.get(service).push(endpointKey);
  }

  const lines = [
    `Skipped ${endpointKeys.length} endpoint(s) missing from ${SERVER_API_LIST_URL}:`,
  ];

  for (const service of [...groups.keys()].sort()) {
    const endpoints = groups.get(service).sort();
    lines.push(`- ${service} (${endpoints.length})`);
    for (const endpoint of endpoints) {
      lines.push(`  ${endpoint}`);
    }
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [apiListPayload, scopeListPayload] = await Promise.all([fetchJson(SERVER_API_LIST_URL), fetchJson(SCOPE_LIST_URL)]);
  const endpointKeys = loadOfficialEndpoints();

  const apiList = apiListPayload?.data?.apis ?? [];
  const apiListByNormalizedUrl = new Map();
  for (const api of apiList) {
    if (!api?.url) continue;
    const normalizedUrl = normalizeEndpointPattern(api.url);
    if (!apiListByNormalizedUrl.has(normalizedUrl)) {
      apiListByNormalizedUrl.set(normalizedUrl, api);
    }
  }
  const scopeItems = scopeListPayload?.data?.scopes ?? [];
  const knownScopes = new Set(scopeItems.map((item) => item.name).filter(Boolean));

  const records = [];
  const unresolvedEndpointKeys = [];
  for (const endpointKey of endpointKeys) {
    const api = expandEndpointKeyCandidates(endpointKey)
      .map((candidate) => apiList.find((item) => item.url === candidate) ?? apiListByNormalizedUrl.get(normalizeEndpointPattern(candidate)))
      .find(Boolean);
    if (!api) {
      unresolvedEndpointKeys.push(endpointKey);
      continue;
    }

    const html = await fetchText(`https://open.feishu.cn${api.fullPath}`);
    const canonicalPath = getCanonicalDocPath(html);
    const candidates = toGetDetailCandidates(api.fullPath, canonicalPath, endpointKey);

    let resolved = null;
    for (const candidate of candidates) {
      const url = `https://open.feishu.cn/document_portal/v1/document/get_detail?fullPath=${encodeURIComponent(candidate)}`;
      const payload = await fetchJson(url);
      const quality = classifyPayload(payload);
      if (quality === 'invalid') continue;
      resolved = { candidate, payload, quality };
      if (quality === 'full') break;
    }

    if (!resolved) {
      throw new Error(`unable to resolve document detail for ${endpointKey} (catalog path: ${api.fullPath})`);
    }

    const security = buildSecurityFromPayload(resolved.payload);
    const unknownRequiredScopes = findUnknownScopes(security.requiredScopes, knownScopes);
    const unknownFieldRequiredScopes = findUnknownScopes(security.fieldRequiredScopes, knownScopes);
    const exception = DOC_PATH_EXCEPTIONS[endpointKey];
    const normalizedCatalogPath = normalizeDocPath(api.fullPath);
    const normalizedCanonicalPath = normalizeDocPath(canonicalPath) ?? canonicalPath;
    let docPathSource = 'canonical';
    if (resolved.candidate === normalizedCatalogPath) {
      docPathSource = 'catalog';
    } else if (resolved.candidate === normalizedCanonicalPath) {
      docPathSource = 'canonical';
    } else if (exception?.docPath === resolved.candidate) {
      docPathSource = 'exception';
    }

    records.push({
      endpointKey,
      docPath: resolved.candidate,
      docPathSource,
      reviewUrl: exception?.reviewUrl ?? toReviewUrl(resolved.candidate),
      ...(exception?.reason ? { reviewReason: exception.reason } : {}),
      resolutionQuality: resolved.quality,
      scopeNeedType: security.scopeNeedType,
      requiredScopes: security.requiredScopes.filter((scope) => !unknownRequiredScopes.includes(scope)),
      fieldRequiredScopes: security.fieldRequiredScopes.filter((scope) => !unknownFieldRequiredScopes.includes(scope)),
      supportedAccessToken: security.supportedAccessToken,
      supportedAppTypes: security.supportedAppTypes,
    });
  }

  const renderedJson = `${JSON.stringify(Object.fromEntries(records.map((record) => [record.endpointKey, record])), null, 2)}\n`;
  const canonicalJsonStatus = writeFileIfChanged(OUT_CANONICAL_JSON_PATH, renderedJson, args.write);
  if (!args.write && canonicalJsonStatus === 'different') {
    throw new Error(
      [
        canonicalJsonStatus === 'different' ? path.relative(repoRoot, OUT_CANONICAL_JSON_PATH) : null,
      ]
        .filter(Boolean)
        .map((item) => `Generated file is out of date: ${item}`)
        .join('\n'),
    );
  }
  console.log(`${canonicalJsonStatus}: ${path.relative(repoRoot, OUT_CANONICAL_JSON_PATH)}`);
  if (unresolvedEndpointKeys.length > 0) {
    console.warn(formatUnresolvedEndpoints(unresolvedEndpointKeys));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
