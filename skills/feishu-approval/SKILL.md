---
name: feishu-approval
description: |
  飞书审批工具。用于查询审批任务队列、审批抄送列表、列出审批实例、查看审批详情，以及执行同意、拒绝、转交、退回审批任务。

  **当以下情况时使用此 Skill**:
  (1) 用户要查审批单、审批实例、审批进度、审批详情
  (2) 用户要查抄送给我的审批、审批抄送列表
  (3) 用户要同意、拒绝、转交、退回审批
  (4) 用户提到“审批”、“请假”、“加班”、“报销”、“审批单”、“approval”
  (5) 需要先找审批实例，再对其中的审批任务进行操作
---

# 飞书审批管理

## 执行前必读

- `feishu_approval_task_search.query` 必填：`topic`
- `feishu_approval_task_search.search` 无绝对必填，但应尽量提供明确过滤条件
- `feishu_approval_cc.search` 无绝对必填，但应尽量提供明确过滤条件
- `feishu_approval_comment.create` 必填：`instance_id`, `content`
- `feishu_approval_comment.list` 必填：`instance_id`
- `feishu_approval_comment.delete` 必填：`instance_id`, `comment_id`
- `feishu_approval_comment.remove` 必填：`instance_id`
- `feishu_approval_instance.list` 必填：`approval_code`, `start_time`, `end_time`
- `feishu_approval_instance.get` 必填：`instance_id`
- `feishu_approval_task.approve/reject/transfer` 必填：`approval_code`, `instance_id`, `task_id`
- `feishu_approval_task.add_sign` 必填：`approval_code`, `instance_id`, `task_id`, `add_sign_user_ids`, `add_sign_type`
- `feishu_approval_task.resubmit` 必填：`approval_code`, `instance_id`, `task_id`, `form`
- `feishu_approval_task.transfer` 额外必填：`transfer_user_id`
- `feishu_approval_task.rollback` 必填：`task_id`, `reason`, `task_def_key_list`
- 时间优先使用 ISO 8601 / RFC 3339（带时区），例如 `2026-04-02T09:00:00+08:00`
- 任务操作默认把当前消息发送者的 `SenderId` 当作 `user_id`
- `feishu_approval_task_search.query` 面向“待我审批 / 我发起的 / 抄送我的 / 我已审批 / 我已转交”等任务分组；当前 canonical contract 是 dual-mode，运行时仍优先 user，缺用户授权时可走自动授权或回退
- `feishu_approval_task_search.search` 面向复杂条件检索，当前按 tenant / app 身份执行，不要把它当成个人任务分组队列的默认入口
- `feishu_approval_cc`、`feishu_approval_comment`、`feishu_approval_instance`、`feishu_approval_task` 当前都按 tenant / app 身份执行，不应再假设“默认优先用户态”
- 审批域查询正在从实例查询扩展到任务查询。优先根据用户目标选择 task queue 查询或实例查询，而不是固定只走实例列表
- 如果用户要处理某一条审批，优先让其提供 `task_id`、`instance_id`、审批链接，或一条具体审批通知消息

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 查任务队列（待我审批 / 我发起的 / 抄送我的 / 我已审批 / 我已转交） | `feishu_approval_task_search` | `query` | `topic` | `user_id`, `page_size`, `page_token` |
| 按条件搜索审批任务 | `feishu_approval_task_search` | `search` | 无绝对必填 | `user_id`, `approval_code`, `instance_code`, `task_title`, `task_status`, `task_start_time_from`, `task_start_time_to`, `page_size`, `page_token` |
| 按条件搜索审批抄送列表 | `feishu_approval_cc` | `search` | 无绝对必填 | `user_id`, `approval_code`, `instance_code`, `cc_title`, `read_status`, `cc_create_time_from`, `cc_create_time_to`, `page_size`, `page_token` |
| 列出某审批实例评论 | `feishu_approval_comment` | `list` | `instance_id` | `page_size`, `page_token`, `user_id` |
| 创建或回复审批评论 | `feishu_approval_comment` | `create` | `instance_id`, `content` | `parent_comment_id`, `at_info_list`, `disable_bot`, `extra` |
| 删除单条审批评论 | `feishu_approval_comment` | `delete` | `instance_id`, `comment_id` | `user_id` |
| 清空某审批实例评论 | `feishu_approval_comment` | `remove` | `instance_id` | `user_id` |
| 列某审批定义在时间窗内的实例 | `feishu_approval_instance` | `list` | `approval_code`, `start_time`, `end_time` | `page_size`, `page_token`, `include_details` |
| 查单个审批实例详情 | `feishu_approval_instance` | `get` | `instance_id` | `locale`, `user_id` |
| 同意审批任务 | `feishu_approval_task` | `approve` | `approval_code`, `instance_id`, `task_id` | `comment` |
| 拒绝审批任务 | `feishu_approval_task` | `reject` | `approval_code`, `instance_id`, `task_id` | `comment` |
| 转交审批任务 | `feishu_approval_task` | `transfer` | `approval_code`, `instance_id`, `task_id`, `transfer_user_id` | `comment` |
| 审批任务加签 | `feishu_approval_task` | `add_sign` | `approval_code`, `instance_id`, `task_id`, `add_sign_user_ids`, `add_sign_type` | `comment`, `approval_method` |
| 审批任务重新提交 | `feishu_approval_task` | `resubmit` | `approval_code`, `instance_id`, `task_id`, `form` | `comment` |
| 退回到已审批节点 | `feishu_approval_task` | `rollback` | `task_id`, `reason`, `task_def_key_list` | `extra` |

