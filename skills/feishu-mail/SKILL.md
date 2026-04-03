---
name: feishu-mail
description: |
  飞书邮箱 Skill。用于列出邮件、读取邮件详情、发送邮件，以及获取附件下载链接。

  **当以下情况时使用此 Skill**:
  (1) 用户要查看某个邮箱文件夹里的邮件
  (2) 用户要打开某封邮件详情
  (3) 用户要发邮件
  (4) 用户要获取附件下载地址
  (5) 用户提到“邮箱”“邮件”“mail”“email”“发封邮件”
---

# 飞书邮箱

## 执行前必读

- 主工具：`feishu_mail_message`
- 当前能力：
  - `action: "list"`：列某个邮箱文件夹里的邮件 ID
  - `action: "get"`：读单封邮件详情
  - `action: "send"`：发邮件
  - `action: "attachment_download_url"`：获取附件下载链接
- 关键标识：
  - `user_mailbox_id`：邮箱 ID。不要猜；通常需要用户明确提供
  - `folder_id`：邮箱文件夹 ID
  - `message_id`：邮件 ID
- canonical auth：
  - `list` / `get` / `attachment_download_url`：dual-mode
  - `send`：user-only

## 快速索引

| 用户意图 | 工具 | action | 必填参数 |
|---|---|---|---|
| 列某个文件夹的邮件 | `feishu_mail_message` | `list` | `user_mailbox_id`, `folder_id` |
| 读单封邮件 | `feishu_mail_message` | `get` | `user_mailbox_id`, `message_id` |
| 发邮件 | `feishu_mail_message` | `send` | `user_mailbox_id`, `to`，以及 `raw` / `body_plain_text` / `body_html` 之一 |
| 获取附件下载地址 | `feishu_mail_message` | `attachment_download_url` | `user_mailbox_id`, `message_id`, `attachment_ids` |

## 推荐工作流

### 1. 用户要“看看这个邮箱最近邮件”

用 `feishu_mail_message.list`。

- 必须先拿到 `user_mailbox_id`
- 必须先拿到 `folder_id`
- 先列出 `message_id`，再进入详情读取

### 2. 用户要“打开这封邮件”

用 `feishu_mail_message.get`。

- 输入必须是准确的 `message_id`
- 不要把主题或线程号当作 `message_id`

### 3. 用户要“发一封邮件”

用 `feishu_mail_message.send`。

- `send` 是 user-only
- 至少给出：
  - 收件人 `to`
  - `raw` / `body_plain_text` / `body_html` 之一
- 附件要用 base64 body，不要传文件路径

### 4. 用户要“把附件给我”

先通过 `get` 确认附件列表，再用 `attachment_download_url`。

- `attachment_ids` 要来自该邮件详情里的附件对象
- 不要凭文件名猜附件 ID

## 操作原则

- 没有 `user_mailbox_id` 时先向用户确认，不要臆造邮箱
- 没有 `folder_id` 时不要假设“默认收件箱”
- 先 `list` 再 `get`，再做附件下载
- 发信前确认 user 授权语境，避免把它误当成 tenant / bot 代发
