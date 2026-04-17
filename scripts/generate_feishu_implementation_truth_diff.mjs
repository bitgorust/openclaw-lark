#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const SUPPORTED_OPS_PATH = path.join(repoRoot, 'docs', 'reports', 'feishu', 'feishu-supported-operations.json');
const CANONICAL_METADATA_PATH = path.join(repoRoot, 'docs', 'reports', 'feishu', 'feishu-canonical-metadata.json');
const OUT_JSON_PATH = path.join(repoRoot, 'docs', 'reports', 'feishu', 'feishu-implementation-truth-diff.json');
const OUT_MD_PATH = path.join(repoRoot, 'docs', 'reports', 'feishu', 'feishu-implementation-truth-diff.md');

function parseArgs(argv) {
  return {
    write: !argv.includes('--check'),
  };
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${path.relative(repoRoot, filePath)}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function unique(values) {
  return Array.from(new Set((values ?? []).filter(Boolean))).sort();
}

function sortEntries(entries) {
  return [...entries].sort(([left], [right]) => left.localeCompare(right));
}

function codeAuthToModes(auth) {
  if (auth === 'user') return ['user'];
  if (auth === 'tenant') return ['tenant'];
  if (auth === 'dual') return ['user', 'tenant'];
  return [];
}

function canonicalAuthModesToModes(modes) {
  const set = new Set(modes ?? []);
  if (set.has('dual-mode')) return ['user', 'tenant'];
  if (set.has('user-only')) return ['user'];
  if (set.has('tenant-only')) return ['tenant'];
  return [];
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractActionSegment(sourceText, action) {
  const marker = `case '${action}':`;
  const start = sourceText.indexOf(marker);
  if (start >= 0) {
    const rest = sourceText.slice(start + marker.length);
    const nextCaseOffset = rest.search(/\n\s*case\s+'/);
    if (nextCaseOffset >= 0) {
      return sourceText.slice(start, start + marker.length + nextCaseOffset);
    }
    return sourceText.slice(start);
  }
  return sourceText;
}

function detectImplementationAuth(item, sourceText) {
  const segment = extractActionSegment(sourceText, item.operation);

  if (
    /as:\s*authPolicy\.currentExecutionMode/.test(segment) ||
    /preferredMode:\s*authPolicy\.currentExecutionMode/.test(segment) ||
    /getApprovalAuthPolicy\(/.test(segment)
  ) {
    return {
      kind: 'delegated-approval-policy',
      modes: canonicalAuthModesToModes(item.generatedAuthModes),
      declaredAuth: 'delegated',
    };
  }

  const explicitUser = /as:\s*'user'/.test(segment);
  const explicitTenant = /as:\s*'tenant'/.test(segment);
  if (explicitUser && explicitTenant) {
    return {
      kind: 'explicit-dual',
      modes: ['user', 'tenant'],
      declaredAuth: 'dual',
    };
  }
  if (explicitTenant) {
    return {
      kind: 'explicit-tenant',
      modes: ['tenant'],
      declaredAuth: 'tenant',
    };
  }
  if (explicitUser) {
    return {
      kind: 'explicit-user',
      modes: ['user'],
      declaredAuth: 'user',
    };
  }

  if (/client\.invokeByPath/.test(segment) || /client\.invoke\b/.test(segment)) {
    return {
      kind: 'delegated-tool-client-default',
      modes: canonicalAuthModesToModes(item.generatedAuthModes),
      declaredAuth: 'delegated',
    };
  }

  if (
    /downloadApprovalAttachment\(/.test(segment) ||
    /parseLocalApprovalAttachment\(/.test(segment)
  ) {
    return {
      kind: 'local-helper-wrapper',
      modes: canonicalAuthModesToModes(item.generatedAuthModes),
      declaredAuth: 'delegated',
    };
  }

  const fallbackDeclaredAuth = item.declaredAuth ?? null;
  return {
    kind: 'supported-operations-fallback',
    modes: codeAuthToModes(fallbackDeclaredAuth),
    declaredAuth: fallbackDeclaredAuth,
  };
}

function buildSupportedOpsIndex(doc) {
  const map = new Map();
  for (const tool of doc.tools ?? []) {
    for (const operation of tool.operations ?? []) {
      const toolAction = `${tool.tool}.${operation.name}`;
      map.set(toolAction, {
        tool: tool.tool,
        operation: operation.name,
        source: tool.source,
        category: tool.category,
        transport: tool.transport,
        declaredAuth: operation.auth ?? tool.auth ?? null,
        backend: operation.backend ?? [],
        officialCoverage: operation.officialCoverage ?? 'non-official',
      });
    }
  }
  return map;
}

function classifyRelation(codeModes, canonicalModes) {
  const code = new Set(codeModes);
  const canonical = new Set(canonicalModes);

  if (code.size === 0 && canonical.size === 0) return 'unknown';
  if (code.size === 0) return 'missing-code-auth';
  if (canonical.size === 0) return 'missing-canonical-auth';
  if (code.size === canonical.size && [...code].every((mode) => canonical.has(mode))) return 'aligned';

  const intersection = [...code].filter((mode) => canonical.has(mode));
  if (intersection.length === 0) return 'conflict';
  if ([...code].every((mode) => canonical.has(mode))) return 'code-narrower-than-truth';
  if ([...canonical].every((mode) => code.has(mode))) return 'code-broader-than-truth';
  return 'partial-overlap';
}

function buildReport({ supportedOpsDoc, canonicalMetadataDoc }) {
  const supportedIndex = buildSupportedOpsIndex(supportedOpsDoc);
  const sourceTextCache = new Map();
  const items = [];
  const summary = {
    totalActions: 0,
    alignedCount: 0,
    conflictCount: 0,
    codeNarrowerThanTruthCount: 0,
    codeBroaderThanTruthCount: 0,
    partialOverlapCount: 0,
    missingCodeAuthCount: 0,
    missingCanonicalAuthCount: 0,
    unknownCount: 0,
  };

  for (const item of canonicalMetadataDoc.items ?? []) {
    const supported = supportedIndex.get(item.toolAction);
    const sourcePath = supported?.source ? path.join(repoRoot, supported.source) : null;
    if (sourcePath && !sourceTextCache.has(sourcePath)) {
      sourceTextCache.set(sourcePath, readText(sourcePath));
    }
    const implementation = detectImplementationAuth(
      {
        ...item,
        operation: item.operation,
        declaredAuth: supported?.declaredAuth ?? item.declaredAuth ?? null,
      },
      sourcePath ? sourceTextCache.get(sourcePath) : '',
    );
    const declaredAuth = implementation.declaredAuth;
    const codeModes = implementation.modes;
    const canonicalModes = canonicalAuthModesToModes(item.generatedAuthModes);
    const relation = classifyRelation(codeModes, canonicalModes);

    summary.totalActions += 1;
    if (relation === 'aligned') summary.alignedCount += 1;
    else if (relation === 'conflict') summary.conflictCount += 1;
    else if (relation === 'code-narrower-than-truth') summary.codeNarrowerThanTruthCount += 1;
    else if (relation === 'code-broader-than-truth') summary.codeBroaderThanTruthCount += 1;
    else if (relation === 'partial-overlap') summary.partialOverlapCount += 1;
    else if (relation === 'missing-code-auth') summary.missingCodeAuthCount += 1;
    else if (relation === 'missing-canonical-auth') summary.missingCanonicalAuthCount += 1;
    else summary.unknownCount += 1;

    items.push({
      toolAction: item.toolAction,
      tool: item.tool,
      operation: item.operation,
      source: supported?.source ?? null,
      category: supported?.category ?? null,
      transport: supported?.transport ?? null,
      officialCoverage: supported?.officialCoverage ?? null,
      declaredAuth: supported?.declaredAuth ?? item.declaredAuth ?? null,
      implementationAuth: declaredAuth,
      implementationInferenceKind: implementation.kind,
      implementationModes: unique(codeModes),
      canonicalAuthModes: unique(item.generatedAuthModes ?? []),
      canonicalExecutionModes: unique(canonicalModes),
      relation,
      authGenerationSource: item.authGenerationSource,
      authGenerationReason: item.authGenerationReason,
      backend: supported?.backend ?? item.backends?.map((backend) => backend.backendLabel) ?? [],
    });
  }

  items.sort((left, right) => left.toolAction.localeCompare(right.toolAction));

  const grouped = new Map();
  for (const item of items.filter((entry) => entry.relation !== 'aligned')) {
    const list = grouped.get(item.relation) ?? [];
    list.push(item.toolAction);
    grouped.set(item.relation, list);
  }

  return {
    generatedAt: new Date().toISOString(),
    references: {
      supportedOperations: path.relative(repoRoot, SUPPORTED_OPS_PATH),
      canonicalMetadata: path.relative(repoRoot, CANONICAL_METADATA_PATH),
    },
    semantics: {
      declaredAuth: 'Code-derived auth declaration/observation from src/tools via supported-operations.',
      canonicalAuth: 'Final auth contract derived from official truth sources in canonical metadata.',
    },
    summary,
    mismatchesByRelation: Object.fromEntries(sortEntries(Array.from(grouped.entries())).map(([key, value]) => [key, value])),
    items,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Feishu Implementation vs Truth Source Diff');
  lines.push('');
  lines.push('This file reports differences between code-derived tool auth declarations and canonical truth-source auth contracts.');
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- \`${report.references.supportedOperations}\``);
  lines.push(`- \`${report.references.canonicalMetadata}\``);
  lines.push('');
  lines.push('## Semantics');
  lines.push('');
  lines.push(`- Declared auth: ${report.semantics.declaredAuth}`);
  lines.push(`- Canonical auth: ${report.semantics.canonicalAuth}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Total actions: ${report.summary.totalActions}`);
  lines.push(`- Aligned: ${report.summary.alignedCount}`);
  lines.push(`- Conflicts: ${report.summary.conflictCount}`);
  lines.push(`- Code narrower than truth: ${report.summary.codeNarrowerThanTruthCount}`);
  lines.push(`- Code broader than truth: ${report.summary.codeBroaderThanTruthCount}`);
  lines.push(`- Partial overlap: ${report.summary.partialOverlapCount}`);
  lines.push(`- Missing code auth: ${report.summary.missingCodeAuthCount}`);
  lines.push(`- Missing canonical auth: ${report.summary.missingCanonicalAuthCount}`);
  lines.push(`- Unknown: ${report.summary.unknownCount}`);
  lines.push('');
  lines.push('## Non-aligned Actions');
  lines.push('');
  lines.push('| Action | Relation | Declared Auth | Canonical Auth | Source | Auth Source |');
  lines.push('|---|---|---|---|---|---|');
  for (const item of report.items.filter((entry) => entry.relation !== 'aligned')) {
    lines.push(
      `| \`${item.toolAction}\` | \`${item.relation}\` | \`${item.implementationAuth ?? 'none'}\` | \`${item.canonicalAuthModes.join(', ') || 'none'}\` | \`${item.source ?? '-'}\` | \`${item.authGenerationSource}\` |`,
    );
  }
  lines.push('');
  lines.push('## Detailed Actions');
  lines.push('');
  lines.push('| Action | Relation | Declared Modes | Canonical Modes | Backend Count | Coverage |');
  lines.push('|---|---|---|---|---:|---|');
  for (const item of report.items) {
    lines.push(
      `| \`${item.toolAction}\` | \`${item.relation}\` | \`${item.implementationModes.join(', ') || 'none'}\` | \`${item.canonicalExecutionModes.join(', ') || 'none'}\` | ${item.backend.length} | \`${item.officialCoverage ?? '-'}\` |`,
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function normalizeReportForComparison(report) {
  if (!report) return null;
  const clone = structuredClone(report);
  delete clone.generatedAt;
  return clone;
}

function withStableGeneratedAt(report, generatedAt) {
  return {
    ...report,
    generatedAt,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureFile(SUPPORTED_OPS_PATH);
  ensureFile(CANONICAL_METADATA_PATH);

  const report = buildReport({
    supportedOpsDoc: readJson(SUPPORTED_OPS_PATH),
    canonicalMetadataDoc: readJson(CANONICAL_METADATA_PATH),
  });
  const currentJson = fs.existsSync(OUT_JSON_PATH) ? readJson(OUT_JSON_PATH) : null;
  const effectiveReport =
    currentJson &&
    JSON.stringify(normalizeReportForComparison(currentJson)) === JSON.stringify(normalizeReportForComparison(report))
      ? withStableGeneratedAt(report, currentJson.generatedAt)
      : report;
  const jsonText = `${JSON.stringify(effectiveReport, null, 2)}\n`;
  const mdText = renderMarkdown(effectiveReport);

  if (!args.write) {
    const currentMd = fs.existsSync(OUT_MD_PATH) ? fs.readFileSync(OUT_MD_PATH, 'utf8') : null;
    const changed = [];

    if (
      JSON.stringify(normalizeReportForComparison(currentJson)) !==
      JSON.stringify(normalizeReportForComparison(effectiveReport))
    ) {
      changed.push(path.relative(repoRoot, OUT_JSON_PATH));
    }
    if (currentMd !== mdText) {
      changed.push(path.relative(repoRoot, OUT_MD_PATH));
    }

    if (changed.length > 0) {
      console.error('feishu implementation-truth-diff artifacts are out of date:');
      for (const item of changed) console.error(`- ${item}`);
      process.exitCode = 1;
      return;
    }

    console.log('feishu implementation-truth-diff artifacts are up to date');
    return;
  }

  fs.mkdirSync(path.dirname(OUT_JSON_PATH), { recursive: true });
  fs.writeFileSync(OUT_JSON_PATH, jsonText);
  fs.writeFileSync(OUT_MD_PATH, mdText);
  console.log(`wrote ${path.relative(repoRoot, OUT_JSON_PATH)}`);
  console.log(`wrote ${path.relative(repoRoot, OUT_MD_PATH)}`);
}

main();