## 推荐工作流

### 1. 优先定位任务，再回到实例详情和任务动作

审批操作通常不是“凭空执行”，推荐顺序是：

1. 如果用户目标是任务队列，例如“待我审批”“我发起的”“抄送我的”“我已审批”，优先用 `feishu_approval_task_search.query`
2. 如果用户有较明确的过滤条件，例如审批定义、实例号、标题关键词、任务状态、时间范围，用 `feishu_approval_task_search.search`
3. 如果用户目标明确是“抄送给我”或“我的审批抄送”，优先用 `feishu_approval_cc.search`
4. 从任务或抄送查询结果里定位 `task_id`、`process_id`、`definition_code`、实例链接
5. 需要补全实例上下文时，再调用 `feishu_approval_instance.get`
6. 如果用户目标是查看或处理审批评论，使用 `feishu_approval_comment.*`
7. 找到目标 `task_id` 后，再调用 `feishu_approval_task.*`

### 2. `approval_code` 不清楚时不要硬猜

`list` 依赖 `approval_code`。如果用户只说“查我的审批”但没有给审批定义范围，不要伪造参数。

优先做法：
- 先尝试 `feishu_approval_task_search.query` 或 `feishu_approval_task_search.search`
- 如果用户想看的就是某类审批实例，再让用户补充审批类型或审批定义
- 或者让用户先提供具体实例 ID，再走 `get`

### 3. 退回不是按实例整体退回，而是按节点退回

`rollback` 需要：
- 当前 `task_id`
- 退回原因 `reason`
- 目标节点列表 `task_def_key_list`

也就是必须先从实例详情里确认可退回的历史节点 key，再执行退回。

## 高频意图 Preset

以下 preset 用于把常见中文意图稳定映射到固定工具路径，避免临场乱选工具。

### 1. “待我审批”

当用户说：

- “列出待我审批”
- “看看我待审批的单子”
- “有哪些等我审批”

默认策略：

1. 优先调用 `feishu_approval_task_search` 的 `query`
2. 固定使用 `topic: "1"`
3. 默认可带 `page_size: 20`
4. 如果用户同时给了审批定义、标题关键词、时间范围，再考虑切到 `search`
5. 不要先走 `feishu_approval_instance.list`

补充：
- `query` 是当前审批域里少数仍保留 user 优先语义的入口
- 一旦用户目标转成复杂条件检索或后续写操作，通常会切到 tenant-only 端点

### 2. “我发起的审批”

当用户说：

- “我发起的审批有哪些”
- “看我提交过的审批”

默认策略：

1. 优先调用 `feishu_approval_task_search` 的 `query`
2. 固定使用 `topic: "2"`
3. 如果用户提供了更强过滤条件，再考虑补充 `search`

### 3. “抄送我的审批”

当用户说：

- “抄送我的审批”
- “看抄送给我的”
- “我收到哪些审批抄送”

