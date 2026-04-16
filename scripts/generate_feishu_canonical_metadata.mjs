#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const SUPPORTED_OPS_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-supported-operations.json');
const OFFICIAL_SECURITY_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-official-security.json');
const OUT_JSON_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-canonical-metadata.json');
const OUT_MD_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-canonical-metadata.md');
const OUT_JSON_SCOPE_SPEC_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-scope-specs.json');
const OUT_TS_SCOPE_SPEC_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-scope-specs.ts');
const OUT_JSON_SCOPE_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-scopes.json');
const OUT_TS_SCOPE_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-scopes.ts');
const OUT_JSON_AUTH_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-auth.json');
const OUT_TS_AUTH_PATH = path.join(repoRoot, 'src', 'core', 'generated', 'feishu-tool-auth.ts');

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

function parseArgs(argv) {
  return {
    write: !argv.includes('--check'),
  };
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function unique(values) {
  return Array.from(new Set((values ?? []).filter(Boolean))).sort();
}

function normalizeBackendLabel(label) {
  const value = String(label).trim();
  const match = value.match(/^([A-Z]+):(\/open-apis\/[^\s]+)/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function declaredAuthToExecutionModes(auth) {
  if (auth === 'user') return ['user'];
  if (auth === 'tenant') return ['tenant'];
  if (auth === 'dual') return ['user', 'tenant'];
  return [];
}

function tokenModesToExecutionModes(tokens) {
  const set = new Set(tokens ?? []);
  const modes = new Set();
  if (set.has('user_access_token')) modes.add('user');
  if (set.has('tenant_access_token') || set.has('app_access_token')) modes.add('tenant');
  return modes;
}

function executionModesToCanonicalAuthModes(executionModes) {
  const hasUser = executionModes.has('user');
  const hasTenant = executionModes.has('tenant');
  if (hasUser && hasTenant) return ['dual-mode'];
  if (hasUser) return ['user-only'];
  if (hasTenant) return ['tenant-only'];
  return [];
}

function intersectExecutionModes(left, right) {
  if (!left) return new Set(right);
  return new Set([...left].filter((mode) => right.has(mode)));
}

function buildMetadata({ supportedOpsDoc, officialSecurityDoc }) {
  const items = [];
  let totalBackendCount = 0;
  let officialCoveredBackendCount = 0;
  let nonOfficialBackendCount = 0;
  let missingOfficialSecurityBackendCount = 0;
  let fullyOfficialScopeGeneratedCount = 0;
  let authFromOfficialIntersectionCount = 0;
  let authDeclaredOnlyCount = 0;
  let authConflictFallbackCount = 0;

  for (const tool of supportedOpsDoc.tools ?? []) {
    for (const operation of tool.operations ?? []) {
      const key = `${tool.tool}.${operation.name}`;
      const declaredAuth = operation.auth ?? tool.auth ?? null;
      const declaredModes = new Set(declaredAuthToExecutionModes(declaredAuth));
      const backends = [];
      let officialExecutionModes = null;

      for (const backendLabel of operation.backend ?? []) {
        totalBackendCount += 1;
        const endpointKey = normalizeBackendLabel(backendLabel);

        if (!endpointKey) {
          backends.push({
            backendLabel,
            kind: 'non-oapi',
            coveredByOfficialSecurity: false,
            reason: 'backend is not an official OAPI endpoint label',
          });
          nonOfficialBackendCount += 1;
          continue;
        }

        const security = officialSecurityDoc[endpointKey];
        if (!security) {
          backends.push({
            backendLabel,
            endpointKey,
            kind: 'oapi',
            coveredByOfficialSecurity: false,
            reason: 'official security metadata not available for backend endpoint',
          });
          missingOfficialSecurityBackendCount += 1;
          continue;
        }

        const executionModes = tokenModesToExecutionModes(security.supportedAccessToken);
        officialExecutionModes = intersectExecutionModes(officialExecutionModes, executionModes);
        backends.push({
          backendLabel,
          endpointKey,
          kind: 'oapi',
          coveredByOfficialSecurity: true,
          reviewUrl: security.reviewUrl,
          resolutionQuality: security.resolutionQuality,
          scopeNeedType: security.scopeNeedType,
          requiredScopes: unique(security.requiredScopes),
          supportedAccessToken: unique(security.supportedAccessToken),
          officialExecutionModes: unique([...executionModes]),
        });
        officialCoveredBackendCount += 1;
      }

      const allBackendsOfficialCovered =
        backends.length > 0 &&
        backends.every((backend) => backend.kind === 'oapi' && backend.coveredByOfficialSecurity);

      const generatedScopes = allBackendsOfficialCovered
        ? unique(backends.flatMap((backend) => backend.requiredScopes ?? []))
        : null;
      const generatedScopeNeedType = allBackendsOfficialCovered
        ? backends.length === 1
          ? backends[0].scopeNeedType ?? 'all'
          : 'all'
        : null;

      if (generatedScopes) {
        fullyOfficialScopeGeneratedCount += 1;
      }

      const officialAuthModes = executionModesToCanonicalAuthModes(officialExecutionModes ?? new Set());
      const officialCoveredBackendTotal = backends.filter((backend) => backend.coveredByOfficialSecurity).length;

      let generatedAuthModes = [];
      let authSource = 'unresolved';
      let authReason = 'no declared auth or official endpoint auth metadata available';

      if (declaredModes.size > 0 && officialExecutionModes && officialExecutionModes.size > 0) {
        const intersectedModes = intersectExecutionModes(declaredModes, officialExecutionModes);
        const intersectedAuthModes = executionModesToCanonicalAuthModes(intersectedModes);
        if (intersectedAuthModes.length > 0) {
          generatedAuthModes = intersectedAuthModes;
          authSource = 'declared+official';
          authReason = 'declared action auth intersected with official endpoint token modes';
          authFromOfficialIntersectionCount += 1;
        } else {
          generatedAuthModes = executionModesToCanonicalAuthModes(declaredModes);
          authSource = 'declared-conflict-fallback';
          authReason = 'declared action auth conflicts with official endpoint token modes; keeping declared action auth';
          authConflictFallbackCount += 1;
        }
      } else if (declaredModes.size > 0) {
        generatedAuthModes = executionModesToCanonicalAuthModes(declaredModes);
        authSource = 'declared';
        authReason = officialCoveredBackendTotal > 0
          ? 'official endpoint token modes unavailable after normalization; keeping declared action auth'
          : 'no official endpoint auth metadata for this action; keeping declared action auth';
        authDeclaredOnlyCount += 1;
      } else if (officialAuthModes.length > 0) {
        generatedAuthModes = officialAuthModes;
        authSource = 'official';
        authReason = 'declared action auth is unavailable; derived from official endpoint token modes';
        authFromOfficialIntersectionCount += 1;
      }

      items.push({
        tool: tool.tool,
        category: tool.category,
        transport: tool.transport,
        source: tool.source,
        operation: operation.name,
        summary: operation.summary,
        toolAction: key,
        declaredAuth,
        generatedScopes,
        generatedScopeNeedType,
        scopeGenerationStatus: generatedScopes ? 'official-complete' : 'partial-or-non-official',
        scopeGenerationReason: generatedScopes
          ? 'all declared backends are official OAPI endpoints with official security metadata'
          : 'at least one declared backend is non-OAPI or missing official security metadata',
        generatedAuthModes: unique(generatedAuthModes),
        authGenerationSource: authSource,
        authGenerationReason: authReason,
        officialAuthModes,
        backendCount: backends.length,
        officialCoveredBackendCount: officialCoveredBackendTotal,
        backends,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourcePriority: [
      'docs/references/feishu-supported-operations.json',
      'docs/references/feishu-official-security.json',
    ],
    references: {
      supportedOperations: path.relative(repoRoot, SUPPORTED_OPS_PATH),
      officialSecurity: path.relative(repoRoot, OFFICIAL_SECURITY_PATH),
    },
    summary: {
      toolCount: supportedOpsDoc.totals?.toolCount ?? null,
      operationCount: supportedOpsDoc.totals?.operationCount ?? items.length,
      totalBackendCount,
      officialCoveredBackendCount,
      nonOfficialBackendCount,
      missingOfficialSecurityBackendCount,
      fullyOfficialScopeGeneratedCount,
      authFromOfficialIntersectionCount,
      authDeclaredOnlyCount,
      authConflictFallbackCount,
    },
    items,
  };
}

function buildGeneratedToolScopes(metadata) {
  const scopesByAction = new Map();
  for (const item of metadata.items) {
    if (item.scopeGenerationStatus !== 'official-complete') continue;
    scopesByAction.set(item.toolAction, item.generatedScopes ?? []);
  }

  const entries = [];
  for (const [targetKey, sourceKey] of Object.entries(TOOL_ACTION_ALIASES)) {
    if (!scopesByAction.has(sourceKey)) continue;
    entries.push([targetKey, scopesByAction.get(sourceKey)]);
  }

  for (const [key, scopes] of scopesByAction.entries()) {
    if (TOOL_ACTION_ALIASES[key]) continue;
    entries.push([key, scopes]);
  }

  entries.sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

function buildGeneratedToolScopeSpecs(metadata) {
  const specsByAction = new Map();
  for (const item of metadata.items) {
    if (item.scopeGenerationStatus !== 'official-complete') continue;
    specsByAction.set(item.toolAction, {
      requiredScopes: item.generatedScopes ?? [],
      scopeNeedType: item.generatedScopeNeedType ?? 'all',
      source: 'official',
    });
  }

  const entries = [];
  for (const [targetKey, sourceKey] of Object.entries(TOOL_ACTION_ALIASES)) {
    if (!specsByAction.has(sourceKey)) continue;
    entries.push([targetKey, specsByAction.get(sourceKey)]);
  }

  for (const [key, spec] of specsByAction.entries()) {
    if (TOOL_ACTION_ALIASES[key]) continue;
    entries.push([key, spec]);
  }

  entries.sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

function buildGeneratedToolAuth(metadata) {
  const authByAction = new Map();
  for (const item of metadata.items) {
    if ((item.generatedAuthModes ?? []).length === 0) continue;
    authByAction.set(item.toolAction, item.generatedAuthModes);
  }

  const entries = [];
  for (const [targetKey, sourceKey] of Object.entries(TOOL_ACTION_ALIASES)) {
    if (!authByAction.has(sourceKey)) continue;
    entries.push([targetKey, authByAction.get(sourceKey)]);
  }

  for (const [key, authModes] of authByAction.entries()) {
    if (TOOL_ACTION_ALIASES[key]) continue;
    entries.push([key, authModes]);
  }

  entries.sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

function renderMarkdown(metadata) {
  const lines = [];
  lines.push('# Feishu Canonical Metadata');
  lines.push('');
  lines.push('This file is generated from:');
  lines.push('');
  lines.push(`- \`${metadata.references.supportedOperations}\``);
  lines.push(`- \`${metadata.references.officialSecurity}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Generated at: ${metadata.generatedAt}`);
  lines.push(`- Operations: ${metadata.summary.operationCount}`);
  lines.push(`- Declared backends: ${metadata.summary.totalBackendCount}`);
  lines.push(`- Officially covered backends: ${metadata.summary.officialCoveredBackendCount}`);
  lines.push(`- Non-OAPI backends: ${metadata.summary.nonOfficialBackendCount}`);
  lines.push(`- OAPI backends missing official security metadata: ${metadata.summary.missingOfficialSecurityBackendCount}`);
  lines.push(`- Actions with fully official generated scopes: ${metadata.summary.fullyOfficialScopeGeneratedCount}`);
  lines.push(`- Actions with auth from declared+official intersection: ${metadata.summary.authFromOfficialIntersectionCount}`);
  lines.push(`- Actions with declared-auth-only fallback: ${metadata.summary.authDeclaredOnlyCount}`);
  lines.push(`- Actions with declared/auth conflict fallback: ${metadata.summary.authConflictFallbackCount}`);
  lines.push('');
  lines.push('## Actions');
  lines.push('');
  lines.push('| Tool Action | Scope Status | Generated Auth | Auth Source | Notes |');
  lines.push('|---|---|---|---|---|');
  for (const item of metadata.items) {
    lines.push(
      `| \`${item.toolAction}\` | \`${item.scopeGenerationStatus}\` | \`${(item.generatedAuthModes ?? []).join(', ') || 'none'}\` | \`${item.authGenerationSource}\` | ${item.scopeGenerationReason} |`,
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function renderGeneratedToolScopeSpecsWrapper() {
  return `/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Generated by \`scripts/generate_feishu_canonical_metadata.mjs\`.
 * Do not edit manually.
 */

import rawGeneratedToolScopeSpecs from './feishu-tool-scope-specs.json';

export interface GeneratedToolScopeSpec {
  requiredScopes: readonly string[];
  scopeNeedType: 'one' | 'all';
  source: 'official';
}

export const GENERATED_TOOL_SCOPE_SPECS = rawGeneratedToolScopeSpecs as Record<string, GeneratedToolScopeSpec>;
export const GENERATED_TOOL_SCOPE_SPEC_COUNT = Object.keys(GENERATED_TOOL_SCOPE_SPECS).length;
`;
}

function renderGeneratedToolScopesWrapper() {
  return `/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Generated by \`scripts/generate_feishu_canonical_metadata.mjs\`.
 * Do not edit manually.
 */

import rawGeneratedToolScopes from './feishu-tool-scopes.json';

export const GENERATED_TOOL_SCOPES = rawGeneratedToolScopes as Record<string, readonly string[]>;
export const GENERATED_TOOL_SCOPE_COUNT = Object.keys(GENERATED_TOOL_SCOPES).length;
`;
}

function renderGeneratedToolAuthWrapper() {
  return `/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Generated by \`scripts/generate_feishu_canonical_metadata.mjs\`.
 * Do not edit manually.
 */

import rawGeneratedToolAuthModes from './feishu-tool-auth.json';

export const GENERATED_TOOL_AUTH_MODES = rawGeneratedToolAuthModes as Record<string, readonly string[]>;
export const GENERATED_TOOL_AUTH_COUNT = Object.keys(GENERATED_TOOL_AUTH_MODES).length;
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureFile(SUPPORTED_OPS_PATH);
  ensureFile(OFFICIAL_SECURITY_PATH);

  const supportedOpsDoc = readJson(SUPPORTED_OPS_PATH);
  const officialSecurityDoc = readJson(OFFICIAL_SECURITY_PATH);
  const metadata = buildMetadata({
    supportedOpsDoc,
    officialSecurityDoc,
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
  const generatedToolScopeSpecs = buildGeneratedToolScopeSpecs(effectiveMetadata);
  const generatedToolScopes = buildGeneratedToolScopes(effectiveMetadata);
  const generatedToolAuth = buildGeneratedToolAuth(effectiveMetadata);
  const generatedToolScopeSpecsJson = `${JSON.stringify(generatedToolScopeSpecs, null, 2)}\n`;
  const generatedToolScopesJson = `${JSON.stringify(generatedToolScopes, null, 2)}\n`;
  const generatedToolAuthJson = `${JSON.stringify(generatedToolAuth, null, 2)}\n`;
  const nextJson = `${JSON.stringify(effectiveMetadata, null, 2)}\n`;

  if (!args.write) {
    const currentMd = fs.existsSync(OUT_MD_PATH) ? fs.readFileSync(OUT_MD_PATH, 'utf8') : null;
    const currentJsonScopeSpecs = fs.existsSync(OUT_JSON_SCOPE_SPEC_PATH)
      ? fs.readFileSync(OUT_JSON_SCOPE_SPEC_PATH, 'utf8')
      : null;
    const currentJsonScopes = fs.existsSync(OUT_JSON_SCOPE_PATH) ? fs.readFileSync(OUT_JSON_SCOPE_PATH, 'utf8') : null;
    const currentJsonAuth = fs.existsSync(OUT_JSON_AUTH_PATH) ? fs.readFileSync(OUT_JSON_AUTH_PATH, 'utf8') : null;

    if (
      currentJson !== nextJson ||
      currentMd !== markdown ||
      currentJsonScopeSpecs !== generatedToolScopeSpecsJson ||
      currentJsonScopes !== generatedToolScopesJson ||
      currentJsonAuth !== generatedToolAuthJson
    ) {
      process.exitCode = 1;
    }
    return;
  }

  const jsonChanged = writeIfChanged(OUT_JSON_PATH, effectiveMetadata);
  const mdChanged = writeIfChanged(OUT_MD_PATH, markdown);
  const jsonScopeSpecsChanged = writeIfChanged(OUT_JSON_SCOPE_SPEC_PATH, generatedToolScopeSpecsJson);
  const jsonScopesChanged = writeIfChanged(OUT_JSON_SCOPE_PATH, generatedToolScopesJson);
  const jsonAuthChanged = writeIfChanged(OUT_JSON_AUTH_PATH, generatedToolAuthJson);

  console.log(
    JSON.stringify(
      {
        generatedAt: metadata.generatedAt,
        jsonChanged,
        mdChanged,
        jsonScopeSpecsChanged,
        jsonScopesChanged,
        jsonAuthChanged,
        outputJson: path.relative(repoRoot, OUT_JSON_PATH),
        outputMd: path.relative(repoRoot, OUT_MD_PATH),
        outputJsonScopeSpecs: path.relative(repoRoot, OUT_JSON_SCOPE_SPEC_PATH),
        outputJsonScopes: path.relative(repoRoot, OUT_JSON_SCOPE_PATH),
        outputJsonAuth: path.relative(repoRoot, OUT_JSON_AUTH_PATH),
        summary: effectiveMetadata.summary,
      },
      null,
      2,
    ),
  );
}

main();
