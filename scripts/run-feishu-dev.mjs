#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execa } from 'execa';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const configSourcePath = path.join(repoRoot, '.openclaw-dev.feishu.json');
const runtimeHomeDir = path.join(repoRoot, '.artifacts', 'feishu-local-dev', 'home');
const runtimeConfigDir = path.join(runtimeHomeDir, '.openclaw-dev');
const runtimeConfigPath = path.join(runtimeConfigDir, 'openclaw.json');
const composeFilePath = path.join(repoRoot, 'docker', 'feishu-dev', 'docker-compose.yml');
const workspaceDir = repoRoot;
const openclawVersion = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'node_modules', 'openclaw', 'package.json'), 'utf8'),
).version;

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

function ensureConfigSource() {
  if (!fs.existsSync(configSourcePath)) {
    throw new Error(
      [
        `Missing local Feishu dev config: ${path.relative(repoRoot, configSourcePath)}`,
        'Create that file first. `dev:feishu` only supports the repo-local JSON config flow.',
      ].join('\n'),
    );
  }
}

function prepareRuntimeConfig() {
  fs.mkdirSync(runtimeConfigDir, { recursive: true });
  fs.copyFileSync(configSourcePath, runtimeConfigPath);
}

async function resolveComposeCommand() {
  const candidates = [
    { cmd: 'docker', args: ['compose'] },
    { cmd: 'docker-compose', args: [] },
    { cmd: 'podman', args: ['compose'] },
  ];

  for (const candidate of candidates) {
    try {
      await execa(candidate.cmd, [...candidate.args, 'version'], { stdio: 'ignore', cwd: repoRoot });
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error('No supported compose command found. Install Docker Compose or Podman Compose first.');
}

function getComposeEnv() {
  return {
    ...process.env,
    OPENCLAW_IMAGE: `ghcr.io/openclaw/openclaw:${openclawVersion}`,
    OPENCLAW_UID: String(process.getuid?.() ?? 1000),
    OPENCLAW_GID: String(process.getgid?.() ?? 1000),
    OPENCLAW_HOME_DIR: runtimeHomeDir,
    OPENCLAW_WORKSPACE_DIR: workspaceDir,
  };
}

function printSummary(composeCommand) {
  console.log('Starting Feishu dev gateway via container');
  console.log(`- compose: ${composeCommand.cmd} ${[...composeCommand.args, '-f', path.relative(repoRoot, composeFilePath)].join(' ')}`);
  console.log(`- image: ghcr.io/openclaw/openclaw:${openclawVersion}`);
  console.log(`- config source: ${path.relative(repoRoot, configSourcePath)}`);
  console.log(`- runtime config: ${path.relative(repoRoot, runtimeConfigPath)}`);
  console.log('- stop: Ctrl+C');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureConfigSource();
  prepareRuntimeConfig();

  if (args.dryRun) {
    console.log('Starting Feishu dev gateway via container');
    console.log('- compose: docker compose | docker-compose | podman compose');
    console.log(`- image: ghcr.io/openclaw/openclaw:${openclawVersion}`);
    console.log(`- config source: ${path.relative(repoRoot, configSourcePath)}`);
    console.log(`- runtime config: ${path.relative(repoRoot, runtimeConfigPath)}`);
    console.log(`- compose file: ${path.relative(repoRoot, composeFilePath)}`);
    return;
  }

  const composeCommand = await resolveComposeCommand();
  const composeBaseArgs = [...composeCommand.args, '-f', composeFilePath];
  const env = getComposeEnv();

  printSummary(composeCommand);

  await execa(composeCommand.cmd, [...composeBaseArgs, 'up', '--build', '--remove-orphans'], {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