默认策略：

1. 优先调用 `feishu_approval_cc` 的 `search`
2. 如果用户明确想看任务队列分组视角，也可以使用 `feishu_approval_task_search.query` 且 `topic: "3"`
3. 如果用户强调“未读抄送”，默认加 `read_status: "UNREAD"`
4. 如果用户强调“全部抄送”或“最近抄送”，优先补时间窗或分页，不要误切到实例列表

补充：
- `feishu_approval_cc.search` 当前是 tenant-only，不要因为“抄送我的”就假设必须 user 态

### 4. “我已审批” / “我已转交”

默认策略：

- “我已审批” -> `feishu_approval_task_search.query` + `topic: "17"`
- “我已转交” -> `feishu_approval_task_search.query` + `topic: "18"`

### 5. “重提被退回审批” / “重新提交审批”

当用户说：

- “把这个退回的审批重新提交”
- “重提这条审批”
- “重新发起这个被退回的审批”

默认策略：

1. 目标动作是 `feishu_approval_task.resubmit`
2. 绝不能在缺少 `form` 时直接调用
3. 如果只有 `instance_id` 没有 `task_id`，先查实例详情或让用户提供具体任务上下文
4. 如果只有“退回了，帮我重提”这类自然语言，但没有新的表单内容，不要伪造 `form`
5. 先明确告诉用户：重新提交需要新的表单 JSON 载荷；若当前上下文没有表单结构，必须补数据来源

### 6. “加签”

当用户说：

- “给这个审批加签”
- “再加一个审批人”
- “让某某也来审批”

默认策略：

1. 目标动作是 `feishu_approval_task.add_sign`
2. 至少确认 `approval_code`、`instance_id`、`task_id`
3. 至少确认 `add_sign_user_ids`
4. `add_sign_type` 没有明确业务约定时，不要擅自猜测

## 参数缺失时怎么补

### 1. 缺 `task_id`

适用于 `approve`、`reject`、`transfer`、`add_sign`、`resubmit`、`rollback`。

处理规则：

1. 如果已有 `instance_id`，先调用 `feishu_approval_instance.get`
2. 从 `tasks` 里定位目标节点和待处理任务
3. 如果一个实例里有多个候选任务，不要擅自选择，让用户确认

### 2. 缺 `instance_id`

处理规则：

1. 如果已有审批链接、审批通知消息、任务查询结果，先从中提取实例信息
2. 如果只有模糊描述，例如“昨天那个请假审批”，优先走任务查询 preset，不要直接猜实例

### 3. 缺 `approval_code`

处理规则：

1. 对任务队列类查询，通常可以先不需要 `approval_code`
2. 对 `instance.list`、`task.*`、`resubmit`、`add_sign` 这类动作，若接口需要，则必须从详情、搜索结果或用户补充中获得
3. 不要编造审批定义 code

### 4. 缺 `form`

只要目标动作是 `resubmit`，就执行以下规则：

1. 没有 `form` 就不能直接调用
2. 不要把自然语言说明直接塞进 `form`
3. 如果用户只说“帮我重新提交”，先解释需要新的表单 JSON 或明确的数据来源

## 安全提示规则

### 1. 需要先确认再执行的动作

以下动作在默认情况下应先明确告知影响，再执行：

- `feishu_approval_task.reject`
- `feishu_approval_task.transfer`
- `feishu_approval_task.rollback`
- `feishu_approval_task.add_sign`
- `feishu_approval_task.resubmit`
- `feishu_approval_comment.remove`

如果用户语义已经非常明确，例如“就拒绝这条”“立即转交给张三”“确认清空评论”，可以直接执行；否则先用一句话确认风险。

### 2. 不要伪造结构化 payload

以下字段不能靠猜：

- `task_def_key_list`
- `form`
- `add_sign_type`
- `approval_method`
- `approval_code`

缺这些字段时，先补信息，不要造假参数。

### 3. 优先小步定位，再执行写操作

对所有写操作，优先顺序应是：

1. 先定位任务或实例
2. 再核对状态和目标对象
3. 最后执行写操作

不要在只有模糊自然语言时直接调用写接口。

## 结果怎么读

`feishu_approval_task_search.query/search` 的归一化结果优先看这些字段：

