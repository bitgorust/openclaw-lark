---
name: feishu-approval
description: |
  飞书审批工具。用于列出审批实例、查看审批详情，以及执行同意、拒绝、转交、退回审批任务。

  **当以下情况时使用此 Skill**:
  (1) 用户要查审批单、审批实例、审批进度、审批详情
  (2) 用户要同意、拒绝、转交、退回审批
  (3) 用户提到“审批”、“请假”、“加班”、“报销”、“审批单”、“approval”
  (4) 需要先找审批实例，再对其中的审批任务进行操作
---

# 飞书审批管理

## 执行前必读

- `feishu_approval_instance.list` 必填：`approval_code`, `start_time`, `end_time`
- `feishu_approval_instance.get` 必填：`instance_id`
- `feishu_approval_task.approve/reject/transfer` 必填：`approval_code`, `instance_id`, `task_id`
- `feishu_approval_task.transfer` 额外必填：`transfer_user_id`
- `feishu_approval_task.rollback` 必填：`task_id`, `reason`, `task_def_key_list`
- 时间优先使用 ISO 8601 / RFC 3339（带时区），例如 `2026-04-02T09:00:00+08:00`
- 任务操作默认把当前消息发送者的 `SenderId` 当作 `user_id`

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 列某审批定义在时间窗内的实例 | `feishu_approval_instance` | `list` | `approval_code`, `start_time`, `end_time` | `page_size`, `page_token`, `include_details` |
| 查单个审批实例详情 | `feishu_approval_instance` | `get` | `instance_id` | `locale`, `user_id` |
| 同意审批任务 | `feishu_approval_task` | `approve` | `approval_code`, `instance_id`, `task_id` | `comment` |
| 拒绝审批任务 | `feishu_approval_task` | `reject` | `approval_code`, `instance_id`, `task_id` | `comment` |
| 转交审批任务 | `feishu_approval_task` | `transfer` | `approval_code`, `instance_id`, `task_id`, `transfer_user_id` | `comment` |
| 退回到已审批节点 | `feishu_approval_task` | `rollback` | `task_id`, `reason`, `task_def_key_list` | `extra` |

## 推荐工作流

### 1. 先定位实例，再操作任务

审批操作通常不是“凭空执行”，推荐顺序是：

1. 用 `feishu_approval_instance.list` 在明确的时间窗口内列出实例
2. 从返回里确认 `instance_id`、`status`、`approvers`、`tasks`
3. 必要时再用 `feishu_approval_instance.get` 看完整详情
4. 找到待处理的 `task_id` 后，再调用 `feishu_approval_task.*`

### 2. `approval_code` 不清楚时不要硬猜

`list` 依赖 `approval_code`。如果用户只说“查我的审批”但没有给审批定义范围，不要伪造参数。

优先做法：
- 让用户补充审批类型或审批定义
- 或者让用户先提供具体实例 ID，再走 `get`

### 3. 退回不是按实例整体退回，而是按节点退回

`rollback` 需要：
- 当前 `task_id`
- 退回原因 `reason`
- 目标节点列表 `task_def_key_list`

也就是必须先从实例详情里确认可退回的历史节点 key，再执行退回。

## 结果怎么读

`feishu_approval_instance.get/list` 的归一化结果优先看这些字段：

- `instance_id`
- `approval_code`
- `title`
- `status`
- `applicant`
- `approvers`
- `create_time`
- `finish_time`
- `pending`
- `tasks`

其中：
- `pending = true` 说明实例当前仍在审批中
- `tasks` 里能直接拿到 `task_id`、`node_id`、`node_name`、`status`、`user_id`
- 完整原始数据保留在 `raw`

## 常见场景示例

### 查某类审批最近 7 天实例

```json
{
  "action": "list",
  "approval_code": "7C468A54-EXAMPLE",
  "start_time": "2026-03-26T00:00:00+08:00",
  "end_time": "2026-04-02T23:59:59+08:00",
  "include_details": true
}
```

### 查看单个审批详情

```json
{
  "action": "get",
  "instance_id": "6899123456789012345"
}
```

### 同意审批任务

```json
{
  "action": "approve",
  "approval_code": "7C468A54-EXAMPLE",
  "instance_id": "6899123456789012345",
  "task_id": "7012345678901234567",
  "comment": "同意"
}
```

### 转交审批任务

```json
{
  "action": "transfer",
  "approval_code": "7C468A54-EXAMPLE",
  "instance_id": "6899123456789012345",
  "task_id": "7012345678901234567",
  "transfer_user_id": "ou_xxx",
  "comment": "请你继续处理"
}
```

### 退回审批任务

```json
{
  "action": "rollback",
  "task_id": "7012345678901234567",
  "reason": "补充报销附件后再提交",
  "task_def_key_list": ["START", "MANAGER_REVIEW"]
}
```

## 常见错误与处理

| 错误类型 | 含义 | 处理方式 |
|---------|------|---------|
| `not_found` | 实例或任务不存在，或 ID 不匹配 | 重新核对 `instance_id` / `task_id` / `approval_code` |
| `already_processed` | 任务已被处理，不能重复操作 | 先刷新实例详情，确认最新状态 |
| `permission_denied` | 当前应用或操作人无权限 | 检查应用审批权限和实际操作人 |
| `api_error` | 其他飞书审批 API 错误 | 查看 `message` 与 `raw`，不要自行臆测成功 |

## 操作原则

- 批准、拒绝、转交前，先确认当前任务仍处于待处理状态
- 用户要求“退回”时，先解释需要可退回节点 key，不要直接瞎填 `task_def_key_list`
- 用户如果只给了实例 ID，没有任务 ID，不要直接做 approve/reject/transfer；先从详情里找目标任务
- 不要扩展到创建审批、评论、抄送、查询“我的全部待审批”等 Phase 2 能力
