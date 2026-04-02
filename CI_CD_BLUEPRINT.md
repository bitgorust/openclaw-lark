# CI/CD Blueprint

This document is a concrete CI/CD implementation reference for this fork's Git workflow.

It started as a pre-change blueprint. The repository CI has now been updated to follow the branch-role split described here, but this document still exists to explain the intended model and the constraints behind it, especially for future CI edits:

- if `.gitlab-ci.yml` is changed, the final content must be checked in GitLab Web CI Lint before commit
- GitLab CE 11.6 compatibility matters more than using newer CI syntax casually

Use this document as the policy reference for future CI/CD changes.

## 1. Current State

At the time of writing:

- [`.gitlab-ci.yml`](/data/Workspace/openclaw-lark/.gitlab-ci.yml) runs `lint`, `format:check`, `typecheck`, `test`, and `build`
- [`.github/workflows/ci.yml`](/data/Workspace/openclaw-lark/.github/workflows/ci.yml) runs on `main` push and `main` PR, but currently does not run `pnpm build`
- release automation exists in [`scripts/release.mjs`](/data/Workspace/openclaw-lark/scripts/release.mjs)
- release policy is documented in [`RELEASING.md`](/data/Workspace/openclaw-lark/RELEASING.md)

This means the repo now has the basic CI/CD structure in place, but future changes should continue to preserve explicit branch intent and conservative GitLab CE compatibility.

## 2. Target CI/CD Model

The target model is:

1. PR branches run validation CI
2. `main` runs integration CI
3. `release/*` branches or release tags run release packaging and optional deployment

That separation matches the fork's purpose:

- development branches validate changes
- `main` validates the maintained fork baseline
- release controls authorize actual delivery

## 3. Required Job Sets

### PR validation jobs

Run on feature and maintenance branches through PR or MR flow.

Required commands:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Goal:

1. reject broken changes before they hit `main`
2. enforce the repository's definition of done

### `main` integration jobs

Run on updates to `main`.

Required commands:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Optional additions:

1. `npm pack --json`
2. release script dry run without tagging or publishing

Goal:

1. keep `main` continuously releasable
2. catch packaging regressions after upstream syncs or integration merges

### Release jobs

Run only on one of:

1. `release/*` branch updates
2. version tags such as `v2026.4.10-lh.1`

Required commands:

```bash
pnpm install --frozen-lockfile
pnpm release -- --version <version> --upstream-base <upstream-version> --openclaw-version <openclaw-version>
```

Expected outputs:

1. npm tarball in `release/`
2. runtime package archive in `release/`
3. checksum files
4. release note scaffold
5. machine-readable release summary

Goal:

1. produce traceable release artifacts
2. separate integration from deployment

## 4. GitLab CI Blueprint

Because this repo targets GitLab CE 11.6.x, keep the GitLab pipeline conservative:

1. avoid relying on newer syntax unless confirmed compatible
2. prefer simple `only` and `except` or carefully limited `rules` use
3. keep release jobs explicit

### Recommended stages

```yaml
stages:
  - verify
  - package
  - deploy
```

### Recommended GitLab job split

Use:

1. verify jobs for all active development branches and `main`
2. package job for `release/*` and tags
3. deploy job only for protected release branches or tags

### Example GitLab draft

This is the reference shape for the GitLab pipeline. Any future edits still need GitLab Web CI Lint validation before commit:

```yaml
stages:
  - verify
  - package

.node_job: &node_job
  image: node:22
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  cache:
    key: pnpm
    paths:
      - .pnpm-store
  variables:
    PNPM_HOME: /root/.local/share/pnpm
    PNPM_STORE_DIR: .pnpm-store

.verify_job: &verify_job
  <<: *node_job
  stage: verify
  only:
    - branches
    - merge_requests
  except:
    - tags

lint:
  <<: *verify_job
  script:
    - pnpm lint

format_check:
  <<: *verify_job
  script:
    - pnpm format:check

typecheck:
  <<: *verify_job
  script:
    - pnpm typecheck

test:
  <<: *verify_job
  script:
    - pnpm test

build:
  <<: *verify_job
  script:
    - pnpm build

package_release:
  <<: *node_job
  stage: package
  only:
    - /^release\/.*$/
    - tags
  script:
    - pnpm build
    - pnpm release -- --skip-install --version "${CI_COMMIT_TAG#v}" --openclaw-version 2026.3.31
  artifacts:
    paths:
      - release/
```

