#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const FALLBACK_NODE_SDK_CANDIDATES = [
  path.resolve(repoRoot, '../node-sdk'),
  path.resolve(repoRoot, '../../../Workspace/github/node-sdk'),
  path.resolve(repoRoot, '../github/node-sdk'),
  path.resolve(repoRoot, '../../github/node-sdk'),
  path.resolve(repoRoot, '../../../github/node-sdk'),
].filter(Boolean);

const SUPPORTED_OPS_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-supported-operations.json');
const OUT_JSON_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-canonical-metadata.json');
const OUT_MD_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-canonical-metadata.md');
const OUT_TS_SCOPE_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-scopes.ts');
const OUT_TS_AUTH_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-auth.ts');

const COVERAGE_BUCKET_PRIORITY = ['items', 'historyItems', 'legacyItems', 'oldItems'];

const TOOL_ACTION_ALIASES = {
  'feishu_chat_members.default': 'feishu_chat_members.list_members',
  'feishu_create_doc.default': 'feishu_create_doc.create-doc',
  'feishu_fetch_doc.default': 'feishu_fetch_doc.fetch-doc',
  'feishu_get_user.default': 'feishu_get_user.get',
  'feishu_im_user_fetch_resource.default': 'feishu_im_user_fetch_resource.download_resource',
  'feishu_im_user_get_messages.default': 'feishu_im_user_get_messages.list_messages',
  'feishu_im_user_search_messages.default': 'feishu_im_user_search_messages.search_messages',
  'feishu_search_user.default': 'feishu_search_user.search',
  'feishu_update_doc.default': 'feishu_update_doc.update-doc',
};

const NON_CANONICAL_BACKEND_LABELS = new Map([
  ['MCP:create-doc', 'remote-mcp-capability'],
  ['MCP:fetch-doc', 'remote-mcp-capability'],
  ['MCP:update-doc', 'remote-mcp-capability'],
  ['OAuth revoke (plugin-managed UAT storage)', 'plugin-managed-auth-flow'],
  ['OAuth device flow', 'plugin-managed-auth-flow'],
  ['CardKit message send + callback handling', 'plugin-managed-interaction-flow'],
  ['POST:/open-apis/im/v1/chat_p2p/batch_query', 'local-composite-http-flow'],
  ['POST:/open-apis/search/v2/message/create', 'local-composite-http-flow'],
  ['POST:/open-apis/im/v1/chats/batch_query', 'local-composite-http-flow'],
  ['GET:/open-apis/im/v1/messages/mget', 'local-composite-http-flow'],
]);

function parseArgs(argv) {
  const args = {
    nodeSdkRoot: null,
    write: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--node-sdk-root' && value) {
      args.nodeSdkRoot = path.resolve(value);
      i += 1;
    } else if (arg === '--check') {
      args.write = false;
    }
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

function isNodeSdkRoot(candidate) {
  if (!candidate) return false;
  const requiredFile = path.join(
    candidate,
    'doc',
    'feishu-coverage',
    'canonical',
    'service-api-required-scopes.json',
  );
  return fs.existsSync(requiredFile);
}

function resolveNodeSdkRoot(explicitRoot) {
  const configuredRoot = explicitRoot ?? process.env.NODE_SDK_ROOT ?? null;
  if (configuredRoot) {
    if (!isNodeSdkRoot(configuredRoot)) {
      throw new Error(
        `Configured node-sdk root is invalid: ${configuredRoot}. ` +
          'Expected canonical artifacts under doc/feishu-coverage/canonical/.',
      );
    }

    return {
      root: configuredRoot,
      source: explicitRoot ? 'cli' : 'env',
    };
  }

  for (const candidate of FALLBACK_NODE_SDK_CANDIDATES) {
    if (isNodeSdkRoot(candidate)) {
      return {
        root: candidate,
        source: 'fallback',
      };
    }
  }

  throw new Error(
    'Unable to locate node-sdk canonical artifacts. ' +
      'Set NODE_SDK_ROOT or pass --node-sdk-root to the larksuite-node-sdk checkout. ' +
      `Fallback candidates checked: ${FALLBACK_NODE_SDK_CANDIDATES.join(', ') || '(none)'}`,
  );
}

function normalizeBackendLabel(label) {
  const raw = String(label).trim();
  const match = raw.match(/^([A-Z]+):(.+)$/);
  if (!match) return null;
  const method = match[1];
  let endpointPath = match[2].trim();
  const annotationIndex = endpointPath.indexOf(' (');
  if (annotationIndex >= 0) {
    endpointPath = endpointPath.slice(0, annotationIndex).trim();
  }
  return {
    endpointKey: `${method} ${endpointPath}`,
    httpMethod: method,
    path: endpointPath,
  };
}

function classifyNonCanonicalBackendLabel(label) {
  return NON_CANONICAL_BACKEND_LABELS.get(String(label).trim()) ?? null;
}

function canonicalizePathParams(endpointPath) {
  return endpointPath.replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
    if (!name.includes('_')) return `:${name}`;
    const camelName = name.replace(/_([a-zA-Z0-9])/g, (_m, c) => c.toUpperCase());
    return `:${camelName}`;
  });
}

