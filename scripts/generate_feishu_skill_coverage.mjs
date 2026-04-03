#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const SUPPORTED_OPS_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-supported-operations.json');
const SKILLS_ROOT = path.join(repoRoot, 'skills');
const OUT_JSON_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-skill-coverage.json');
const OUT_MD_PATH = path.join(repoRoot, 'docs', 'references', 'feishu-skill-coverage.md');

const SKILL_ELIGIBILITY_EXCLUSIONS = new Map([
  ['feishu_im_bot_image', 'tenant-side helper for bot-origin resources; not a primary user-invoked skill surface'],
  ['feishu_oauth', 'authorization flow helper; normally triggered by runtime remediation rather than explicit skill selection'],
  ['feishu_oauth_batch_auth', 'authorization flow helper; normally triggered by remediation or explicit admin intent'],
  ['feishu_ask_user_question', 'interaction primitive used by workflows, not a standalone Feishu domain skill'],
]);

const TOOL_NAME_PATTERN = /\bfeishu_[a-z0-9_]+\b/g;

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

function readSkillFiles() {
  ensureFile(SKILLS_ROOT);
  const entries = fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return entries
    .map((name) => {
      const skillPath = path.join(SKILLS_ROOT, name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return null;
      return {
        name,
        path: path.relative(repoRoot, skillPath),
        content: fs.readFileSync(skillPath, 'utf8'),
      };
    })
    .filter(Boolean);
}

function buildCoverage() {
  const supportedOps = readJson(SUPPORTED_OPS_PATH);
  const skills = readSkillFiles();
  const skillNames = skills.map((skill) => skill.name);
  const skillContents = new Map(skills.map((skill) => [skill.name, skill.content]));
  const supportedToolNames = new Set(supportedOps.tools.map((tool) => tool.tool));

  const items = supportedOps.tools.map((tool) => {
    const matchingSkills = skillNames.filter((skillName) => skillContents.get(skillName)?.includes(tool.tool));
    const skillEligible = !SKILL_ELIGIBILITY_EXCLUSIONS.has(tool.tool);

    return {
      tool: tool.tool,
      category: tool.category,
      transport: tool.transport,
      auth: tool.auth,
      operationCount: tool.operations?.length ?? 0,
      source: tool.source,
      skillEligible,
      exclusionReason: SKILL_ELIGIBILITY_EXCLUSIONS.get(tool.tool) ?? null,
      matchingSkills,
      coverageStatus: !skillEligible ? 'excluded' : matchingSkills.length > 0 ? 'covered' : 'uncovered',
    };
  });

  const eligibleItems = items.filter((item) => item.skillEligible);
  const coveredItems = eligibleItems.filter((item) => item.coverageStatus === 'covered');
  const uncoveredItems = eligibleItems.filter((item) => item.coverageStatus === 'uncovered');
  const excludedItems = items.filter((item) => item.coverageStatus === 'excluded');
  const unknownToolReferences = skills
    .map((skill) => {
      const referencedTools = Array.from(new Set(skill.content.match(TOOL_NAME_PATTERN) ?? [])).sort();
      const missingTools = referencedTools.filter((toolName) => !supportedToolNames.has(toolName));

      return {
        skill: skill.name,
        path: skill.path,
        missingTools,
      };
    })
    .filter((item) => item.missingTools.length > 0);

  const categorySummary = new Map();
  for (const item of items) {
    const entry = categorySummary.get(item.category) ?? {
      category: item.category,
      eligibleToolCount: 0,
      coveredToolCount: 0,
      uncoveredToolCount: 0,
      excludedToolCount: 0,
      operationCount: 0,
    };
    entry.operationCount += item.operationCount;
    if (item.coverageStatus === 'excluded') {
      entry.excludedToolCount += 1;
    } else {
      entry.eligibleToolCount += 1;
      if (item.coverageStatus === 'covered') {
        entry.coveredToolCount += 1;
      } else {
        entry.uncoveredToolCount += 1;
      }
    }
    categorySummary.set(item.category, entry);
  }

  return {
    generatedAt: new Date().toISOString(),
    references: {
      supportedOperations: path.relative(repoRoot, SUPPORTED_OPS_PATH),
      skillsRoot: path.relative(repoRoot, SKILLS_ROOT),
    },
    summary: {
      skillCount: skills.length,
      toolCount: items.length,
      eligibleToolCount: eligibleItems.length,
      coveredToolCount: coveredItems.length,
      uncoveredToolCount: uncoveredItems.length,
      excludedToolCount: excludedItems.length,
      eligibleOperationCount: eligibleItems.reduce((sum, item) => sum + item.operationCount, 0),
      coveredOperationCount: coveredItems.reduce((sum, item) => sum + item.operationCount, 0),
      unknownReferencedToolCount: unknownToolReferences.reduce((sum, item) => sum + item.missingTools.length, 0),
      skillsWithUnknownReferencedTools: unknownToolReferences.length,
    },
    categorySummary: Array.from(categorySummary.values()).sort((a, b) => a.category.localeCompare(b.category)),
    items,
    unknownToolReferences,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Feishu Skill Coverage');
  lines.push('');
  lines.push('This file is generated from:');
  lines.push('');
  lines.push(`- \`${report.references.supportedOperations}\``);
  lines.push(`- \`${report.references.skillsRoot}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Skills: ${report.summary.skillCount}`);
  lines.push(`- Tools: ${report.summary.toolCount}`);
  lines.push(`- Eligible tools: ${report.summary.eligibleToolCount}`);
  lines.push(`- Covered tools: ${report.summary.coveredToolCount}`);
  lines.push(`- Uncovered tools: ${report.summary.uncoveredToolCount}`);
  lines.push(`- Excluded tools: ${report.summary.excludedToolCount}`);
  lines.push(`- Covered operations: ${report.summary.coveredOperationCount}/${report.summary.eligibleOperationCount}`);
  lines.push(`- Skills with unknown referenced tools: ${report.summary.skillsWithUnknownReferencedTools}`);
  lines.push(`- Unknown referenced tool names: ${report.summary.unknownReferencedToolCount}`);
  lines.push('');
  lines.push('## Category Summary');
  lines.push('');
  lines.push('| Category | Eligible Tools | Covered | Uncovered | Excluded | Operations |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const item of report.categorySummary) {
    lines.push(
      `| \`${item.category}\` | ${item.eligibleToolCount} | ${item.coveredToolCount} | ${item.uncoveredToolCount} | ${item.excludedToolCount} | ${item.operationCount} |`,
    );
  }
  lines.push('');
  lines.push('## Tool Coverage');
  lines.push('');
  lines.push('| Tool | Category | Operations | Status | Skills / Reason |');
  lines.push('|---|---|---:|---|---|');
  for (const item of report.items) {
    const detail =
      item.coverageStatus === 'excluded'
        ? item.exclusionReason
        : item.matchingSkills.length > 0
          ? item.matchingSkills.map((name) => `\`${name}\``).join(', ')
          : 'No skill mentions this tool yet';
    lines.push(
      `| \`${item.tool}\` | \`${item.category}\` | ${item.operationCount} | \`${item.coverageStatus}\` | ${detail} |`,
    );
  }
  lines.push('');
  lines.push('## Priority Uncovered Tools');
  lines.push('');
  for (const item of report.items.filter((entry) => entry.coverageStatus === 'uncovered')) {
    lines.push(`- \`${item.tool}\` (\`${item.category}\`, ${item.operationCount} ops)`);
  }
  lines.push('');
  lines.push('## Unknown Tool References');
  lines.push('');
  if (report.unknownToolReferences.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.unknownToolReferences) {
      lines.push(`- \`${item.skill}\`: ${item.missingTools.map((tool) => `\`${tool}\``).join(', ')}`);
    }
  }
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

function normalizeForComparison(report) {
  if (!report) return null;
  const { generatedAt: _generatedAt, ...rest } = report;
  return rest;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureFile(SUPPORTED_OPS_PATH);
  const report = buildCoverage();
  const currentJson = fs.existsSync(OUT_JSON_PATH) ? fs.readFileSync(OUT_JSON_PATH, 'utf8') : null;
  const currentReport = currentJson ? JSON.parse(currentJson) : null;
  const sameContent =
    JSON.stringify(normalizeForComparison(currentReport)) === JSON.stringify(normalizeForComparison(report));
  const effectiveReport = sameContent && currentReport ? { ...report, generatedAt: currentReport.generatedAt } : report;
  const markdown = renderMarkdown(effectiveReport);
  const nextJson = `${JSON.stringify(effectiveReport, null, 2)}\n`;

  if (!args.write) {
    const currentMd = fs.existsSync(OUT_MD_PATH) ? fs.readFileSync(OUT_MD_PATH, 'utf8') : null;
    if (currentJson !== nextJson || currentMd !== markdown) {
      process.exitCode = 1;
    }
    return;
  }

  const jsonChanged = writeIfChanged(OUT_JSON_PATH, effectiveReport);
  const mdChanged = writeIfChanged(OUT_MD_PATH, markdown);

  console.log(
    JSON.stringify(
      {
        generatedAt: effectiveReport.generatedAt,
        jsonChanged,
        mdChanged,
        outputJson: path.relative(repoRoot, OUT_JSON_PATH),
        outputMd: path.relative(repoRoot, OUT_MD_PATH),
        summary: effectiveReport.summary,
      },
      null,
      2,
    ),
  );
}

main();
