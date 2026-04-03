---
name: feishu-meeting
description: |
  飞书会议与妙记 Skill。用于预约会议、查会议详情、搜索会议、结束会议，以及读取会议 note / 妙记 transcript / 统计 / 制品。

  **当以下情况时使用此 Skill**:
  (1) 用户要预约、更新、取消会议
  (2) 用户要找某场会议或查看会议详情
  (3) 用户要结束正在进行中的会议
  (4) 用户要读取会议纪要 note、妙记 transcript、统计、制品、媒体
  (5) 用户提到“会议预约”“视频会议”“meeting”“妙记”“minutes”“会议纪要”
---

# 飞书会议与妙记

## 执行前必读

- 会议域分三类对象：
  - `feishu_meeting_reserve`：预约对象 `reserve_id`
  - `feishu_meeting`：真实会议对象 `meeting_id` / `note_id`
  - `feishu_minutes`：妙记对象 `minute_token`
- 不要混用 ID：
  - `reserve_id` 不是 `meeting_id`
  - `note_id` 不是 `minute_token`
- auth 分层：
  - `feishu_meeting_reserve.*`：以 canonical dual-mode 为主
  - `feishu_meeting.search` / `end` / `get_note`：user-only
  - `feishu_meeting.get`：dual-mode
  - `feishu_minutes.*`：dual-mode
- `apply` / `update` / `search` 目前用 `payload` 透传复杂请求体，字段必须严格符合飞书官方 schema

## 快速索引

| 用户意图 | 工具 | action | 关键输入 |
|---|---|---|---|
| 创建会议预约 | `feishu_meeting_reserve` | `apply` | `payload` |
| 查看会议预约 | `feishu_meeting_reserve` | `get` | `reserve_id` |
| 更新会议预约 | `feishu_meeting_reserve` | `update` | `reserve_id`, `payload` |
| 删除会议预约 | `feishu_meeting_reserve` | `delete` | `reserve_id` |
| 把预约解析成进行中会议 | `feishu_meeting_reserve` | `get_active_meeting` | `reserve_id` |
| 搜会议 | `feishu_meeting` | `search` | `payload` |
| 查会议详情 | `feishu_meeting` | `get` | `meeting_id` |
| 结束会议 | `feishu_meeting` | `end` | `meeting_id` |
| 读会议 note | `feishu_meeting` | `get_note` | `note_id` |
| 读妙记详情 | `feishu_minutes` | `get` | `minute_token` |
| 读妙记转写 | `feishu_minutes` | `transcript` | `minute_token` |
| 读妙记统计 / 制品 / 媒体 | `feishu_minutes` | `statistics` / `artifacts` / `media` | `minute_token` |

## 推荐工作流

### 1. 用户要“帮我约个会”

先用 `feishu_meeting_reserve.apply`。

- `payload` 至少需要明确时间、主题、参会规则等核心字段
- 如果时间、时区或目标参会人不清楚，先补齐，不要猜测

### 2. 用户要“这场会现在开了吗”

如果有 `reserve_id`：

1. 用 `feishu_meeting_reserve.get_active_meeting`
2. 如果拿到 `meeting_id`，再切到 `feishu_meeting.get`

### 3. 用户要“找上周那场项目复盘会”

优先用 `feishu_meeting.search`，不要先猜 `meeting_id`。

- `payload` 里尽量加时间窗、会议号、主题关键词等过滤条件
- 搜到候选后，再用 `feishu_meeting.get`

### 4. 用户要“给我这场会的纪要/妙记”

先区分对象：

- 如果已有 `note_id`：用 `feishu_meeting.get_note`
- 如果已有 `minute_token`：用 `feishu_minutes.*`
- 如果只有会议上下文：先看 `feishu_meeting.get` 的返回里是否能定位相关制品，否则要求用户补充链接或对象标识

## 操作原则

- 预约变更永远用 `reserve_id`
- 会议控制永远用 `meeting_id`
- 妙记读取永远用 `minute_token`
- `payload` 透传场景不要临时造字段，严格对齐官方 VC / Minutes schema