function expandCandidatePaths(endpointPath) {
  const normalized = canonicalizePathParams(endpointPath);
  const candidates = new Set([endpointPath, normalized]);

  if (normalized.includes('/open-apis/drive/v1/export_tasks/file/')) {
    candidates.add(normalized.replace('/open-apis/drive/v1/export_tasks/file/', '/open-apis/drive/export_tasks/file/'));
  }

  return Array.from(candidates);
}

function buildEndpointCandidates(parsed) {
  return expandCandidatePaths(parsed.path).map((candidatePath) => ({
    endpointKey: `${parsed.httpMethod} ${candidatePath}`,
    httpMethod: parsed.httpMethod,
    path: candidatePath,
  }));
}

function authModeFromTokenTypes(tokenTypes) {
  const set = new Set((tokenTypes ?? []).filter(Boolean));
  const hasUser = set.has('user_access_token');
  const hasTenant = set.has('tenant_access_token');
  if (hasUser && hasTenant) return 'dual-mode';
  if (hasUser) return 'user-only';
  if (hasTenant) return 'tenant-only';
  return 'unknown';
}

function compareDeclaredAuthToCanonical(declaredAuth, canonicalAuthModes) {
  const set = new Set(canonicalAuthModes.filter((mode) => mode && mode !== 'unknown'));
  if (set.size === 0) {
    return { status: 'unknown', reason: 'canonical auth mode unresolved' };
  }

  if (declaredAuth === 'dual') {
    if (set.size === 1 && set.has('dual-mode')) {
      return { status: 'aligned', reason: 'declared dual matches canonical dual-mode' };
    }
    if (set.has('user-only') || set.has('tenant-only')) {
      return { status: 'broader-than-canonical', reason: 'declared dual is broader than canonical single-mode' };
    }
  }

  if (declaredAuth === 'user') {
    if (set.size === 1 && set.has('user-only')) {
      return { status: 'aligned', reason: 'declared user matches canonical user-only' };
    }
    if (set.has('dual-mode')) {
      return { status: 'narrower-than-canonical', reason: 'declared user is narrower than canonical dual-mode' };
    }
    if (set.size === 1 && set.has('tenant-only')) {
      return { status: 'mismatch', reason: 'declared user conflicts with canonical tenant-only' };
    }
  }

  if (declaredAuth === 'tenant') {
    if (set.size === 1 && set.has('tenant-only')) {
      return { status: 'aligned', reason: 'declared tenant matches canonical tenant-only' };
    }
    if (set.has('dual-mode')) {
      return { status: 'narrower-than-canonical', reason: 'declared tenant is narrower than canonical dual-mode' };
    }
    if (set.size === 1 && set.has('user-only')) {
      return { status: 'mismatch', reason: 'declared tenant conflicts with canonical user-only' };
    }
  }

  return { status: 'not-applicable', reason: `declared auth ${declaredAuth} not compared` };
}

