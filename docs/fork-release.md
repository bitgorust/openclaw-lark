# Fork 发布规范

本文档约束公司 fork 仓库 `origin` 与官方仓库 `upstream` 的长期同步、版本命名和私有 NPM 发布方式。

## 目标

- 保持 `main` 尽量贴近 `upstream/main`
- 将公司定制改动收敛在少量文件，降低同步冲突
- 从 `main` 打 tag 发布，不长期维护 `release` 分支
- 始终发布到公司私有 NPM：`http://116.63.93.45:4873/`

## 当前约定

- 上游仓库：`upstream=https://github.com/larksuite/openclaw-lark.git`
- 公司 fork：`origin=git@gitlab.laihua.com:openclaw/openclaw-lark.git`
- 私有 NPM：`http://116.63.93.45:4873/`
- 当前包名：`@laipic/openclaw-lark`
- 私有发布配置集中在：
  - `package.json`
  - `.npmrc`
  - `docs/fork-release.md`

## 分支策略

- `main` 是长期集成分支，用于承接 upstream 同步和公司改动
- 不直接在 `main` 上开发，所有改动都从短生命周期分支发起
- 不维护长期 `release/*` 分支，发布以 tag 为边界

推荐分支命名：

- `chore/sync-upstream-2026.4.1`
- `chore/private-registry-publish`
- `fix/internal-publish-config`
- `feat/<topic>`

## 版本和 Tag 规则

为同时保留 upstream 版本语义和内部发布序号，推荐使用 fork 后缀：

- `2026.4.1-laihua.1`
- `2026.4.1-laihua.2`
- `2026.4.2-laihua.1`

推荐 tag 与版本号保持一致：

- `v2026.4.1-laihua.1`

规则：

- 同步到新的 upstream 基线时，内部序号重置为 `.1`
- 同一个 upstream 基线上的内部补丁递增 `.2`、`.3`
- 不发布无 tag 的提交
- 发布配置分支不承载具体发布版本号，版本号只在实际发布前调整

## 推荐工作流

### 1. 同步 upstream

```bash
git fetch upstream
git checkout main
git pull origin main
git checkout -b chore/sync-upstream-2026.4.1
git merge upstream/main
```

如果冲突集中在发布配置文件，优先保留公司 fork 的以下约定：

- `package.json` 中的发布脚本和 `publishConfig`
- `.npmrc` 中的私库 registry 映射
- 本文档中的发布规则

### 2. 处理公司定制改动

公司定制改动尽量收敛在以下文件：

- `package.json`
- `.npmrc`
- `docs/fork-release.md`

### 3. 验证

```bash
NODE_SDK_ROOT=/path/to/larksuite-node-sdk pnpm release:prepare
```

这会执行：

- `pnpm feishu:supported-operations:check`
- `pnpm feishu:canonical-metadata:check`
- `pnpm feishu:skill-coverage:check`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `npm pack`

检查点：

- `dist/`、`skills/`、`openclaw.plugin.json` 被正确打包
- Feishu truth-source 产物与技能覆盖产物没有漂移
- publish registry 指向公司私库

### 4. 合并到 main

通过 MR 合并，不直接向 `main` push。

建议 MR 标题：

- `chore: configure private npm publishing`
- `fix: adjust internal package publish metadata`
- `chore: release 2026.4.1-laihua.1`

### 5. 发布

首次登录私库：

```bash
pnpm login:private
```

更新版本号后发布：

```bash
npm version 2026.4.1-laihua.1 --no-git-tag-version
pnpm publish:private
git tag v2026.4.1-laihua.1
git push origin main
git push origin v2026.4.1-laihua.1
```

如果只想先验证包内容：

```bash
npm_config_cache=/tmp/npm-cache npm pack --dry-run
```

## 手动发布最简流程

当前仓库没有 GitLab runner，默认采用手动发布。

### 1. 先合并发布配置

```bash
git checkout main
git pull origin main
git merge --ff-only chore/private-registry-publish
git push origin main
```

### 2. 发布时再单独改版本号

```bash
git checkout main
git pull origin main
git checkout -b chore/release-2026.4.1-laihua.1
npm version 2026.4.1-laihua.1 --no-git-tag-version
```

### 3. 本地验证

```bash
NODE_SDK_ROOT=/path/to/larksuite-node-sdk pnpm release:prepare
```

### 4. 提交发布版本

```bash
git add package.json
git commit -m "chore: release 2026.4.1-laihua.1"
```

### 5. 合回 main 并打 tag

```bash
git checkout main
git merge --ff-only chore/release-2026.4.1-laihua.1
git tag v2026.4.1-laihua.1
```

### 6. 发布到私库

```bash
pnpm login:private
pnpm publish:private
git push origin main
git push origin v2026.4.1-laihua.1
```

## 注意事项

- `NODE_SDK_ROOT` 是 Feishu canonical metadata 校验的正式输入
- `scripts/generate_feishu_canonical_metadata.mjs` 只保留同级 `../node-sdk` 作为本地开发兜底，不再依赖机器专属路径
- `npm version` 默认会自动创建 commit 和 tag，当前仓库建议使用 `--no-git-tag-version`
- 版本号变更应只出现在实际发布分支，不应混入发布配置分支
- 如果发布失败，不要复用同一个版本号重复发布