### Important GitLab implementation notes

Before changing the GitLab pipeline again:

1. validate the exact YAML in GitLab Web CI Lint
2. confirm whether regex `only` patterns behave as expected on the target GitLab CE version
3. confirm shell parameter expansion such as `${CI_COMMIT_TAG#v}` behaves correctly in the runner shell
4. decide whether branch-triggered release packaging should infer version from `package.json` instead of `CI_COMMIT_TAG`

Because those details are version-sensitive, they should be confirmed before committing further edits to [`.gitlab-ci.yml`](/data/Workspace/openclaw-lark/.gitlab-ci.yml).

## 5. GitHub Actions Blueprint

GitHub Actions should stay aligned with GitLab CI for verification scope, even if GitLab is the primary operational platform.

### Recommended trigger model

1. run CI on `main` push
2. run CI on PRs targeting `main`
3. optionally run CI on pushes to `feat/*`, `fix/*`, `docs/*`, `chore/*`, and `fork/*` if GitHub is also used for branch validation
4. run release packaging on version tags if GitHub Releases are used

### Minimum CI job shape

```yaml
name: CI

on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
      - 'docs/**'
      - 'chore/**'
      - 'fork/**'
  pull_request:
    branches:
      - main

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

The immediate gap to close in [`.github/workflows/ci.yml`](/data/Workspace/openclaw-lark/.github/workflows/ci.yml) is adding `pnpm build` so GitHub CI matches the repository readiness standard.

## 6. Release Pipeline Inputs

Any release pipeline should take explicit inputs for:

1. release version
2. upstream base version
3. OpenClaw runtime version

Do not rely on informal operator memory for these values.

Preferred sources:

1. git tag for release version
2. CI variables for upstream base and runtime version
3. `package.json` only as a fallback default

## 7. Recommended Secrets and Protected Variables

Keep deployment credentials unavailable to ordinary development branches.

Recommended protected variables:

1. artifact registry credentials
2. object storage credentials
3. release signing credentials if introduced later
4. production deployment credentials

Scope these variables to:

1. protected `main` only if strictly needed
2. protected `release/*` branches
3. protected release tags

Do not expose deployment credentials to `feat/*`, `fix/*`, or `fork/*` validation pipelines.

## 8. Branch Protection Blueprint

Recommended repository controls:

### `main`

1. protected
2. direct push limited to maintainers
3. merge requires green CI
4. normal development must arrive through PR or MR

### `release/*`

1. protected
2. creation limited to maintainers
3. packaging and deployment jobs allowed

### tags `v*`

1. creation limited to maintainers
2. release jobs allowed

## 9. Recommended Rollout Order

Implement CI/CD in this order:

1. align GitHub CI with repository readiness checks by adding `pnpm build`
2. update GitLab CI to make branch intent explicit while preserving current verify coverage
3. add a non-deploying release packaging job that only produces artifacts
4. validate release artifacts and rollback procedure
5. only then add actual deployment jobs

This order reduces operational risk. Artifact production is easier to audit than a full deployment pipeline.

## 10. Next Maintenance Step

The next safe maintenance step is:

1. keep GitHub Actions and GitLab CI aligned when readiness checks change
2. validate any future [`.gitlab-ci.yml`](/data/Workspace/openclaw-lark/.gitlab-ci.yml) edits in GitLab Web CI Lint before commit
3. document any GitLab 11.6 syntax limitations discovered during future CI changes
4. add deployment jobs only after artifact packaging and rollback procedures are considered stable

This document should remain the reference point for future CI/CD changes, not drift behind the actual pipeline behavior.