- `task_id`
- `title`
- `topic`
- `user_id`
- `status`
- `process_status`
- `definition_code`
- `process_id`
- `process_external_id`
- `task_external_id`
- `initiators`
- `initiator_names`
- `urls`

其中：
- `topic` 常见值：`1=待我审批`、`2=我发起的`、`3=抄送我的`、`17=我已审批`、`18=我已转交`
- `urls` 里通常会有跳转审批的 PC / mobile 链接
- `definition_code`、`process_id`、`task_id` 是后续继续查详情或执行动作的关键定位字段

`feishu_approval_cc.search` 的归一化结果优先看这些字段：

- `approval.code`
- `approval.name`
- `instance.code`
- `instance.status`
- `instance.title`
- `instance.links`
- `cc.user_id`
- `cc.create_time`
- `cc.read_status`
- `cc.title`
- `cc.links`

其中：
- `cc.read_status` 常见值：`read`、`unread`
- `instance.links` 和 `cc.links` 常可直接跳转 PC / mobile 审批页面
- `instance.code` 是后续继续查实例详情的关键定位字段

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

`feishu_approval_comment.list` 的归一化结果优先看这些字段：

- `id`
- `content`
- `create_time`
- `update_time`
- `is_deleted`
- `commentator`
- `at_info_list`
- `replies`

其中：
- `replies` 是递归结构，表示评论回复列表
- `is_deleted = true` 表示该评论已被逻辑删除
- 评论能力不包含审批同意、拒绝、转交时附带的审批意见

## 常见场景示例

### 查待我审批任务队列

```json
{
  "action": "query",
  "topic": "1",
  "page_size": 20
}
```

### 按审批定义和任务状态搜索审批任务

```json
{
  "action": "search",
  "approval_code": "7C468A54-EXAMPLE",
  "task_status": "PENDING",
  "page_size": 20
}
```

### 搜索未读审批抄送

```json
{
  "action": "search",
  "read_status": "UNREAD",
  "page_size": 20
}
```

### 查看某审批实例评论

```json
{
  "action": "list",
  "instance_id": "6899123456789012345"
}
```

### 创建审批评论

```json
{
  "action": "create",
  "instance_id": "6899123456789012345",
  "content": "请补充附件"
}
```

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

### 审批任务加签

```json
{
  "action": "add_sign",
  "approval_code": "7C468A54-EXAMPLE",
  "instance_id": "6899123456789012345",
  "task_id": "7012345678901234567",
  "add_sign_user_ids": ["ou_xxx", "ou_yyy"],
  "add_sign_type": 1,
  "comment": "请共同审批"
}
```

### 审批任务重新提交

```json
{
  "action": "resubmit",
  "approval_code": "7C468A54-EXAMPLE",
  "instance_id": "6899123456789012345",
  "task_id": "7012345678901234567",
  "form": "{\"field\":\"value\"}",
  "comment": "补充材料后重新提交"
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
| `personal_access_token_required` | 当前接口缺少用户个人 access token，无法访问个人审批队列或个人任务数据 | 先确认当前会话是否已具备用户态授权；如未具备，则补用户授权或改为查询明确实例/任务 |
| `api_error` | 其他飞书审批 API 错误 | 查看 `message` 与 `raw`，不要自行臆测成功 |

## 操作原则

- 批准、拒绝、转交前，先确认当前任务仍处于待处理状态
- 用户要求“退回”时，先解释需要可退回节点 key，不要直接瞎填 `task_def_key_list`
- 用户要求“重新提交”时，先确认是否已有完整 `form`；没有就不要直接调用 `resubmit`
- 用户要求“加签”时，先确认加签对象和加签类型，不要自行猜 `add_sign_type`
- 用户如果只给了实例 ID，没有任务 ID，不要直接做 approve/reject/transfer；先从详情里找目标任务
- 用户目标是审批队列时，优先走 `feishu_approval_task_search`，不要机械地先查实例列表
- 用户目标是审批抄送列表时，优先走 `feishu_approval_cc.search`
- 用户目标是审批评论时，优先走 `feishu_approval_comment`
- 不要扩展到创建审批、评论、抄送、审批定义管理等当前还未在 skill 主路径开放的能力