function normalizeSdkApiPath(apiPath) {
  return String(apiPath).replace(/^\$\{this\.domain\}/, '');
}

function makeCanonicalIndexes(requiredScopesDoc, definitionsDoc, sdkSummaryDoc, coverageDoc) {
  const requiredByEndpoint = new Map();
  for (const item of requiredScopesDoc.items ?? []) {
    requiredByEndpoint.set(item.endpointKey, item);
  }

  const definitionsByEndpoint = new Map();
  for (const item of definitionsDoc.items ?? []) {
    definitionsByEndpoint.set(item.endpointKey, item);
  }

  const sdkByEndpoint = new Map();
  for (const item of sdkSummaryDoc.canonicalGeneratedApiMethods ?? []) {
    const endpointKey = `${item.httpMethod} ${normalizeSdkApiPath(item.apiPath)}`;
    if (!sdkByEndpoint.has(endpointKey)) sdkByEndpoint.set(endpointKey, []);
    sdkByEndpoint.get(endpointKey).push(item);
  }

  const coverageByEndpoint = new Map();
  const coverageByEndpointAll = new Map();
  for (const bucket of COVERAGE_BUCKET_PRIORITY) {
    for (const item of coverageDoc[bucket] ?? []) {
      if (!coverageByEndpointAll.has(item.endpointKey)) {
        coverageByEndpointAll.set(item.endpointKey, []);
      }
      coverageByEndpointAll.get(item.endpointKey).push({
        ...item,
        coverageBucket: bucket,
      });

      if (!coverageByEndpoint.has(item.endpointKey)) {
        coverageByEndpoint.set(item.endpointKey, {
          ...item,
          coverageBucket: bucket,
        });
      }
    }
  }

  return { requiredByEndpoint, definitionsByEndpoint, sdkByEndpoint, coverageByEndpoint, coverageByEndpointAll };
}

