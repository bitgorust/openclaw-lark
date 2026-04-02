#!/usr/bin/env node

import { execa } from 'execa';
import fs from 'fs-extra';
import minimist from 'minimist';
import path from 'node:path';
import process from 'node:process';

const argv = minimist(process.argv.slice(2), {
  boolean: ['skip-install', 'skip-verify', 'allow-dirty', 'help'],
  string: ['version', 'upstream-base', 'release-dir'],
  alias: {
    v: 'version',
    h: 'help',
  },
  default: {
    'release-dir': 'release',
  },
});

if (argv.help) {
  printUsage();
  process.exit(0);
}

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'package.json');
const releaseDir = path.join(repoRoot, argv['release-dir']);

async function main() {
  const packageJson = await fs.readJson(packageJsonPath);
  const currentVersion = packageJson.version;
  const version = argv.version || currentVersion;

  validateVersion(version);

  if (!argv['allow-dirty']) {
    await ensureCleanWorkingTree();
  }

  const upstreamBase = argv['upstream-base'] || inferUpstreamBase(version);
  if (!upstreamBase) {
    throw new Error('Cannot infer upstream base. Pass --upstream-base explicitly.');
  }

  const headSha = (await exec('git', ['rev-parse', 'HEAD'])).stdout.trim();
  const shortSha = headSha.slice(0, 12);

  if (currentVersion !== version) {
    packageJson.version = version;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  const verificationSteps = [
    {
      label: 'install',
      command: 'pnpm install --frozen-lockfile',
      run: !argv['skip-install'],
    },
    {
      label: 'lint',
      command: 'pnpm lint',
      run: !argv['skip-verify'],
    },
    {
      label: 'format',
      command: 'pnpm format:check',
      run: !argv['skip-verify'],
    },
    {
      label: 'typecheck',
      command: 'pnpm typecheck',
      run: !argv['skip-verify'],
    },
    {
      label: 'test',
      command: 'pnpm test',
      run: !argv['skip-verify'],
    },
    {
      label: 'build',
      command: 'pnpm build',
      run: true,
    },
  ];

  for (const step of verificationSteps) {
    if (!step.run) {
      continue;
    }

    const [file, ...args] = step.command.split(' ');
    await exec(file, args, { stdio: 'inherit' });
  }

  await fs.ensureDir(releaseDir);
  const packResult = await exec('npm', ['pack', '--json'], { stdio: 'pipe' });
  const packJson = JSON.parse(packResult.stdout);
  const packedFile = packJson[0]?.filename;

  if (!packedFile) {
    throw new Error('npm pack did not return a tarball filename.');
  }

  const packedPath = path.join(repoRoot, packedFile);
  const targetTarballPath = path.join(releaseDir, packedFile);
  await fs.move(packedPath, targetTarballPath, { overwrite: true });

  const checksumResult = await exec('sha256sum', [targetTarballPath]);
  const checksum = checksumResult.stdout.trim();
  const checksumPath = `${targetTarballPath}.sha256`;
  await fs.writeFile(checksumPath, `${checksum}\n`);

  const releaseNotePath = path.join(releaseDir, `release-note-${version}.md`);
  await fs.writeFile(
    releaseNotePath,
    buildReleaseNote({
      version,
      upstreamBase,
      headSha: shortSha,
      tarballName: path.basename(targetTarballPath),
      checksum,
      verificationSteps,
    }),
  );

  const summaryPath = path.join(releaseDir, `release-summary-${version}.json`);
  await fs.writeJson(
    summaryPath,
    {
      version,
      upstreamBase,
      commit: headSha,
      tarball: path.relative(repoRoot, targetTarballPath),
      checksumFile: path.relative(repoRoot, checksumPath),
      releaseNote: path.relative(repoRoot, releaseNotePath),
      verification: verificationSteps.map((step) => ({
        label: step.label,
        command: step.command,
        status: step.run ? 'passed' : 'skipped',
      })),
    },
    { spaces: 2 },
  );

  console.log(`Release artifacts written to ${path.relative(repoRoot, releaseDir)}`);
  console.log(`Tarball: ${path.relative(repoRoot, targetTarballPath)}`);
  console.log(`Checksum: ${path.relative(repoRoot, checksumPath)}`);
  console.log(`Release note: ${path.relative(repoRoot, releaseNotePath)}`);
}

function printUsage() {
  console.log(`Usage:
  pnpm release -- --version 2026.4.1-lh.1 [--upstream-base 2026.4.1]

Options:
  --version         Target release version. Defaults to package.json version.
  --upstream-base   Upstream base version. Defaults to the part before the first fork suffix.
  --release-dir     Output directory for tarball and release files. Defaults to release.
  --skip-install    Skip pnpm install --frozen-lockfile.
  --skip-verify     Skip lint, format, typecheck, and test.
  --allow-dirty     Allow a dirty git working tree.
  --help            Show this message.
`);
}

function validateVersion(version) {
  if (!/^\d{4}\.\d{1,2}\.\d{1,2}([.-][0-9A-Za-z]+(\.[0-9A-Za-z]+)*)?$/.test(version)) {
    throw new Error(`Invalid version format: ${version}`);
  }
}

function inferUpstreamBase(version) {
  const match = version.match(/^(\d{4}\.\d{1,2}\.\d{1,2})/);
  return match?.[1] ?? null;
}

async function ensureCleanWorkingTree() {
  const status = (await exec('git', ['status', '--short'])).stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.endsWith('.codex'));

  if (status.length > 0) {
    throw new Error(`Working tree is not clean:\n${status.join('\n')}`);
  }
}

async function exec(file, args, options = {}) {
  return execa(file, args, {
    cwd: repoRoot,
    ...options,
  });
}

function buildReleaseNote({
  version,
  upstreamBase,
  headSha,
  tarballName,
  checksum,
  verificationSteps,
}) {
  const verificationLines = verificationSteps
    .map((step) => `- ${step.label}: ${step.run ? 'pass' : 'skipped'}`)
    .join('\n');

  return `Version: ${version}
Upstream base: ${upstreamBase}
Commit: ${headSha}
Tarball: ${tarballName}
SHA256: ${checksum}

Included:
- fix:
- feat:

Fork-only:
- none / describe here

Upstream status:
- already merged upstream:
- proposed upstream:
- not yet proposed:

Verification:
${verificationLines}

Deployment:
- target instance:
- maintenance window:
- previous known-good version:
- rollback artifact:

Post-deploy checks:
- /feishu start
- /feishu doctor
- DM smoke test
- authorized tool smoke test
`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
