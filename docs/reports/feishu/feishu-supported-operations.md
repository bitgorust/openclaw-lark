# Feishu Supported Operations

This file enumerates the Feishu-facing tool and command surface currently exposed by this repository.

Auth values in this file are code-derived declared modes, not the final official auth contract.
Use canonical/runtime metadata for official auth and scope decisions.

## Scope

- Included: Registered Feishu-facing tools and chat commands exposed by the plugin entrypoint.
- Excluded: Internal helper functions and lower-level channel/outbound APIs not directly registered as tools or commands.
- Auth semantics: Code-derived declared execution mode observed from repository source; not the final official auth contract.
- Coverage semantics: Whether the declared backend can be linked to an official Feishu API/MCP reference.

## Totals

- Tools: 47
- Operations: 139
- Official operations: 136
- Non-official operations: 3
- Chat commands: 9

## Tools

| Tool | Category | Transport | Auth | Operations | Source |
|---|---|---|---|---:|---|
| `feishu_approval_cc` | approval | oapi | user | 1 | `src/tools/oapi/approval/cc-search.ts` |
| `feishu_approval_comment` | approval | oapi | user | 4 | `src/tools/oapi/approval/comment.ts` |
| `feishu_approval_instance` | approval | oapi | user | 2 | `src/tools/oapi/approval/instance.ts` |
| `feishu_approval_task` | approval | oapi | user | 6 | `src/tools/oapi/approval/task.ts` |
| `feishu_approval_task_search` | approval | oapi | user | 5 | `src/tools/oapi/approval/task-search.ts` |
| `feishu_ask_user_question` | interaction | plugin | user | 1 | `src/tools/ask-user-question.ts` |
| `feishu_attendance_group` | attendance | oapi | user | 2 | `src/tools/oapi/attendance/group.ts` |
| `feishu_attendance_shift` | attendance | oapi | tenant | 1 | `src/tools/oapi/attendance/shift.ts` |
| `feishu_bitable_app` | bitable | oapi | user | 5 | `src/tools/oapi/bitable/app.ts` |
| `feishu_bitable_app_table` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table.ts` |
| `feishu_bitable_app_table_field` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table-field.ts` |
| `feishu_bitable_app_table_record` | bitable | oapi | user | 7 | `src/tools/oapi/bitable/app-table-record.ts` |
| `feishu_bitable_app_table_view` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table-view.ts` |
| `feishu_calendar_calendar` | calendar | oapi | user | 3 | `src/tools/oapi/calendar/calendar.ts` |
| `feishu_calendar_event` | calendar | oapi | user | 9 | `src/tools/oapi/calendar/event.ts` |
| `feishu_calendar_event_attendee` | calendar | oapi | user | 2 | `src/tools/oapi/calendar/event-attendee.ts` |
| `feishu_calendar_freebusy` | calendar | oapi | user | 1 | `src/tools/oapi/calendar/freebusy.ts` |
| `feishu_chat` | chat | oapi | user | 2 | `src/tools/oapi/chat/chat.ts` |
| `feishu_chat_members` | chat | oapi | user | 1 | `src/tools/oapi/chat/members.ts` |
| `feishu_create_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/create.ts` |
| `feishu_doc_comments` | doc | oapi | user | 3 | `src/tools/oapi/drive/doc-comments.ts` |
| `feishu_doc_media` | doc | oapi | user | 2 | `src/tools/oapi/drive/doc-media.ts` |
| `feishu_drive_file` | drive | oapi | user | 7 | `src/tools/oapi/drive/file.ts` |
| `feishu_fetch_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/fetch.ts` |
| `feishu_get_user` | common | oapi | user | 1 | `src/tools/oapi/common/get-user.ts` |
| `feishu_im_bot_image` | im | oapi | tenant | 1 | `src/tools/tat/im/resource.ts` |
| `feishu_im_user_fetch_resource` | im | oapi | tenant | 1 | `src/tools/oapi/im/resource.ts` |
| `feishu_im_user_get_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_im_user_get_thread_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_im_user_message` | im | oapi | user | 2 | `src/tools/oapi/im/message.ts` |
| `feishu_im_user_search_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_mail_message` | mail | oapi | user | 4 | `src/tools/oapi/mail/message.ts` |
| `feishu_meeting` | meeting | oapi | user | 4 | `src/tools/oapi/meeting/meeting.ts` |
| `feishu_meeting_reserve` | meeting | oapi | user | 5 | `src/tools/oapi/meeting/reserve.ts` |
| `feishu_minutes` | meeting | oapi | user | 5 | `src/tools/oapi/meeting/minutes.ts` |
| `feishu_oauth` | auth | plugin | user | 1 | `src/tools/oauth.ts` |
| `feishu_oauth_batch_auth` | auth | plugin | user | 1 | `src/tools/oauth-batch-auth.ts` |
| `feishu_search_doc_wiki` | search | oapi | user | 1 | `src/tools/oapi/search/doc-search.ts` |
| `feishu_search_user` | common | oapi | user | 1 | `src/tools/oapi/common/search-user.ts` |
| `feishu_sheet` | sheets | oapi | user | 7 | `src/tools/oapi/sheets/sheet.ts` |
| `feishu_task_comment` | task | oapi | user | 3 | `src/tools/oapi/task/comment.ts` |
| `feishu_task_subtask` | task | oapi | user | 2 | `src/tools/oapi/task/subtask.ts` |
| `feishu_task_task` | task | oapi | user | 4 | `src/tools/oapi/task/task.ts` |
| `feishu_task_tasklist` | task | oapi | user | 6 | `src/tools/oapi/task/tasklist.ts` |
| `feishu_update_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/update.ts` |
| `feishu_wiki_space` | wiki | oapi | user | 3 | `src/tools/oapi/wiki/space.ts` |
| `feishu_wiki_space_node` | wiki | oapi | user | 5 | `src/tools/oapi/wiki/space-node.ts` |

### `feishu_approval_cc`

- Category: `approval`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/approval/cc-search.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search` | `user` | `oapi` | `official` | 飞书审批抄送查询工具. | `POST:/open-apis/approval/v4/instances/search_cc` | [查询抄送列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/search_cc) |