function buildMetadata({ supportedOpsDoc, requiredScopesDoc, definitionsDoc, sdkSummaryDoc, coverageDoc, nodeSdkRoot }) {
  const { requiredByEndpoint, definitionsByEndpoint, sdkByEndpoint, coverageByEndpoint } = makeCanonicalIndexes(
    requiredScopesDoc,
    definitionsDoc,
    sdkSummaryDoc,
    coverageDoc,
  );

  const items = [];
  let matchedBackendCount = 0;
  let unmatchedBackendCount = 0;
  let nonCanonicalBackendCount = 0;
  let mismatchCount = 0;

  for (const tool of supportedOpsDoc.tools ?? []) {
    for (const operation of tool.operations ?? []) {
      const declaredAuth = operation.auth ?? tool.auth;
      const backends = [];
      const canonicalAuthModes = [];

      for (const backendLabel of operation.backend ?? []) {
        const nonCanonicalClass = classifyNonCanonicalBackendLabel(backendLabel);
        const parsed = normalizeBackendLabel(backendLabel);
        if (!parsed) {
          if (nonCanonicalClass) {
            backends.push({
              backendLabel,
              matched: false,
              nonCanonical: true,
              nonCanonicalClass,
              reason: `non-canonical backend: ${nonCanonicalClass}`,
            });
            nonCanonicalBackendCount += 1;
            continue;
          }

          backends.push({
            backendLabel,
            matched: false,
            reason: 'unparseable backend label',
          });
          unmatchedBackendCount += 1;
          continue;
        }

        const endpointCandidates = buildEndpointCandidates(parsed);
        let matchedCandidate = null;
        let required = null;
        let definition = null;
        let coverage = null;
        let sdkMethods = [];

        for (const candidate of endpointCandidates) {
          const candidateRequired = requiredByEndpoint.get(candidate.endpointKey);
          const candidateDefinition = definitionsByEndpoint.get(candidate.endpointKey);
          const candidateCoverage = coverageByEndpoint.get(candidate.endpointKey);
          const candidateSdkMethods = sdkByEndpoint.get(candidate.endpointKey) ?? [];

          if (candidateRequired || candidateDefinition || candidateCoverage || candidateSdkMethods.length > 0) {
            matchedCandidate = candidate;
            required = candidateRequired ?? null;
            definition = candidateDefinition ?? null;
            coverage = candidateCoverage ?? null;
            sdkMethods = candidateSdkMethods;
            break;
          }
        }

        if (!matchedCandidate) {
          if (nonCanonicalClass) {
            backends.push({
              backendLabel,
              endpointKey: parsed.endpointKey,
              matched: false,
              nonCanonical: true,
              nonCanonicalClass,
              reason: `non-canonical backend: ${nonCanonicalClass}`,
            });
            nonCanonicalBackendCount += 1;
            continue;
          }

          backends.push({
            backendLabel,
            endpointKey: parsed.endpointKey,
            matched: false,
            reason: 'endpoint not found in canonical artifacts',
          });
          unmatchedBackendCount += 1;
          continue;
        }

        const tokenTypes =
          required?.tokenTypes ??
          definition?.tokenTypes ??
          coverage?.tokenTypes ??
          [];
        const authMode = authModeFromTokenTypes(tokenTypes);
        canonicalAuthModes.push(authMode);

        const matchSource = required || definition ? 'canonical-primary' : coverage ? 'canonical-coverage-fallback' : 'sdk-only';
        const normalizedMatch =
          matchedCandidate.endpointKey !== parsed.endpointKey || matchedCandidate.path !== parsed.path;

        backends.push({
          backendLabel,
          endpointKey: matchedCandidate.endpointKey,
          matched: true,
          matchSource,
          normalizedMatch,
          requestedEndpointKey: parsed.endpointKey,
          path: matchedCandidate.path,
          httpMethod: matchedCandidate.httpMethod,
          markdownUrl: required?.markdownUrl ?? definition?.markdownUrl ?? coverage?.markdownUrl ?? null,
          project: required?.project ?? definition?.project ?? coverage?.project ?? null,
          resource: required?.resource ?? definition?.resource ?? coverage?.resource ?? null,
          methodName: required?.methodName ?? definition?.methodName ?? coverage?.methodName ?? null,
          tokenTypes,
          canonicalAuthMode: authMode,
          requiredScopeNames:
            required?.requiredScopeNames ??
            definition?.requiredScopeNames ??
            coverage?.requiredScopeNames ??
            [],
          sdkMethods:
            required?.sdkCoverage?.sdkMethods ??
            definition?.sdkCoverage?.sdkMethods ??
            coverage?.sdkCoverage?.sdkMethods ??
            sdkMethods.map((item) => item.canonicalClientPath),
          coverageBucket: coverage?.coverageBucket ?? null,
        });
        matchedBackendCount += 1;
      }

      const authComparison = compareDeclaredAuthToCanonical(declaredAuth, canonicalAuthModes);
      if (authComparison.status === 'mismatch') {
        mismatchCount += 1;
      }

      items.push({
        tool: tool.tool,
        category: tool.category,
        transport: tool.transport,
        declaredAuth,
        declaredToolAuth: tool.auth,
        source: tool.source,
        operation: operation.name,
        summary: operation.summary,
        backendCount: backends.length,
        matchedBackendCount: backends.filter((backend) => backend.matched).length,
        canonicalAuthModes: Array.from(new Set(canonicalAuthModes.filter(Boolean))),
        authComparison,
        backends,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourcePriority: [
      'official Feishu contract via node-sdk canonical artifacts',
      'openclaw-lark public supported operation surface',
    ],
    references: {
      nodeSdkRoot,
      supportedOperations: path.relative(repoRoot, SUPPORTED_OPS_PATH),
      canonicalRequiredScopes: path.relative(
        nodeSdkRoot,
        path.join(nodeSdkRoot, 'doc', 'feishu-coverage', 'canonical', 'service-api-required-scopes.json'),
      ),
      canonicalDefinitions: path.relative(
        nodeSdkRoot,
        path.join(nodeSdkRoot, 'doc', 'feishu-coverage', 'canonical', 'service-api-definitions.json'),
      ),
      canonicalSdkInventory: path.relative(
        nodeSdkRoot,
        path.join(nodeSdkRoot, 'doc', 'api-inventory', 'canonical', 'summary.json'),
      ),
      canonicalCoverage: path.relative(
        nodeSdkRoot,
        path.join(nodeSdkRoot, 'doc', 'feishu-coverage', 'canonical', 'service-api-coverage.json'),
      ),
    },
    summary: {
      toolCount: supportedOpsDoc.totals?.toolCount ?? null,
      operationCount: supportedOpsDoc.totals?.operationCount ?? items.length,
      matchedBackendCount,
      unmatchedBackendCount,
      nonCanonicalBackendCount,
      mismatchCount,
    },
    items,
  };
}

function renderMarkdown(metadata) {
  const lines = [];
  lines.push('# Feishu Canonical Metadata');
  lines.push('');
  lines.push('This file is generated from:');
  lines.push('');
  lines.push(`- \`${metadata.references.supportedOperations}\``);
  lines.push(`- \`${metadata.references.canonicalRequiredScopes}\``);
  lines.push(`- \`${metadata.references.canonicalDefinitions}\``);
  lines.push(`- \`${metadata.references.canonicalSdkInventory}\``);
  lines.push(`- \`${metadata.references.canonicalCoverage}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Generated at: ${metadata.generatedAt}`);
  lines.push(`- Operations: ${metadata.summary.operationCount}`);
  lines.push(`- Matched backends: ${metadata.summary.matchedBackendCount}`);
  lines.push(`- Unmatched canonical backends: ${metadata.summary.unmatchedBackendCount}`);
  lines.push(`- Non-canonical local backends: ${metadata.summary.nonCanonicalBackendCount}`);
  lines.push(`- Declared-auth mismatches: ${metadata.summary.mismatchCount}`);
  lines.push('');
  lines.push('## Auth Comparison');
  lines.push('');
  lines.push('| Tool | Operation | Declared Auth | Canonical Auth Modes | Comparison | Notes |');
  lines.push('|---|---|---|---|---|---|');
  for (const item of metadata.items) {
    lines.push(
      `| \`${item.tool}\` | \`${item.operation}\` | \`${item.declaredAuth}\` | \`${item.canonicalAuthModes.join(', ') || 'unknown'}\` | \`${item.authComparison.status}\` | ${item.authComparison.reason} |`,
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function escapeTsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderGeneratedToolScopes(metadata) {
  const scopesByMetadataAction = new Map();
  for (const item of metadata.items) {
    const key = `${item.tool}.${item.operation}`;
    const scopes = Array.from(
      new Set(
        item.backends
          .filter((backend) => backend.matched)
          .flatMap((backend) => backend.requiredScopeNames ?? [])
          .filter(Boolean),
      ),
    ).sort();

    if (scopes.length > 0) {
      scopesByMetadataAction.set(key, scopes);
    }
  }

  const generatedEntries = [];
  for (const [targetKey, sourceKey] of Object.entries(TOOL_ACTION_ALIASES)) {
    const scopes = scopesByMetadataAction.get(sourceKey);
    if (scopes?.length) {
      generatedEntries.push([targetKey, scopes]);
    }
  }

  for (const [key, scopes] of scopesByMetadataAction.entries()) {
    if (TOOL_ACTION_ALIASES[key]) continue;
    generatedEntries.push([key, scopes]);
  }

  generatedEntries.sort(([left], [right]) => left.localeCompare(right));

  const lines = [];
  lines.push('/**');
  lines.push(' * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates');
  lines.push(' * SPDX-License-Identifier: MIT');
  lines.push(' *');
  lines.push(' * Generated by `scripts/generate_feishu_canonical_metadata.mjs`.');
  lines.push(' *');
  lines.push(' * Source priority:');
  lines.push(' * 1. node-sdk canonical required scopes / definitions');
  lines.push(' * 2. node-sdk canonical coverage fallback for legacy or historical endpoints');
  lines.push(' *');
  lines.push(' * Do not edit manually.');
  lines.push(' */');
  lines.push('');
  lines.push("export const GENERATED_TOOL_SCOPES = {");
  for (const [key, scopes] of generatedEntries) {
    lines.push(`  '${escapeTsString(key)}': [${scopes.map((scope) => `'${escapeTsString(scope)}'`).join(', ')}],`);
  }
  lines.push("} as const satisfies Record<string, readonly string[]>;");
  lines.push('');
  lines.push(`export const GENERATED_TOOL_SCOPE_COUNT = ${generatedEntries.length};`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function renderGeneratedToolAuth(metadata) {
  const authByMetadataAction = new Map();
  for (const item of metadata.items) {
    const key = `${item.tool}.${item.operation}`;
    const authModes = Array.from(new Set((item.canonicalAuthModes ?? []).filter(Boolean))).sort();
    const matchedBackendCount = item.backends.filter((backend) => backend.matched).length;
    if (matchedBackendCount > 0) {
      authByMetadataAction.set(key, authModes);
    }
  }

  const generatedEntries = [];
  for (const [targetKey, sourceKey] of Object.entries(TOOL_ACTION_ALIASES)) {
    const authModes = authByMetadataAction.get(sourceKey);
    if (authModes?.length) {
      generatedEntries.push([targetKey, authModes]);
    }
  }

  for (const [key, authModes] of authByMetadataAction.entries()) {
    if (TOOL_ACTION_ALIASES[key]) continue;
    generatedEntries.push([key, authModes]);
  }

  generatedEntries.sort(([left], [right]) => left.localeCompare(right));

  const lines = [];
  lines.push('/**');
  lines.push(' * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates');
  lines.push(' * SPDX-License-Identifier: MIT');
  lines.push(' *');
  lines.push(' * Generated by `scripts/generate_feishu_canonical_metadata.mjs`.');
  lines.push(' * Do not edit manually.');
  lines.push(' */');
  lines.push('');
  lines.push("export const GENERATED_TOOL_AUTH_MODES = {");
  for (const [key, authModes] of generatedEntries) {
    lines.push(`  '${escapeTsString(key)}': [${authModes.map((mode) => `'${escapeTsString(mode)}'`).join(', ')}],`);
  }
  lines.push("} as const satisfies Record<string, readonly string[]>;");
  lines.push('');
  lines.push(`export const GENERATED_TOOL_AUTH_COUNT = ${generatedEntries.length};`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function writeIfChanged(filePath, content) {
  const next = typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (prev === next) return false;
  fs.writeFileSync(filePath, next);
  return true;
}

function withStableGeneratedAt(metadata, generatedAt) {
  return {
    ...metadata,
    generatedAt,
  };
}

function normalizeMetadataForComparison(metadata) {
  if (!metadata) return null;
  const { generatedAt: _generatedAt, ...rest } = metadata;
  return rest;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureFile(SUPPORTED_OPS_PATH);
  const { root: nodeSdkRoot, source: nodeSdkRootSource } = resolveNodeSdkRoot(args.nodeSdkRoot);
  if (nodeSdkRootSource === 'fallback') {
    // eslint-disable-next-line no-console
    console.warn(
      `[feishu canonical metadata] using fallback node-sdk path: ${nodeSdkRoot}. ` +
        'Set NODE_SDK_ROOT or pass --node-sdk-root for reproducible release runs.',
    );
  }
  const requiredScopesPath = path.join(
    nodeSdkRoot,
    'doc',
    'feishu-coverage',
    'canonical',
    'service-api-required-scopes.json',
  );
  const definitionsPath = path.join(
    nodeSdkRoot,
    'doc',
    'feishu-coverage',
    'canonical',
    'service-api-definitions.json',
  );
  const sdkSummaryPath = path.join(nodeSdkRoot, 'doc', 'api-inventory', 'canonical', 'summary.json');
  const coveragePath = path.join(
    nodeSdkRoot,
    'doc',
    'feishu-coverage',
    'canonical',
    'service-api-coverage.json',
  );

  ensureFile(requiredScopesPath);
  ensureFile(definitionsPath);
  ensureFile(sdkSummaryPath);
  ensureFile(coveragePath);

  const supportedOpsDoc = readJson(SUPPORTED_OPS_PATH);
  const requiredScopesDoc = readJson(requiredScopesPath);
  const definitionsDoc = readJson(definitionsPath);
  const sdkSummaryDoc = readJson(sdkSummaryPath);
  const coverageDoc = readJson(coveragePath);

  const metadata = buildMetadata({
    supportedOpsDoc,
    requiredScopesDoc,
    definitionsDoc,
    sdkSummaryDoc,
    coverageDoc,
    nodeSdkRoot,
  });

  const currentJson = fs.existsSync(OUT_JSON_PATH) ? fs.readFileSync(OUT_JSON_PATH, 'utf8') : null;
  const currentMetadata = currentJson ? JSON.parse(currentJson) : null;
  const comparableCurrentMetadata = normalizeMetadataForComparison(currentMetadata);
  const comparableNextMetadata = normalizeMetadataForComparison(metadata);
  const effectiveMetadata =
    currentMetadata && JSON.stringify(comparableCurrentMetadata) === JSON.stringify(comparableNextMetadata)
      ? withStableGeneratedAt(metadata, currentMetadata.generatedAt)
      : metadata;

  const markdown = renderMarkdown(effectiveMetadata);
  const generatedToolScopes = renderGeneratedToolScopes(effectiveMetadata);
  const generatedToolAuth = renderGeneratedToolAuth(effectiveMetadata);

  if (!args.write) {
    const currentMd = fs.existsSync(OUT_MD_PATH) ? fs.readFileSync(OUT_MD_PATH, 'utf8') : null;
    const currentTsScopes = fs.existsSync(OUT_TS_SCOPE_PATH) ? fs.readFileSync(OUT_TS_SCOPE_PATH, 'utf8') : null;
    const currentTsAuth = fs.existsSync(OUT_TS_AUTH_PATH) ? fs.readFileSync(OUT_TS_AUTH_PATH, 'utf8') : null;
    const nextJson = `${JSON.stringify(effectiveMetadata, null, 2)}\n`;
    if (
      currentJson !== nextJson ||
      currentMd !== markdown ||
      currentTsScopes !== generatedToolScopes ||
      currentTsAuth !== generatedToolAuth
    ) {
      process.exitCode = 1;
    }
    return;
  }

  const jsonChanged = writeIfChanged(OUT_JSON_PATH, effectiveMetadata);
  const mdChanged = writeIfChanged(OUT_MD_PATH, markdown);
  const tsScopesChanged = writeIfChanged(OUT_TS_SCOPE_PATH, generatedToolScopes);
  const tsAuthChanged = writeIfChanged(OUT_TS_AUTH_PATH, generatedToolAuth);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        generatedAt: metadata.generatedAt,
        jsonChanged,
        mdChanged,
        tsScopesChanged,
        tsAuthChanged,
        outputJson: path.relative(repoRoot, OUT_JSON_PATH),
        outputMd: path.relative(repoRoot, OUT_MD_PATH),
        outputTsScopes: path.relative(repoRoot, OUT_TS_SCOPE_PATH),
        outputTsAuth: path.relative(repoRoot, OUT_TS_AUTH_PATH),
        summary: effectiveMetadata.summary,
      },
      null,
      2,
    ),
  );
}

main();
