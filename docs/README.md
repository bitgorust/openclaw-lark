# Docs Layout

`docs/` 只保留三类长期维护文档：

- `docs/guides/`: 维护规范、流程说明、发布约定。
- `docs/snapshots/feishu/`: 飞书官方 truth-source 快照。
- `docs/reports/feishu/`: 基于代码与官方快照生成的审阅报告。

边界约束：

- 运行时直接消费的 generated 快照继续放在 `src/core/generated/`。
- `docs/snapshots/feishu/` 只放官方来源或官方页面固化快照，不放仓库自行推导结果。
- `docs/reports/feishu/` 只放可再生成的分析/覆盖/差异报告。

Feishu 元数据链路与执行顺序见 [guides/feishu-metadata-pipeline.md](/data/Workspace/openclaw-lark/docs/guides/feishu-metadata-pipeline.md)。