### `feishu_approval_comment`

- Category: `approval`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/approval/comment.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 飞书审批评论工具. | `POST:/open-apis/approval/v4/instances/:instance_id/comments` | [创建评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance-comment/create) |
| `list` | `user` | `oapi` | `official` | 飞书审批评论工具. | `GET:/open-apis/approval/v4/instances/:instance_id/comments` | [获取评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance-comment/list) |
| `delete` | `user` | `oapi` | `official` | 飞书审批评论工具. | `DELETE:/open-apis/approval/v4/instances/:instance_id/comments/:comment_id` | [删除评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance-comment/delete) |
| `remove` | `user` | `oapi` | `official` | 飞书审批评论工具. | `POST:/open-apis/approval/v4/instances/:instance_id/comments/remove` | [清空评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance-comment/remove) |

### `feishu_approval_instance`

- Category: `approval`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/approval/instance.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | 飞书审批实例工具. | `GET:/open-apis/approval/v4/instances<br>GET:/open-apis/approval/v4/instances/:instanceId` | [批量获取审批实例 ID](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/list)<br>[获取单个审批实例详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/get) |
| `get` | `user` | `oapi` | `official` | 飞书审批实例工具. | `GET:/open-apis/approval/v4/instances/:instance_id` | [获取单个审批实例详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/get) |

### `feishu_approval_task`

