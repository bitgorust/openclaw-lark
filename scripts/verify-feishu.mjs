#!/usr/bin/env node

import process from 'node:process';
import { execa } from 'execa';

const steps = [
  ['build', ['pnpm', 'build']],
  ['official-security', ['pnpm', 'feishu:official-security-metadata:check']],
  ['canonical-metadata', ['pnpm', 'feishu:canonical-metadata:check']],
  ['runtime-metadata', ['pnpm', 'feishu:refresh-metadata:check']],
  ['typecheck', ['pnpm', 'typecheck']],
  [
    'targeted-tests',
    [
      'pnpm',
      'test',
      '--',
      '--run',
      'tests/approval-tools.test.ts',
      'tests/approval-tool-execute.test.ts',
      'tests/message-read.test.ts',
      'tests/tool-client-owner-policy.test.ts',
    ],
  ],
];

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

function printManualNextSteps() {
  console.log('');
  console.log('Automated verification passed.');
  console.log('Manual Feishu verification:');
  console.log('1. Run `pnpm dev:feishu`.');
  console.log('2. In Feishu, send `/feishu start` and confirm the plugin responds.');
  console.log('3. Exercise the changed Feishu flow manually before pushing.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.dryRun) {
    for (const [label, command] of steps) {
      console.log(`${label}: ${command.join(' ')}`);
    }
    printManualNextSteps();
    return;
  }

  for (const [label, command] of steps) {
    console.log(`\n[verify:feishu] ${label}`);
    await execa(command[0], command.slice(1), { stdio: 'inherit' });
  }

  printManualNextSteps();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
