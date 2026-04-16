#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execa } from 'execa';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const defaultConfigSourcePath = path.join(repoRoot, 'docker', 'feishu-dev', 'openclaw.json');
const envLocalPath = path.join(repoRoot, '.env.local');
const runtimeHomeDir = path.join(repoRoot, '.artifacts', 'feishu-local-dev', 'home');
const runtimeConfigTargets = [
  path.join(runtimeHomeDir, '.openclaw', 'openclaw.json'),
  path.join(runtimeHomeDir, '.openclaw-dev', 'openclaw.json'),
];
const composeFilePath = path.join(repoRoot, 'docker', 'feishu-dev', 'docker-compose.yml');
const workspaceDir = repoRoot;
const bundledOpenclawVersion = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'node_modules', 'openclaw', 'package.json'), 'utf8'),
).version;

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2] ?? '';
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

function getEffectiveEnv() {
  return {
    ...loadEnvFile(envLocalPath),
    ...process.env,
  };
}

function resolveConfigSourcePath(env) {
  const configuredPath = env.OPENCLAW_DEV_CONFIG_PATH
    ? path.resolve(repoRoot, env.OPENCLAW_DEV_CONFIG_PATH)
    : defaultConfigSourcePath;
  return configuredPath;
}

function ensureConfigSource(configSourcePath) {
  if (!fs.existsSync(configSourcePath)) {
    throw new Error(
      [
        `Missing local Feishu dev config: ${path.relative(repoRoot, configSourcePath)}`,
        'Create that file first, or set OPENCLAW_DEV_CONFIG_PATH in .env.local.',
      ].join('\n'),
    );
  }
}

function resolveDefaultModel(env) {
  if (env.OPENCLAW_AGENT_MODEL?.trim()) return env.OPENCLAW_AGENT_MODEL.trim();
  if (env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim()) {
    return 'google/gemini-3.1-pro-preview';
  }
  return 'openai/gpt-5.4';
}

function prepareRuntimeConfig(configSourcePath, env) {
  const config = JSON.parse(fs.readFileSync(configSourcePath, 'utf8'));
  const localPort = Number(env.OPENCLAW_LOCAL_PORT || config?.gateway?.port || 19001);

  config.gateway ??= {};
  config.gateway.mode ??= 'local';
  config.gateway.bind ??= 'loopback';
  config.gateway.port = localPort;
  config.gateway.auth ??= {};
  config.gateway.auth.mode ??= 'none';
  config.gateway.controlUi ??= {};
  config.gateway.controlUi.allowedOrigins = [
    `http://127.0.0.1:${localPort}`,
    `http://localhost:${localPort}`,
  ];
  config.agents ??= {};
  config.agents.defaults ??= {};
  config.agents.defaults.model = {
    primary: resolveDefaultModel(env),
  };

  for (const runtimeConfigPath of runtimeConfigTargets) {
    fs.mkdirSync(path.dirname(runtimeConfigPath), { recursive: true });
    fs.writeFileSync(runtimeConfigPath, `${JSON.stringify(config, null, 2)}\n`);
  }
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

function resolveOpenclawImage(env) {
  if (env.OPENCLAW_IMAGE) return env.OPENCLAW_IMAGE;
  const version = env.OPENCLAW_DEV_OPENCLAW_VERSION || bundledOpenclawVersion;
  return `ghcr.io/openclaw/openclaw:${version}`;
}

function getComposeEnv(env) {
  const localPort = String(env.OPENCLAW_LOCAL_PORT || 19001);
  return {
    ...env,
    OPENCLAW_IMAGE: resolveOpenclawImage(env),
    OPENCLAW_UID: String(process.getuid?.() ?? 1000),
    OPENCLAW_GID: String(process.getgid?.() ?? 1000),
    OPENCLAW_HOME_DIR: runtimeHomeDir,
    OPENCLAW_WORKSPACE_DIR: workspaceDir,
    OPENCLAW_LOCAL_PORT: localPort,
  };
}

function printSummary(composeCommand, env, configSourcePath) {
  console.log('Starting Feishu dev gateway via container');
  console.log(`- compose: ${composeCommand.cmd} ${[...composeCommand.args, '-f', path.relative(repoRoot, composeFilePath)].join(' ')}`);
  console.log(`- image: ${resolveOpenclawImage(env)}`);
  console.log(`- config source: ${path.relative(repoRoot, configSourcePath)}`);
  console.log(`- runtime config: ${path.relative(repoRoot, runtimeConfigTargets[0])}`);
  console.log(`- agent model: ${resolveDefaultModel(env)}`);
  console.log(`- gateway: http://127.0.0.1:${env.OPENCLAW_LOCAL_PORT || 19001}`);
  console.log('- stop: Ctrl+C');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = getEffectiveEnv();
  const configSourcePath = resolveConfigSourcePath(env);
  ensureConfigSource(configSourcePath);
  prepareRuntimeConfig(configSourcePath, env);

  if (args.dryRun) {
    console.log('Starting Feishu dev gateway via container');
    console.log('- compose: docker compose | docker-compose | podman compose');
    console.log(`- image: ${resolveOpenclawImage(env)}`);
    console.log(`- config source: ${path.relative(repoRoot, configSourcePath)}`);
    console.log(`- runtime config: ${path.relative(repoRoot, runtimeConfigTargets[0])}`);
    console.log(`- compose file: ${path.relative(repoRoot, composeFilePath)}`);
    console.log(`- agent model: ${resolveDefaultModel(env)}`);
    console.log(`- gateway: http://127.0.0.1:${env.OPENCLAW_LOCAL_PORT || 19001}`);
    return;
  }

  const composeCommand = await resolveComposeCommand();
  const composeBaseArgs = [...composeCommand.args, '-f', composeFilePath];
  const composeEnv = getComposeEnv(env);

  printSummary(composeCommand, env, configSourcePath);

  await execa(composeCommand.cmd, [...composeBaseArgs, 'up', '--build', '--remove-orphans'], {
    cwd: repoRoot,
    env: composeEnv,
    stdio: 'inherit',
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
