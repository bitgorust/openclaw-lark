# Repository Guidelines

## Project Structure & Module Organization
Core plugin code lives in `src/`, grouped by responsibility: `core/` for runtime and shared services, `channel/` for Feishu channel integration, `messaging/` for inbound/outbound message handling, `card/` for interactive card rendering, and `tools/` for OpenAPI-backed capabilities such as docs, drive, tasks, and calendar. The package entrypoint is [`index.ts`](/data/Workspace/openclaw-lark/index.ts), and the CLI shim is in `bin/openclaw-lark.js`. Tests live in `tests/` and follow feature-oriented names such as `reply-dispatcher-media.test.ts`. Plugin metadata is defined in `openclaw.plugin.json`.

## Build, Test, and Development Commands
Use Node `>=22` and `pnpm` `10.x`.

- `pnpm build`: compile the plugin into `dist/` with `tsdown`.
- `pnpm test`: run the Vitest suite once.
- `pnpm test:watch`: run tests in watch mode during development.
- `pnpm lint`: lint `src/` and `index.ts` with ESLint.
- `pnpm lint:fix`: apply safe lint fixes.
- `pnpm typecheck`: run TypeScript without emitting files.
- `pnpm format` / `pnpm format:check`: format or verify `src/**/*.ts` with Prettier.

## Coding Style & Naming Conventions
This repository is TypeScript-first and ESM-only. Follow the existing style: 2-space indentation, semicolons, and single quotes. Prefer `interface` over `type` for object shapes, and use `import type` where appropriate. Keep filenames lowercase with hyphen-separated words, matching existing patterns like `dispatch-context.ts` or `message-read.ts`. Prefix intentionally unused variables with `_` to satisfy ESLint.

## Testing Guidelines
Tests use Vitest and should be placed under `tests/` with the `*.test.ts` suffix. Add or update focused tests alongside behavioral changes, especially for message conversion, card rendering, and tool adapters. Run `pnpm test` before opening a PR; use `pnpm test:watch` while iterating locally. There is no explicit coverage gate in the repo, so maintain practical coverage around changed code paths.

## Commit & Pull Request Guidelines
Recent history uses concise Conventional Commit style such as `fix: markdown empty row` and scoped subjects like `feat(plugin, lark-client): ...`. Keep commit messages imperative and specific. For pull requests, include a short problem statement, the approach taken, test coverage notes, and screenshots or card payload examples when UI/card behavior changes. Link related issues when available.

## Fork Maintenance
Treat this repository as an upstream-first fork. Keep `main` close to `upstream/main`, implement fixes and general features in an upstreamable form by default, and isolate fork-only behavior behind configuration or narrowly scoped files. Do not mix upstreamable and fork-only changes in the same commit; maintainers should be able to cherry-pick the shared subset directly into an upstream PR. See [`MAINTAINING.md`](/data/Workspace/openclaw-lark/MAINTAINING.md) for the branch model and sync policy.

## Security & Configuration Tips
Do not weaken default permission or policy checks casually. Review Feishu/OpenAPI scope changes carefully, and avoid committing secrets, app credentials, or tenant-specific configuration.

## Feishu Metadata
When modifying Feishu scope/auth/reference metadata, keep the truth-source / canonical layer and the runtime snapshot layer distinct. See [`docs/guides/feishu-metadata-pipeline.md`](/data/Workspace/openclaw-lark/docs/guides/feishu-metadata-pipeline.md) for the maintained scripts, generated files, execution order, and external dependencies such as `NODE_SDK_ROOT`.

## Feishu Truth-Source Principles
- Treat code as the truth source for what this plugin exposes: tool existence, action names, backend usage, and runtime behavior must be derived from `src/tools` and `src/commands`, then reflected into generated references such as `supported-operations`.
- Treat official Feishu references as the truth source for external capability contracts: token modes, scopes, and canonical API/docs linkage must come from official snapshots and derived canonical metadata, not from local generated artifacts.
- Do not reverse the dependency direction: never use `supported-operations` or other generated metadata as the source of truth to review or reshape code behavior.
- Implement Feishu features from three inputs, in order: product intent, official Feishu capability boundaries, and this repository's internal abstractions. Generated metadata is for consistency checking and runtime consumption, not for defining behavior.
