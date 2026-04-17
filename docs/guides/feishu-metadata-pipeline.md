# Feishu Metadata Pipeline

本文档定义仓库内 Feishu 元数据的三层职责，以及它们各自的 truth source。

## 原则

- 代码真相源：`src/tools`、`src/commands`
  决定仓库实际暴露了哪些 tool / action、使用了哪些 backend、运行时如何执行。
- 官方真相源：飞书官方快照与其派生 canonical 产物
  决定接口支持哪些 token mode、需要哪些 scope、对应哪些官方文档链接。
- 派生产物不是上游真相源
  `supported-operations`、`canonical-metadata`、`feishu-tool-auth.json`、`feishu-tool-scopes.json` 只用于审阅、校验和运行时消费，不能反向定义代码行为。

## 三层产物

### 1. Code Surface Layer

用于描述“这个仓库实际暴露了什么”。

主要输入：

- `src/tools/**/*.ts`
- `src/commands/index.ts`
- `docs/snapshots/feishu/feishu-server-api-list.json`

主要脚本：

- `node scripts/export_feishu_supported_operations.mjs`
- `node scripts/generate_feishu_implementation_truth_diff.mjs`

主要输出：

- `docs/reports/feishu/feishu-supported-operations.json`
- `docs/reports/feishu/feishu-supported-operations.md`
- `docs/reports/feishu/feishu-implementation-truth-diff.json`
- `docs/reports/feishu/feishu-implementation-truth-diff.md`

说明：

- 这层的 tool、action、backend、source、command 都来自代码静态提取。
- 这层的 `auth` 字段表示代码侧声明/实现观察值，不表示最终官方 auth 契约。
- 这层只附带官方链接和 coverage，不负责产出最终 scope/auth 真相。
- implementation-truth-diff 用于直接审阅“代码声明 auth”和 canonical 真相源之间的差异。

### 2. Official Canonical Layer

用于把“代码声明面”和“官方 capability contract”合并成可审阅的 canonical 元数据。

主要输入：

- `docs/reports/feishu/feishu-supported-operations.json`
- `docs/snapshots/feishu/feishu-server-api-list.json`
- `docs/snapshots/feishu/feishu-scope-list.json`
- `docs/snapshots/feishu/feishu-official-security.json`

主要脚本：

- `python3 scripts/fetch_feishu_server_api_list.py`
- `python3 scripts/fetch_feishu_scope_list.py`
- `node scripts/generate_feishu_official_security_metadata.mjs`
- `node scripts/generate_feishu_canonical_metadata.mjs`
- `node scripts/generate_feishu_skill_coverage.mjs`

主要输出：

- `docs/snapshots/feishu/feishu-official-security.json`
- `docs/reports/feishu/feishu-canonical-metadata.json`
- `docs/reports/feishu/feishu-canonical-metadata.md`
- `docs/reports/feishu/feishu-skill-coverage.json`
- `docs/reports/feishu/feishu-skill-coverage.md`
- `src/core/generated/feishu-tool-auth.json`
- `src/core/generated/feishu-tool-scope-specs.json`

说明：

- 官方 token mode / scope / canonical doc link 以这一层为准。
- 当代码声明 auth 与官方 endpoint contract 冲突，canonical 层负责做最终决策。
- `supported-operations` 在这里是输入之一，不是官方真相源本身。

### 3. Runtime Snapshot Layer

用于把 canonical JSON 规范化成运行时代码直接消费的快照和 TS 包装文件。

主要输入：

- `src/core/generated/feishu-tool-auth.json`
- `src/core/generated/feishu-tool-scope-specs.json`

主要脚本：

- `node scripts/refresh_feishu_runtime_metadata.mjs`

主要输出：

- `src/core/generated/feishu-tool-auth.ts`
- `src/core/generated/feishu-tool-scope-specs.ts`
- `src/core/generated/feishu-tool-scopes.json`
- `src/core/generated/feishu-tool-scopes.ts`
- `src/core/generated/feishu-tool-action-keys.ts`

说明：

- 运行时代码直接消费这层快照。
- 这一层不重新推导官方语义，只做规范化、排序和包装。

## 推荐执行顺序

### 日常只做一致性检查

```bash
pnpm feishu:scope-list:check
pnpm feishu:supported-operations:check
pnpm feishu:implementation-truth-diff:check
pnpm feishu:official-security-metadata:check
pnpm feishu:canonical-metadata:check
pnpm feishu:skill-coverage:check
pnpm feishu:refresh-metadata:check
```

### 需要刷新官方快照时

```bash
python3 scripts/fetch_feishu_server_api_list.py > docs/snapshots/feishu/feishu-server-api-list.json
python3 scripts/fetch_feishu_scope_list.py
pnpm feishu:official-security-metadata
```

### 需要刷新代码声明面产物时

```bash
pnpm feishu:supported-operations
pnpm feishu:implementation-truth-diff
```

### 需要刷新 canonical / reference 产物时

```bash
pnpm feishu:canonical-metadata
pnpm feishu:skill-coverage
```

### 需要刷新 runtime 快照包装层时

```bash
pnpm feishu:refresh-metadata
```

## 维护边界

- 如果改动影响 tool/action/backend 暴露面，先改代码，再更新 `supported-operations`。
- 如果改动来自官方文档、scope list、server api list 或 official security 抓取结果，先更新官方快照，再更新 canonical/runtime 层。
- 不要把 `supported-operations` 当成代码真相源，也不要把 runtime generated 文件当成官方真相源。
- 判断功能实现是否正确，优先看：业务目标、官方 capability contract、仓库内部抽象；最后才看 generated metadata 是否一致。
