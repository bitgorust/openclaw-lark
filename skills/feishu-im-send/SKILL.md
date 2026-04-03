---
name: feishu-im-send
description: |
  飞书 IM 发送工具。用于给用户或群聊发送消息，以及回复已有消息，支持主流回复和话题回复。

  **当以下情况时使用此 Skill**:
  (1) 用户要发消息给某个人或某个群
  (2) 用户要回复一条已有消息
  (3) 用户提到“发给他”、“发群里”、“回这条消息”、“在线程里回复”
  (4) 需要在 send 和 reply 之间选择正确动作
---

# 飞书 IM 消息发送

## 执行前必读

- 主要工具：`feishu_im_user_message`
- 支持的 action：`send`, `reply`
- `send` 需要：
  - `receive_id_type`
  - `receive_id`
  - `msg_type`
  - `content`
- `reply` 需要：
  - `message_id`
  - `msg_type`
  - `content`
- `reply_in_thread=true` 时，回复进入话题
- `feishu_im_user_message` 当前按 tenant / app 身份执行，不是用户态发送
- 是否能发出消息由应用能力、会话可达性和对应权限决定，不要把它当成“代当前用户发消息”

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 发私聊消息 | `feishu_im_user_message` | `send` | `receive_id_type="open_id"`, `receive_id`, `msg_type`, `content` | `uuid` |
| 发群消息 | `feishu_im_user_message` | `send` | `receive_id_type="chat_id"`, `receive_id`, `msg_type`, `content` | `uuid` |
| 回复一条消息 | `feishu_im_user_message` | `reply` | `message_id`, `msg_type`, `content` | `reply_in_thread`, `uuid` |
| 在线程里回复 | `feishu_im_user_message` | `reply` | `message_id`, `msg_type`, `content` | `reply_in_thread=true` |

## 推荐工作流

### 1. 先判断是“新消息”还是“回复消息”

- 用户要“发给某人/发群里”时，用 `send`
- 用户要“回复这条/回这个消息/在线程里回”时，用 `reply`

不要把 reply 场景误做成 send，否则会丢失上下文。

### 2. 先判断目标是用户还是群

`send` 时：
- 发给用户：`receive_id_type = "open_id"`，`receive_id = "ou_xxx"`
- 发给群：`receive_id_type = "chat_id"`，`receive_id = "oc_xxx"`

如果用户没有给明确 ID，应该先用其他 skill 或上下文拿到正确对象，再发送。

### 3. 默认优先发纯文本

最常见的是 `msg_type = "text"`。

示例：

```json
{
  "action": "send",
  "receive_id_type": "open_id",
  "receive_id": "ou_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"你好，审批结果已经更新。\"}"
}
```

除非用户明确需要富文本、图片、文件、卡片，否则不要过度选择复杂消息类型。

### 4. 线程回复要显式打开

如果用户说的是：
- “在线程里回复”
- “在话题里回”
- “不要打断主会话”

则在 `reply` 时显式传：

```json
{
  "reply_in_thread": true
}
```

如果用户只是普通“回复这条消息”，可以保留默认主流回复。

## 关键约束

### 1. `content` 是 JSON 字符串，不是裸文本

`text` 消息要写成：

```json
{
  "msg_type": "text",
  "content": "{\"text\":\"你好\"}"
}
```

不要直接把 `"你好"` 当作 content。

### 2. 发消息和回消息的 ID 不同

- `send` 用的是目标接收者 ID：
  - `ou_xxx`
  - `oc_xxx`
- `reply` 用的是消息 ID：
  - `om_xxx`

不要把 `message_id` 当成 `receive_id`，也不要反过来。

### 3. 幂等场景优先传 `uuid`

如果是自动化重试敏感场景，可以传 `uuid`，避免 1 小时内重复发出同一条消息。

### 4. `post` 消息适合多段富文本，不适合普通一句话

普通通知优先用 `text`。

只有在用户明确要求富文本布局时，才考虑 `post`。

## 常见场景示例

### 发私聊文本

```json
{
  "action": "send",
  "receive_id_type": "open_id",
  "receive_id": "ou_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"你好，文件已经整理好了。\"}"
}
```

### 发群消息

```json
{
  "action": "send",
  "receive_id_type": "chat_id",
  "receive_id": "oc_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"大家好，会议纪要已更新。\"}"
}
```

### 回复一条消息

```json
{
  "action": "reply",
  "message_id": "om_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"收到，我来跟进。\"}"
}
```

### 在线程里回复

```json
{
  "action": "reply",
  "message_id": "om_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"细节我放在线程里补充。\"}",
  "reply_in_thread": true
}
```

## 常见错误与处理

| 问题 | 原因 | 处理方式 |
|------|------|---------|
| 发不出去 | 接收者 ID 类型错了 | 确认 `ou_` 用 `open_id`，`oc_` 用 `chat_id` |
| 回复失败 | 用错了 ID | `reply` 必须传 `message_id=om_xxx` |
| 内容格式错误 | `content` 不是合法 JSON 字符串 | 先构造成对应 `msg_type` 的 JSON |
| 发到了主流而不是线程 | 没设置 `reply_in_thread=true` | 线程回复场景显式传该字段 |
| 出现重复消息 | 重试时没做幂等 | 自动化重试场景加 `uuid` |

## 操作原则

- 普通发送优先 `send + text`
- 回复已有上下文时优先 `reply`
- 需要保留线程上下文时显式 `reply_in_thread=true`
- 目标对象不明确时，先找对用户或群，再发送
