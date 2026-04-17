# Feishu Skill Coverage

This file is generated from:

- `docs/reports/feishu/feishu-supported-operations.json`
- `skills`

## Summary

- Generated at: 2026-04-17T03:19:29.939Z
- Skills: 19
- Tools: 47
- Eligible tools: 43
- Covered tools: 43
- Uncovered tools: 0
- Excluded tools: 4
- Covered operations: 135/135
- Skills with unknown referenced tools: 0
- Unknown referenced tool names: 0

## Category Summary

| Category | Eligible Tools | Covered | Uncovered | Excluded | Operations |
|---|---:|---:|---:|---:|---:|
| `approval` | 5 | 5 | 0 | 0 | 18 |
| `attendance` | 2 | 2 | 0 | 0 | 3 |
| `auth` | 0 | 0 | 0 | 2 | 2 |
| `bitable` | 5 | 5 | 0 | 0 | 24 |
| `calendar` | 4 | 4 | 0 | 0 | 15 |
| `chat` | 2 | 2 | 0 | 0 | 3 |
| `common` | 2 | 2 | 0 | 0 | 2 |
| `doc` | 2 | 2 | 0 | 0 | 5 |
| `drive` | 1 | 1 | 0 | 0 | 7 |
| `im` | 5 | 5 | 0 | 1 | 7 |
| `interaction` | 0 | 0 | 0 | 1 | 1 |
| `mail` | 1 | 1 | 0 | 0 | 4 |
| `mcp-doc` | 3 | 3 | 0 | 0 | 3 |
| `meeting` | 3 | 3 | 0 | 0 | 14 |
| `search` | 1 | 1 | 0 | 0 | 1 |
| `sheets` | 1 | 1 | 0 | 0 | 7 |
| `task` | 4 | 4 | 0 | 0 | 15 |
| `wiki` | 2 | 2 | 0 | 0 | 8 |

## Tool Coverage

| Tool | Category | Operations | Status | Skills / Reason |
|---|---|---:|---|---|
| `feishu_approval_cc` | `approval` | 1 | `covered` | `feishu-approval` |
| `feishu_approval_comment` | `approval` | 4 | `covered` | `feishu-approval` |
| `feishu_approval_instance` | `approval` | 2 | `covered` | `feishu-approval` |
| `feishu_approval_task` | `approval` | 6 | `covered` | `feishu-approval` |
| `feishu_approval_task_search` | `approval` | 5 | `covered` | `feishu-approval` |
| `feishu_ask_user_question` | `interaction` | 1 | `excluded` | interaction primitive used by workflows, not a standalone Feishu domain skill |
| `feishu_attendance_group` | `attendance` | 2 | `covered` | `feishu-attendance` |
| `feishu_attendance_shift` | `attendance` | 1 | `covered` | `feishu-attendance` |
| `feishu_bitable_app` | `bitable` | 5 | `covered` | `feishu-bitable`, `feishu-fetch-doc` |
| `feishu_bitable_app_table` | `bitable` | 4 | `covered` | `feishu-bitable`, `feishu-fetch-doc` |
| `feishu_bitable_app_table_field` | `bitable` | 4 | `covered` | `feishu-bitable`, `feishu-fetch-doc` |
| `feishu_bitable_app_table_record` | `bitable` | 7 | `covered` | `feishu-bitable`, `feishu-fetch-doc` |
| `feishu_bitable_app_table_view` | `bitable` | 4 | `covered` | `feishu-bitable`, `feishu-fetch-doc` |
| `feishu_calendar_calendar` | `calendar` | 3 | `covered` | `feishu-calendar` |
| `feishu_calendar_event` | `calendar` | 9 | `covered` | `feishu-calendar` |
| `feishu_calendar_event_attendee` | `calendar` | 2 | `covered` | `feishu-calendar` |
| `feishu_calendar_freebusy` | `calendar` | 1 | `covered` | `feishu-calendar` |
| `feishu_chat` | `chat` | 2 | `covered` | `feishu-search` |
| `feishu_chat_members` | `chat` | 1 | `covered` | `feishu-search` |
| `feishu_create_doc` | `mcp-doc` | 1 | `covered` | `feishu-create-doc` |
| `feishu_doc_comments` | `doc` | 3 | `covered` | `feishu-doc-collab` |
| `feishu_doc_media` | `doc` | 2 | `covered` | `feishu-create-doc`, `feishu-doc-collab`, `feishu-fetch-doc` |
| `feishu_drive_file` | `drive` | 7 | `covered` | `feishu-drive-wiki` |
| `feishu_fetch_doc` | `mcp-doc` | 1 | `covered` | `feishu-doc-collab`, `feishu-fetch-doc` |
| `feishu_get_user` | `common` | 1 | `covered` | `feishu-search` |
| `feishu_im_bot_image` | `im` | 1 | `excluded` | tenant-side helper for bot-origin resources; not a primary user-invoked skill surface |
| `feishu_im_user_fetch_resource` | `im` | 1 | `covered` | `feishu-im-read` |
| `feishu_im_user_get_messages` | `im` | 1 | `covered` | `feishu-im-read` |
| `feishu_im_user_get_thread_messages` | `im` | 1 | `covered` | `feishu-im-read` |
| `feishu_im_user_message` | `im` | 2 | `covered` | `feishu-im-send` |
| `feishu_im_user_search_messages` | `im` | 1 | `covered` | `feishu-im-read` |
| `feishu_mail_message` | `mail` | 4 | `covered` | `feishu-mail` |
| `feishu_meeting` | `meeting` | 4 | `covered` | `feishu-meeting` |
| `feishu_meeting_reserve` | `meeting` | 5 | `covered` | `feishu-meeting` |
| `feishu_minutes` | `meeting` | 5 | `covered` | `feishu-meeting` |
| `feishu_oauth` | `auth` | 1 | `excluded` | authorization flow helper; normally triggered by runtime remediation rather than explicit skill selection |
| `feishu_oauth_batch_auth` | `auth` | 1 | `excluded` | authorization flow helper; normally triggered by remediation or explicit admin intent |
| `feishu_search_doc_wiki` | `search` | 1 | `covered` | `feishu-search` |
| `feishu_search_user` | `common` | 1 | `covered` | `feishu-search` |
| `feishu_sheet` | `sheets` | 7 | `covered` | `feishu-fetch-doc`, `feishu-sheet` |
| `feishu_task_comment` | `task` | 3 | `covered` | `feishu-task` |
| `feishu_task_subtask` | `task` | 2 | `covered` | `feishu-task` |
| `feishu_task_task` | `task` | 4 | `covered` | `feishu-task` |
| `feishu_task_tasklist` | `task` | 6 | `covered` | `feishu-task` |
| `feishu_update_doc` | `mcp-doc` | 1 | `covered` | `feishu-update-doc` |
| `feishu_wiki_space` | `wiki` | 3 | `covered` | `feishu-doc-collab`, `feishu-drive-wiki`, `feishu-fetch-doc` |
| `feishu_wiki_space_node` | `wiki` | 5 | `covered` | `feishu-doc-collab`, `feishu-drive-wiki`, `feishu-fetch-doc` |

## Priority Uncovered Tools


## Unknown Tool References

- None