- Category: `approval`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/approval/task.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `approve` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/tasks/approve` | [同意审批任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/approve) |
| `reject` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/tasks/reject` | [拒绝审批任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/reject) |
| `transfer` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/tasks/transfer` | [转交审批任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/transfer) |
| `add_sign` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/instances/add_sign` | [审批任务加签](https://open.feishu.cn/document/ukTMukTMukTM/ukTM5UjL5ETO14SOxkTN/approval-task-addsign) |
| `resubmit` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/tasks/resubmit` | [重新提交审批任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/resubmit) |
| `rollback` | `user` | `oapi` | `official` | 飞书审批任务工具. | `POST:/open-apis/approval/v4/instances/specified_rollback` | [退回审批任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/specified_rollback) |

### `feishu_approval_task_search`

- Category: `approval`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/approval/task-search.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `query` | `user` | `oapi` | `official` | 飞书审批任务查询工具. | `GET:/open-apis/approval/v4/tasks/query` | [查询用户的任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/query) |
| `search` | `user` | `oapi` | `official` | 飞书审批任务查询工具. | `POST:/open-apis/approval/v4/tasks/search` | [查询任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/search) |
| `get_detail` | `user` | `oapi` | `official` | 飞书审批任务查询工具. | `GET:/open-apis/approval/v4/instances/:instance_id` | [获取单个审批实例详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/get) |
| `download_attachment` | `user` | `oapi` | `official` | 飞书审批任务查询工具. | `GET:/open-apis/approval/v4/tasks/query<br>POST:/open-apis/approval/v4/tasks/search<br>GET:/open-apis/approval/v4/instances/:instance_id` | [查询用户的任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/query)<br>[查询任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/search)<br>[获取单个审批实例详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/get) |
| `parse_attachment` | `user` | `oapi` | `official` | 飞书审批任务查询工具. | `GET:/open-apis/approval/v4/tasks/query<br>POST:/open-apis/approval/v4/tasks/search<br>GET:/open-apis/approval/v4/instances/:instance_id` | [查询用户的任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/query)<br>[查询任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/task/search)<br>[获取单个审批实例详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/approval-v4/instance/get) |

### `feishu_ask_user_question`

- Category: `interaction`
- Transport: `plugin`
- Auth: `user`
- Source: `src/tools/ask-user-question.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `ask` | `user` | `plugin` | `non-official` | Action `ask` exposed by `feishu_ask_user_question`. | `-` | - |

### `feishu_attendance_group`

- Category: `attendance`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/attendance/group.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_attendance_group`. | `GET:/open-apis/attendance/v1/groups/:group_id` | [按 ID 查询考勤组](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/group/get) |
| `list_users` | `user` | `oapi` | `official` | Action `list_users` exposed by `feishu_attendance_group`. | `GET:/open-apis/attendance/v1/groups/:group_id/list_user` | [查询考勤组下所有成员](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/group/list_user) |

### `feishu_attendance_shift`

- Category: `attendance`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/oapi/attendance/shift.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `query` | `tenant` | `oapi` | `official` | 【以应用身份】飞书考勤排班查询工具. | `POST:/open-apis/attendance/v1/user_daily_shifts/query` | [查询排班表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/user_daily_shift/query) |

### `feishu_bitable_app`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格应用管理工具. | `POST:/open-apis/bitable/v1/apps` | [创建多维表格](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/create) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格应用管理工具. | `GET:/open-apis/bitable/v1/apps/:app_token` | [获取多维表格元数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/get) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格应用管理工具. | `GET:/open-apis/drive/v1/files` | [获取文件夹中的文件清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/list) |
| `patch` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格应用管理工具. | `PUT:/open-apis/bitable/v1/apps/:app_token` | [更新多维表格元数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/update) |
| `copy` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格应用管理工具. | `POST:/open-apis/bitable/v1/apps/:app_token/copy` | [复制多维表格](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/copy) |

### `feishu_bitable_app_table`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_bitable_app_table`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables` | [新增一个数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/create) |
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_bitable_app_table`. | `GET:/open-apis/bitable/v1/apps/:app_token/tables` | [列出数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/list) |
| `patch` | `user` | `oapi` | `official` | Action `patch` exposed by `feishu_bitable_app_table`. | `PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id` | [更新数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/patch) |
| `batch_create` | `user` | `oapi` | `official` | Action `batch_create` exposed by `feishu_bitable_app_table`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/batch_create` | [新增多个数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/batch_create) |

### `feishu_bitable_app_table_field`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-field.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格字段（列）管理工具. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields` | [新增字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/create) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格字段（列）管理工具. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields` | [列出字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/list) |
| `update` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格字段（列）管理工具. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields<br>PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id` | [列出字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/list)<br>[更新字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/update) |
| `delete` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格字段（列）管理工具. | `DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id` | [删除字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/delete) |

### `feishu_bitable_app_table_record`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-record.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_bitable_app_table_record`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records` | [新增记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/create) |
| `update` | `user` | `oapi` | `official` | Action `update` exposed by `feishu_bitable_app_table_record`. | `PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id` | [更新记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/update) |
| `delete` | `user` | `oapi` | `official` | Action `delete` exposed by `feishu_bitable_app_table_record`. | `DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id` | [删除记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/delete) |
| `batch_create` | `user` | `oapi` | `official` | Action `batch_create` exposed by `feishu_bitable_app_table_record`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_create` | [新增多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_create) |
| `batch_update` | `user` | `oapi` | `official` | Action `batch_update` exposed by `feishu_bitable_app_table_record`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_update` | [更新多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_update) |
| `batch_delete` | `user` | `oapi` | `official` | Action `batch_delete` exposed by `feishu_bitable_app_table_record`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_delete` | [删除多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_delete) |
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_bitable_app_table_record`. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/search` | [查询记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/search) |

### `feishu_bitable_app_table_view`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-view.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格视图管理工具. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views` | [新增视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/create) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格视图管理工具. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id` | [获取视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/get) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格视图管理工具. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views` | [列出视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/list) |
| `patch` | `user` | `oapi` | `official` | 【以用户身份】飞书多维表格视图管理工具. | `PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id` | [更新视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/patch) |

### `feishu_calendar_calendar`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/calendar.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书日历管理工具. | `GET:/open-apis/calendar/v4/calendars` | [查询日历列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/list) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书日历管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id` | [查询日历信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/get) |
| `primary` | `user` | `oapi` | `official` | 【以用户身份】飞书日历管理工具. | `POST:/open-apis/calendar/v4/calendars/primary` | [查询主日历信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/primary) |

### `feishu_calendar_event`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/event.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events<br>POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [创建日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/create)<br>[添加日程参与人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/create) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view` | [查询日程视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instance_view) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [获取日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/get) |
| `patch` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `PATCH:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [更新日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/patch) |
| `delete` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `DELETE:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [删除日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/delete) |
| `search` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events/search` | [搜索日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/search) |
| `reply` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/reply` | [回复日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/reply) |
| `instances` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/instances` | [获取重复日程实例](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instances) |
| `instance_view` | `user` | `oapi` | `official` | 【以用户身份】飞书日程管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view` | [查询日程视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instance_view) |

### `feishu_calendar_event_attendee`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/event-attendee.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 飞书日程参会人管理工具. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [添加日程参与人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/create) |
| `list` | `user` | `oapi` | `official` | 飞书日程参会人管理工具. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [获取日程参与人列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/list) |

### `feishu_calendar_freebusy`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/freebusy.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书日历忙闲查询工具. | `POST:/open-apis/calendar/v4/freebusy/batch` | [批量查询主日历日程忙闲信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/freebusy/batch) |

### `feishu_chat`

- Category: `chat`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/chat/chat.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search` | `user` | `oapi` | `official` | 以用户身份调用飞书群聊管理工具. | `GET:/open-apis/im/v1/chats/search` | [搜索对用户或机器人可见的群列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat/search) |
| `get` | `user` | `oapi` | `official` | 以用户身份调用飞书群聊管理工具. | `GET:/open-apis/im/v1/chats/:chat_id` | [获取群信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat/get) |

### `feishu_chat_members`

- Category: `chat`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/chat/members.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list_members` | `user` | `oapi` | `official` | Action `list_members` exposed by `feishu_chat_members`. | `GET:/open-apis/im/v1/chats/:chat_id/members` | [获取群成员列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat-members/get) |

### `feishu_create_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/create.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create-doc` | `user` | `mcp` | `official` | 从 Markdown 创建云文档（支持异步 task_id 查询）. | `MCP:create-doc` | [MCP:create-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_doc_comments`

- Category: `doc`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/doc-comments.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_doc_comments`. | `GET:/open-apis/drive/v1/files/:file_token/comments<br>GET:/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies` | [获取云文档所有评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/list)<br>[获取回复信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment-reply/list) |
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_doc_comments`. | `POST:/open-apis/drive/v1/files/:file_token/comments` | [添加全文评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/create) |
| `patch` | `user` | `oapi` | `official` | Action `patch` exposed by `feishu_doc_comments`. | `PATCH:/open-apis/drive/v1/files/:file_token/comments/:comment_id` | [解决/恢复评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/patch) |

### `feishu_doc_media`

- Category: `doc`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/doc-media.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `insert` | `user` | `oapi` | `official` | Action `insert` exposed by `feishu_doc_media`. | `PATCH:/open-apis/docx/v1/documents/:document_id/blocks/batch_update` | [批量更新块的内容](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/document-docx/docx-v1/document-block/batch_update) |
| `download` | `user` | `oapi` | `official` | Action `download` exposed by `feishu_doc_media`. | `GET:/open-apis/drive/v1/medias/:file_token/download<br>GET:/open-apis/board/v1/whiteboards/:whiteboard_id/download_as_image` | [下载素材](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/media/download)<br>[获取画板缩略图片](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/board-v1/whiteboard/download_as_image) |

### `feishu_drive_file`

- Category: `drive`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/file.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_drive_file`. | `GET:/open-apis/drive/v1/files` | [获取文件夹中的文件清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/list) |
| `get_meta` | `user` | `oapi` | `official` | Action `get_meta` exposed by `feishu_drive_file`. | `POST:/open-apis/drive/v1/metas/batch_query` | [获取文件元数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/meta/batch_query) |
| `copy` | `user` | `oapi` | `official` | Action `copy` exposed by `feishu_drive_file`. | `POST:/open-apis/drive/v1/files/:file_token/copy` | [复制文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/copy) |
| `move` | `user` | `oapi` | `official` | Action `move` exposed by `feishu_drive_file`. | `POST:/open-apis/drive/v1/files/:file_token/move` | [移动文件或文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/move) |
| `delete` | `user` | `oapi` | `official` | Action `delete` exposed by `feishu_drive_file`. | `DELETE:/open-apis/drive/v1/files/:file_token` | [删除文件或文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/delete) |
| `upload` | `user` | `oapi` | `official` | Action `upload` exposed by `feishu_drive_file`. | `POST:/open-apis/drive/v1/files/upload_all<br>POST:/open-apis/drive/v1/files/upload_prepare<br>POST:/open-apis/drive/v1/files/upload_part<br>POST:/open-apis/drive/v1/files/upload_finish` | [上传文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/upload_all)<br>[分片上传文件-预上传](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/upload_prepare)<br>[分片上传文件-上传分片](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/upload_part)<br>[分片上传文件-完成上传](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/upload_finish) |
| `download` | `user` | `oapi` | `official` | Action `download` exposed by `feishu_drive_file`. | `GET:/open-apis/drive/v1/files/:file_token/download` | [下载文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/download) |

### `feishu_fetch_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/fetch.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `fetch-doc` | `user` | `mcp` | `official` | 获取飞书云文档内容，返回文档标题和 Markdown 格式内容. | `MCP:fetch-doc` | [MCP:fetch-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_get_user`

- Category: `common`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/common/get-user.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_get_user`. | `GET:/open-apis/authen/v1/user_info<br>GET:/open-apis/contact/v3/users/:user_id` | [获取用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/user_info/get)<br>[获取单个用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/user/get) |

### `feishu_im_bot_image`

- Category: `im`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/tat/im/resource.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `download_resource` | `tenant` | `oapi` | `official` | Action `download_resource` exposed by `feishu_im_bot_image`. | `GET:/open-apis/im/v1/messages/:message_id/resources/:file_key` | [获取消息中的资源文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-resource/get) |

### `feishu_im_user_fetch_resource`

- Category: `im`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/oapi/im/resource.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `download_resource` | `tenant` | `oapi` | `official` | Action `download_resource` exposed by `feishu_im_user_fetch_resource`. | `GET:/open-apis/im/v1/messages/:message_id/resources/:file_key` | [获取消息中的资源文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-resource/get) |

### `feishu_im_user_get_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list_messages` | `user` | `oapi` | `official` | Action `list_messages` exposed by `feishu_im_user_get_messages`. | `GET:/open-apis/im/v1/messages (container_id_type=chat)<br>POST:/open-apis/im/v1/chat_p2p/batch_query` | [获取会话历史消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list) |

### `feishu_im_user_get_thread_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list_thread_messages` | `user` | `oapi` | `official` | Action `list_thread_messages` exposed by `feishu_im_user_get_thread_messages`. | `GET:/open-apis/im/v1/messages (container_id_type=thread)` | [获取会话历史消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list) |

### `feishu_im_user_message`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `send` | `user` | `oapi` | `official` | Action `send` exposed by `feishu_im_user_message`. | `POST:/open-apis/im/v1/messages` | [发送消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create) |
| `reply` | `user` | `oapi` | `official` | Action `reply` exposed by `feishu_im_user_message`. | `POST:/open-apis/im/v1/messages/:message_id/reply` | [回复消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/reply) |

### `feishu_im_user_search_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search_messages` | `user` | `oapi` | `official` | Action `search_messages` exposed by `feishu_im_user_search_messages`. | `POST:/open-apis/search/v2/message<br>GET:/open-apis/im/v1/messages/mget<br>POST:/open-apis/im/v1/chats/batch_query` | [搜索消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/search-v2/message/create) |

### `feishu_mail_message`

- Category: `mail`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/mail/message.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_mail_message`. | `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages` | [列出邮件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message/list) |
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_mail_message`. | `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id` | [获取邮件详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message/get) |
| `send` | `user` | `oapi` | `official` | Action `send` exposed by `feishu_mail_message`. | `POST:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/send` | [发送邮件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message/send) |
| `attachment_download_url` | `user` | `oapi` | `official` | Action `attachment_download_url` exposed by `feishu_mail_message`. | `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id/attachments/download_url` | [获取附件下载链接](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message-attachment/download_url) |

### `feishu_meeting`

- Category: `meeting`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/meeting/meeting.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search` | `user` | `oapi` | `official` | 飞书视频会议工具. | `POST:/open-apis/vc/v1/meetings/search` | [搜索会议记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/meeting/search) |
| `get` | `user` | `oapi` | `official` | 飞书视频会议工具. | `GET:/open-apis/vc/v1/meetings/:meeting_id` | [获取会议详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/meeting/get) |
| `end` | `user` | `oapi` | `official` | 飞书视频会议工具. | `PATCH:/open-apis/vc/v1/meetings/:meeting_id/end` | [结束会议](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/meeting/end) |
| `get_note` | `user` | `oapi` | `official` | 飞书视频会议工具. | `GET:/open-apis/vc/v1/notes/:note_id` | [获取纪要详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/note/get) |

### `feishu_meeting_reserve`

- Category: `meeting`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/meeting/reserve.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `apply` | `user` | `oapi` | `official` | Action `apply` exposed by `feishu_meeting_reserve`. | `POST:/open-apis/vc/v1/reserves/apply` | [预约会议](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/reserve/apply) |
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_meeting_reserve`. | `GET:/open-apis/vc/v1/reserves/:reserve_id` | [获取预约](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/reserve/get) |
| `update` | `user` | `oapi` | `official` | Action `update` exposed by `feishu_meeting_reserve`. | `PUT:/open-apis/vc/v1/reserves/:reserve_id` | [更新预约](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/reserve/update) |
| `delete` | `user` | `oapi` | `official` | Action `delete` exposed by `feishu_meeting_reserve`. | `DELETE:/open-apis/vc/v1/reserves/:reserve_id` | [删除预约](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/reserve/delete) |
| `get_active_meeting` | `user` | `oapi` | `official` | Action `get_active_meeting` exposed by `feishu_meeting_reserve`. | `GET:/open-apis/vc/v1/reserves/:reserve_id/get_active_meeting` | [获取活跃会议](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/vc-v1/reserve/get_active_meeting) |

### `feishu_minutes`

- Category: `meeting`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/meeting/minutes.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `get` | `user` | `oapi` | `official` | 飞书妙记工具. | `GET:/open-apis/minutes/v1/minutes/${safeToken}` | [获取妙记信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute/get) |
| `transcript` | `user` | `oapi` | `official` | 飞书妙记工具. | `GET:/open-apis/minutes/v1/minutes/${safeToken}/transcript` | [导出妙记文字记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute-transcript/get) |
| `statistics` | `user` | `oapi` | `official` | 飞书妙记工具. | `GET:/open-apis/minutes/v1/minutes/${safeToken}/statistics` | [获取妙记统计数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute-statistics/get) |
| `artifacts` | `user` | `oapi` | `official` | 飞书妙记工具. | `GET:/open-apis/minutes/v1/minutes/${safeToken}/artifacts` | [获取妙记AI产物](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute/artifacts) |
| `media` | `user` | `oapi` | `official` | 飞书妙记工具. | `GET:/open-apis/minutes/v1/minutes/${safeToken}/media` | [下载妙记音视频文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute-media/get) |

### `feishu_oauth`

- Category: `auth`
- Transport: `plugin`
- Auth: `user`
- Source: `src/tools/oauth.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `revoke` | `user` | `plugin` | `non-official` | Action `revoke` exposed by `feishu_oauth`. | `-` | - |

### `feishu_oauth_batch_auth`

- Category: `auth`
- Transport: `plugin`
- Auth: `user`
- Source: `src/tools/oauth-batch-auth.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `authorize_all` | `user` | `plugin` | `non-official` | Action `authorize_all` exposed by `feishu_oauth_batch_auth`. | `-` | - |

### `feishu_search_doc_wiki`

- Category: `search`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/search/doc-search.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search` | `user` | `oapi` | `official` | Action `search` exposed by `feishu_search_doc_wiki`. | `POST:/open-apis/search/v2/doc_wiki/search` | [搜索文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/search-v2/doc_wiki/search) |

### `feishu_search_user`

- Category: `common`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/common/search-user.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `search` | `user` | `oapi` | `official` | Action `search` exposed by `feishu_search_user`. | `GET:/open-apis/search/v1/user` | [搜索用户](https://open.feishu.cn/document/ukTMukTMukTM/uMTM4UjLzEDO14yMxgTN) |

### `feishu_sheet`

- Category: `sheets`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/sheets/sheet.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `info` | `user` | `oapi` | `official` | Action `info` exposed by `feishu_sheet`. | `GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query<br>GET:/open-apis/wiki/v2/spaces/get_node` | [获取电子表格信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet/get)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node) |
| `read` | `user` | `oapi` | `official` | Action `read` exposed by `feishu_sheet`. | `GET:/open-apis/sheets/v2/spreadsheets/:token/values/:range<br>GET:/open-apis/wiki/v2/spaces/get_node<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query` | [读取单个范围](https://open.feishu.cn/document/ukTMukTMukTM/ugTMzUjL4EzM14COxMTN)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) |
| `write` | `user` | `oapi` | `official` | Action `write` exposed by `feishu_sheet`. | `PUT:/open-apis/sheets/v2/spreadsheets/:token/values<br>GET:/open-apis/wiki/v2/spaces/get_node<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query` | [向单个范围写入数据](https://open.feishu.cn/document/ukTMukTMukTM/uAjMzUjLwIzM14CMyMTN)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) |
| `append` | `user` | `oapi` | `official` | Action `append` exposed by `feishu_sheet`. | `POST:/open-apis/sheets/v2/spreadsheets/:token/values_append<br>GET:/open-apis/wiki/v2/spaces/get_node<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query` | [追加数据](https://open.feishu.cn/document/ukTMukTMukTM/uMjMzUjLzIzM14yMyMTN)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) |
| `find` | `user` | `oapi` | `official` | Action `find` exposed by `feishu_sheet`. | `POST:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/:sheet_id/find<br>GET:/open-apis/wiki/v2/spaces/get_node` | [查找单元格](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/find)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node) |
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_sheet`. | `POST:/open-apis/sheets/v3/spreadsheets<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query<br>PUT:/open-apis/sheets/v2/spreadsheets/:token/values` | [创建电子表格](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet/create)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query)<br>[向单个范围写入数据](https://open.feishu.cn/document/ukTMukTMukTM/uAjMzUjLwIzM14CMyMTN) |
| `export` | `user` | `oapi` | `official` | Action `export` exposed by `feishu_sheet`. | `POST:/open-apis/drive/v1/export_tasks<br>GET:/open-apis/drive/v1/export_tasks/:ticket<br>GET:/open-apis/drive/v1/export_tasks/file/:file_token/download<br>GET:/open-apis/wiki/v2/spaces/get_node` | [创建导出任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/export_task/create)<br>[查询导出任务结果](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/export_task/get)<br>[获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node) |

### `feishu_task_comment`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/comment.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书任务评论管理工具. | `POST:/open-apis/task/v2/comments` | [创建评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/create) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书任务评论管理工具. | `GET:/open-apis/task/v2/comments` | [获取评论列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/list) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书任务评论管理工具. | `GET:/open-apis/task/v2/comments/:comment_id` | [获取评论详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/get) |

### `feishu_task_subtask`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/subtask.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书任务的子任务管理工具. | `POST:/open-apis/task/v2/tasks/:task_guid/subtasks` | [创建子任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task-subtask/create) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书任务的子任务管理工具. | `GET:/open-apis/task/v2/tasks/:task_guid/subtasks` | [获取任务的子任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task-subtask/list) |

### `feishu_task_task`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/task.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书任务管理工具. | `POST:/open-apis/task/v2/tasks` | [创建任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/create) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书任务管理工具. | `GET:/open-apis/task/v2/tasks/:task_guid` | [获取任务详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/get) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书任务管理工具. | `GET:/open-apis/task/v2/tasks` | [列取任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/list) |
| `patch` | `user` | `oapi` | `official` | 【以用户身份】飞书任务管理工具. | `PATCH:/open-apis/task/v2/tasks/:task_guid` | [更新任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/patch) |

### `feishu_task_tasklist`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/tasklist.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `create` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `POST:/open-apis/task/v2/tasklists` | [创建清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/create) |
| `get` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `GET:/open-apis/task/v2/tasklists/:tasklist_guid` | [获取清单详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/get) |
| `list` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `GET:/open-apis/task/v2/tasklists` | [获取清单列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/list) |
| `tasks` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `GET:/open-apis/task/v2/tasklists/:tasklist_guid/tasks` | [获取清单任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/tasks) |
| `patch` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `PATCH:/open-apis/task/v2/tasklists/:tasklist_guid` | [更新清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/patch) |
| `add_members` | `user` | `oapi` | `official` | 【以用户身份】飞书任务清单管理工具. | `POST:/open-apis/task/v2/tasklists/:tasklist_guid/add_members` | [添加清单成员](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/add_members) |

### `feishu_update_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/update.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `update-doc` | `user` | `mcp` | `official` | 更新云文档（overwrite/append/replace_range/replace_all/insert_before/insert_after/delete_range，支持异步 task_id 查询）. | `MCP:update-doc` | [MCP:update-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_wiki_space`

- Category: `wiki`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/wiki/space.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_wiki_space`. | `GET:/open-apis/wiki/v2/spaces` | [获取知识空间列表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/list) |
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_wiki_space`. | `GET:/open-apis/wiki/v2/spaces/:space_id` | [获取知识空间信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get) |
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_wiki_space`. | `POST:/open-apis/wiki/v2/spaces` | [创建知识空间](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/create) |

### `feishu_wiki_space_node`

- Category: `wiki`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/wiki/space-node.ts`

| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |
|---|---|---|---|---|---|---|
| `list` | `user` | `oapi` | `official` | Action `list` exposed by `feishu_wiki_space_node`. | `GET:/open-apis/wiki/v2/spaces/:space_id/nodes` | [获取知识空间子节点列表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/list) |
| `get` | `user` | `oapi` | `official` | Action `get` exposed by `feishu_wiki_space_node`. | `GET:/open-apis/wiki/v2/spaces/get_node` | [获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node) |
| `create` | `user` | `oapi` | `official` | Action `create` exposed by `feishu_wiki_space_node`. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes` | [创建知识空间节点](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/create) |
| `move` | `user` | `oapi` | `official` | Action `move` exposed by `feishu_wiki_space_node`. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/move` | [移动知识空间节点](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/move) |
| `copy` | `user` | `oapi` | `official` | Action `copy` exposed by `feishu_wiki_space_node`. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/copy` | [创建知识空间节点副本](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/copy) |

## Chat Commands

| Command | Summary | Source |
|---|---|---|
| `/feishu` | Feishu plugin commands (subcommands: auth, doctor, start) | `src/commands/index.ts` |
| `/feishu auth` | Batch authorize user permissions via the unified command. | `src/commands/index.ts` |
| `/feishu doctor` | Run Feishu diagnostics via the unified command. | `src/commands/index.ts` |
| `/feishu help` | Show help for the unified Feishu command. | `src/commands/index.ts` |
| `/feishu onboarding` | Alias of `/feishu auth`. | `src/commands/index.ts` |
| `/feishu start` | Validate plugin configuration via the unified command. | `src/commands/index.ts` |
| `/feishu_auth` | Batch authorize user permissions for Feishu | `src/commands/index.ts` |
| `/feishu_diagnose` | Run Feishu plugin diagnostics to check config, connectivity, and permissions | `src/commands/index.ts` |
| `/feishu_doctor` | Run Feishu plugin diagnostics | `src/commands/index.ts` |

## References

- `docs/snapshots/feishu/feishu-server-api-list.json`
- `docs/snapshots/feishu/feishu-mcp-remote-server.md`

