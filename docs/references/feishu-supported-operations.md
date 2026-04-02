# Feishu Supported Operations

This file enumerates the Feishu-facing tool and command surface currently exposed by this repository.

## Scope

- Included: Registered Feishu-facing tools and chat commands exposed by the plugin entrypoint.
- Excluded: Internal helper functions and lower-level channel/outbound APIs not directly registered as tools or commands.

## Totals

- Tools: 38
- Operations: 103
- Chat commands: 8

## Tools

| Tool | Category | Transport | Auth | Operations | Source |
|---|---|---|---|---:|---|
| `feishu_get_user` | common | oapi | user | 1 | `src/tools/oapi/common/get-user.ts` |
| `feishu_search_user` | common | oapi | user | 1 | `src/tools/oapi/common/search-user.ts` |
| `feishu_chat` | chat | oapi | user | 2 | `src/tools/oapi/chat/chat.ts` |
| `feishu_chat_members` | chat | oapi | user | 1 | `src/tools/oapi/chat/members.ts` |
| `feishu_im_user_message` | im | oapi | user | 2 | `src/tools/oapi/im/message.ts` |
| `feishu_im_user_fetch_resource` | im | oapi | user | 1 | `src/tools/oapi/im/resource.ts` |
| `feishu_im_user_get_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_im_user_get_thread_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_im_user_search_messages` | im | oapi | user | 1 | `src/tools/oapi/im/message-read.ts` |
| `feishu_im_bot_image` | im | oapi | tenant | 1 | `src/tools/tat/im/resource.ts` |
| `feishu_calendar_calendar` | calendar | oapi | user | 3 | `src/tools/oapi/calendar/calendar.ts` |
| `feishu_calendar_event` | calendar | oapi | user | 9 | `src/tools/oapi/calendar/event.ts` |
| `feishu_calendar_event_attendee` | calendar | oapi | user | 2 | `src/tools/oapi/calendar/event-attendee.ts` |
| `feishu_calendar_freebusy` | calendar | oapi | user | 1 | `src/tools/oapi/calendar/freebusy.ts` |
| `feishu_attendance_shift` | attendance | oapi | tenant | 1 | `src/tools/oapi/attendance/shift.ts` |
| `feishu_attendance_group` | attendance | oapi | tenant | 2 | `src/tools/oapi/attendance/group.ts` |
| `feishu_task_task` | task | oapi | user | 4 | `src/tools/oapi/task/task.ts` |
| `feishu_task_tasklist` | task | oapi | user | 6 | `src/tools/oapi/task/tasklist.ts` |
| `feishu_task_comment` | task | oapi | user | 3 | `src/tools/oapi/task/comment.ts` |
| `feishu_task_subtask` | task | oapi | user | 2 | `src/tools/oapi/task/subtask.ts` |
| `feishu_bitable_app` | bitable | oapi | user | 5 | `src/tools/oapi/bitable/app.ts` |
| `feishu_bitable_app_table` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table.ts` |
| `feishu_bitable_app_table_record` | bitable | oapi | user | 7 | `src/tools/oapi/bitable/app-table-record.ts` |
| `feishu_bitable_app_table_field` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table-field.ts` |
| `feishu_bitable_app_table_view` | bitable | oapi | user | 4 | `src/tools/oapi/bitable/app-table-view.ts` |
| `feishu_drive_file` | drive | oapi | user | 7 | `src/tools/oapi/drive/file.ts` |
| `feishu_doc_media` | doc | oapi | user | 2 | `src/tools/oapi/drive/doc-media.ts` |
| `feishu_doc_comments` | doc | oapi | user | 3 | `src/tools/oapi/drive/doc-comments.ts` |
| `feishu_wiki_space` | wiki | oapi | user | 3 | `src/tools/oapi/wiki/space.ts` |
| `feishu_wiki_space_node` | wiki | oapi | user | 5 | `src/tools/oapi/wiki/space-node.ts` |
| `feishu_search_doc_wiki` | search | oapi | user | 1 | `src/tools/oapi/search/doc-search.ts` |
| `feishu_sheet` | sheet | oapi | user | 7 | `src/tools/oapi/sheets/sheet.ts` |
| `feishu_create_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/create.ts` |
| `feishu_fetch_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/fetch.ts` |
| `feishu_update_doc` | mcp-doc | mcp | user | 1 | `src/tools/mcp/doc/update.ts` |
| `feishu_oauth` | auth | plugin | user | 1 | `src/tools/oauth.ts` |
| `feishu_oauth_batch_auth` | auth | plugin | user | 1 | `src/tools/oauth-batch-auth.ts` |
| `feishu_ask_user_question` | interaction | plugin | conversation | 1 | `src/tools/ask-user-question.ts` |

### `feishu_get_user`

- Category: `common`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/common/get-user.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `get` | Get the current user profile or fetch a user profile by ID. | `GET:/open-apis/authen/v1/user_info<br>GET:/open-apis/contact/v3/users/:user_id` | [获取用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/user_info/get)<br>[获取单个用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/user/get) |

### `feishu_search_user`

- Category: `common`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/common/search-user.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `search` | Search users by keyword. | `GET:/open-apis/search/v1/user` | [搜索用户](https://open.feishu.cn/document/ukTMukTMukTM/uMTM4UjLzEDO14yMxgTN) |

### `feishu_chat`

- Category: `chat`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/chat/chat.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `search` | Search chats. | `GET:/open-apis/im/v1/chats/search` | [搜索对用户或机器人可见的群列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat/search) |
| `get` | Get chat details. | `GET:/open-apis/im/v1/chats/:chat_id` | [获取群信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat/get) |

### `feishu_chat_members`

- Category: `chat`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/chat/members.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list_members` | List members in a chat. | `GET:/open-apis/im/v1/chats/:chat_id/members` | [获取群成员列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat-members/get) |

### `feishu_im_user_message`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `send` | Send a message to a user or chat. | `POST:/open-apis/im/v1/messages` | [发送消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create) |
| `reply` | Reply to a message, optionally in-thread. | `POST:/open-apis/im/v1/messages/:message_id/reply` | [回复消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/reply) |

### `feishu_im_user_fetch_resource`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/resource.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `download_resource` | Download an image or file from an IM message as the user. | `GET:/open-apis/im/v1/messages/:message_id/resources/:file_key` | [获取消息中的资源文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-resource/get) |

### `feishu_im_user_get_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list_messages` | List chat history for a chat or P2P conversation. | `POST:/open-apis/im/v1/chat_p2p/batch_query<br>GET:/open-apis/im/v1/messages (container_id_type=chat)` | [获取会话历史消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list) |

### `feishu_im_user_get_thread_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list_thread_messages` | List messages inside a thread. | `GET:/open-apis/im/v1/messages (container_id_type=thread)` | [获取会话历史消息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list) |

### `feishu_im_user_search_messages`

- Category: `im`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/im/message-read.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `search_messages` | Search messages across chats and hydrate chat/message context. | `POST:/open-apis/search/v2/message/create<br>POST:/open-apis/im/v1/chats/batch_query<br>GET:/open-apis/im/v1/messages/mget` | - |

### `feishu_im_bot_image`

- Category: `im`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/tat/im/resource.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `download_resource` | Download an image or file from an IM message as the bot. | `GET:/open-apis/im/v1/messages/:message_id/resources/:file_key` | [获取消息中的资源文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-resource/get) |

### `feishu_calendar_calendar`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/calendar.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | List calendars. | `GET:/open-apis/calendar/v4/calendars` | [查询日历列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/list) |
| `get` | Get one calendar. | `GET:/open-apis/calendar/v4/calendars/:calendar_id` | [查询日历信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/get) |
| `primary` | Resolve the primary calendar. | `POST:/open-apis/calendar/v4/calendars/primary` | [查询主日历信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar/primary) |

### `feishu_calendar_event`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/event.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create an event and optionally add attendees. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events<br>POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [创建日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/create)<br>[添加日程参与人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/create) |
| `list` | List event instances in a time range. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view` | [查询日程视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instance_view) |
| `get` | Get an event. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [获取日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/get) |
| `patch` | Update an event. | `PATCH:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [更新日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/patch) |
| `delete` | Delete an event. | `DELETE:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id` | [删除日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/delete) |
| `search` | Search events. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/search` | - |
| `reply` | Reply to an invitation. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/reply` | [回复日程](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/reply) |
| `instances` | List recurrence instances. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/instances` | [获取重复日程实例](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instances) |
| `instance_view` | List expanded event instances. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view` | [查询日程视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event/instance_view) |

### `feishu_calendar_event_attendee`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/event-attendee.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Add attendees to an event. | `POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [添加日程参与人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/create) |
| `list` | List attendees of an event. | `GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees` | [获取日程参与人列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/calendar-event-attendee/list) |

### `feishu_calendar_freebusy`

- Category: `calendar`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/calendar/freebusy.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | Batch query free/busy. | `POST:/open-apis/calendar/v4/freebusy/batch` | [批量查询主日历日程忙闲信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/calendar-v4/freebusy/batch) |

### `feishu_attendance_shift`

- Category: `attendance`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/oapi/attendance/shift.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `query` | Query daily shifts for one or more users within a bounded date range. | `POST:/open-apis/attendance/v1/user_daily_shifts/query` | [查询排班表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/user_daily_shift/query) |

### `feishu_attendance_group`

- Category: `attendance`
- Transport: `oapi`
- Auth: `tenant`
- Source: `src/tools/oapi/attendance/group.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `get` | Get one attendance group by ID. | `GET:/open-apis/attendance/v1/groups/:group_id` | [按 ID 查询考勤组](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/group/get) |
| `list_users` | List users in an attendance group with paging. | `GET:/open-apis/attendance/v1/groups/:group_id/list_user` | [查询考勤组下所有成员](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/group/list_user) |

### `feishu_task_task`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/task.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a task. | `POST:/open-apis/task/v2/tasks` | [创建任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/create) |
| `get` | Get a task. | `GET:/open-apis/task/v2/tasks/:task_guid` | [获取任务详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/get) |
| `list` | List visible tasks for the current user. | `GET:/open-apis/task/v2/tasks` | [列取任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/list) |
| `patch` | Update a task. | `PATCH:/open-apis/task/v2/tasks/:task_guid` | [更新任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/patch) |

### `feishu_task_tasklist`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/tasklist.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a task list. | `POST:/open-apis/task/v2/tasklists` | [创建清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/create) |
| `get` | Get a task list. | `GET:/open-apis/task/v2/tasklists/:tasklist_guid` | [获取清单详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/get) |
| `list` | List task lists. | `GET:/open-apis/task/v2/tasklists` | [获取清单列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/list) |
| `tasks` | List tasks in a task list. | `GET:/open-apis/task/v2/tasklists/:tasklist_guid/tasks` | [获取清单任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/tasks) |
| `patch` | Update a task list. | `PATCH:/open-apis/task/v2/tasklists/:tasklist_guid` | [更新清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/patch) |
| `add_members` | Add task list members. | `POST:/open-apis/task/v2/tasklists/:tasklist_guid/add_members` | [添加清单成员](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/tasklist/add_members) |

### `feishu_task_comment`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/comment.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a task comment. | `POST:/open-apis/task/v2/comments` | [创建评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/create) |
| `list` | List task comments by resource. | `GET:/open-apis/task/v2/comments` | [获取评论列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/list) |
| `get` | Get a task comment. | `GET:/open-apis/task/v2/comments/:comment_id` | [获取评论详情](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/comment/get) |

### `feishu_task_subtask`

- Category: `task`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/task/subtask.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a subtask. | `POST:/open-apis/task/v2/tasks/:task_guid/subtasks` | [创建子任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task-subtask/create) |
| `list` | List subtasks. | `GET:/open-apis/task/v2/tasks/:task_guid/subtasks` | [获取任务的子任务列表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task-subtask/list) |

### `feishu_bitable_app`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a Bitable app. | `POST:/open-apis/bitable/v1/apps` | [创建多维表格](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/create) |
| `get` | Get a Bitable app. | `GET:/open-apis/bitable/v1/apps/:app_token` | [获取多维表格元数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/get) |
| `list` | List Bitable apps via Drive. | `GET:/open-apis/drive/v1/files` | [获取文件夹中的文件清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/list) |
| `patch` | Update a Bitable app. | `PATCH:/open-apis/bitable/v1/apps/:app_token` | - |
| `copy` | Copy a Bitable app. | `POST:/open-apis/bitable/v1/apps/:app_token/copy` | [复制多维表格](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app/copy) |

### `feishu_bitable_app_table`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a Bitable table. | `POST:/open-apis/bitable/v1/apps/:app_token/tables` | [新增一个数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/create) |
| `list` | List tables. | `GET:/open-apis/bitable/v1/apps/:app_token/tables` | [列出数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/list) |
| `patch` | Update a table. | `PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id` | [更新数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/patch) |
| `batch_create` | Batch create tables. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/batch_create` | [新增多个数据表](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table/batch_create) |

### `feishu_bitable_app_table_record`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-record.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create one record. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records` | [新增记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/create) |
| `list` | Search/list records. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/search` | [查询记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/search) |
| `update` | Update one record. | `PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id` | [更新记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/update) |
| `delete` | Delete one record. | `DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id` | [删除记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/delete) |
| `batch_create` | Batch create records. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_create` | [新增多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_create) |
| `batch_update` | Batch update records. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_update` | [更新多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_update) |
| `batch_delete` | Batch delete records. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_delete` | [删除多条记录](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/batch_delete) |

### `feishu_bitable_app_table_field`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-field.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a field. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields` | [新增字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/create) |
| `list` | List fields. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields` | [列出字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/list) |
| `update` | Update a field. | `PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id` | [更新字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/update) |
| `delete` | Delete a field. | `DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id` | [删除字段](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-field/delete) |

### `feishu_bitable_app_table_view`

- Category: `bitable`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/bitable/app-table-view.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create` | Create a view. | `POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views` | [新增视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/create) |
| `get` | Get a view. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id` | [获取视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/get) |
| `list` | List views. | `GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views` | [列出视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/list) |
| `patch` | Update a view. | `PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id` | [更新视图](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/patch) |

### `feishu_drive_file`

- Category: `drive`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/file.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | List drive files. | `GET:/open-apis/drive/v1/files` | [获取文件夹中的文件清单](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/list) |
| `get_meta` | Batch query file metadata. | `POST:/open-apis/drive/v1/metas/batch_query` | [获取文件元数据](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/meta/batch_query) |
| `copy` | Copy a drive file. | `POST:/open-apis/drive/v1/files/:file_token/copy` | [复制文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/copy) |
| `move` | Move a drive file. | `POST:/open-apis/drive/v1/files/:file_token/move` | [移动文件或文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/move) |
| `delete` | Delete a drive file. | `DELETE:/open-apis/drive/v1/files/:file_token` | [删除文件或文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/delete) |
| `upload` | Upload a file to drive. | `POST:/open-apis/drive/v1/files/upload_all` | [上传文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/upload_all) |
| `download` | Download a drive file. | `GET:/open-apis/drive/v1/files/:file_token/download` | [下载文件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/download) |

### `feishu_doc_media`

- Category: `doc`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/doc-media.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `insert` | Upload media and insert it into a doc block. | `POST:/open-apis/docx/v1/documents/:document_id/blocks/:block_id/children<br>POST:/open-apis/drive/v1/medias/upload_all<br>PATCH:/open-apis/docx/v1/documents/:document_id/blocks/batch_update` | [创建块](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/document-docx/docx-v1/document-block-children/create)<br>[上传素材](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/media/upload_all)<br>[批量更新块的内容](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/document-docx/docx-v1/document-block/batch_update) |
| `download` | Download doc media or whiteboard content. | `GET:/open-apis/drive/v1/medias/:file_token/download<br>GET:/open-apis/board/v1/whiteboards/:whiteboard_id/download_as_image` | [下载素材](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/media/download)<br>[获取画板缩略图片](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/board-v1/whiteboard/download_as_image) |

### `feishu_doc_comments`

- Category: `doc`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/drive/doc-comments.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | List whole-document comments and replies. | `GET:/open-apis/drive/v1/files/:file_token/comments<br>GET:/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies` | [获取云文档所有评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/list)<br>[获取回复信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment-reply/list) |
| `create` | Create a whole-document comment. | `POST:/open-apis/drive/v1/files/:file_token/comments` | [添加全文评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/create) |
| `patch` | Resolve or reopen a comment. | `PATCH:/open-apis/drive/v1/files/:file_token/comments/:comment_id` | [解决/恢复评论](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file-comment/patch) |

### `feishu_wiki_space`

- Category: `wiki`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/wiki/space.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | List wiki spaces. | `GET:/open-apis/wiki/v2/spaces` | [获取知识空间列表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/list) |
| `get` | Get a wiki space. | `GET:/open-apis/wiki/v2/spaces/:space_id` | [获取知识空间信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get) |
| `create` | Create a wiki space. | `POST:/open-apis/wiki/v2/spaces` | [创建知识空间](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/create) |

### `feishu_wiki_space_node`

- Category: `wiki`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/wiki/space-node.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `list` | List wiki nodes. | `GET:/open-apis/wiki/v2/spaces/:space_id/nodes` | [获取知识空间子节点列表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/list) |
| `get` | Resolve a wiki node token to the underlying object. | `GET:/open-apis/wiki/v2/spaces/get_node` | [获取知识空间节点信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get_node) |
| `create` | Create a wiki node. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes` | [创建知识空间节点](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/create) |
| `move` | Move a wiki node. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/move` | [移动知识空间节点](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/move) |
| `copy` | Copy a wiki node. | `POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/copy` | [创建知识空间节点副本](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space-node/copy) |

### `feishu_search_doc_wiki`

- Category: `search`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/search/doc-search.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `search` | Search docs and wiki nodes. | `POST:/open-apis/search/v2/doc_wiki/search` | [搜索文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/search-v2/doc_wiki/search) |

### `feishu_sheet`

- Category: `sheet`
- Transport: `oapi`
- Auth: `user`
- Source: `src/tools/oapi/sheets/sheet.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `info` | Get spreadsheet and sheet metadata. | `GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token<br>GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query` | [获取电子表格信息](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet/get)<br>[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) |
| `read` | Read cell values. | `GET:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values/:range` | - |
| `write` | Overwrite cell values. | `PUT:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values` | - |
| `append` | Append rows. | `POST:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values_append` | - |
| `find` | Find cells. | `POST:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/:sheet_id/find` | [查找单元格](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/find) |
| `create` | Create a spreadsheet and optionally seed data. | `POST:/open-apis/sheets/v3/spreadsheets<br>PUT:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values` | [创建电子表格](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet/create) |
| `export` | Export a spreadsheet via drive export task. | `POST:/open-apis/drive/v1/export_tasks<br>GET:/open-apis/drive/v1/export_tasks/:ticket<br>GET:/open-apis/drive/v1/export_tasks/file/:file_token/download` | [创建导出任务](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/export_task/create)<br>[查询导出任务结果](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/export_task/get) |

### `feishu_create_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/create.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `create-doc` | Create a Feishu doc through remote MCP. | `MCP:create-doc` | [MCP:create-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_fetch_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/fetch.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `fetch-doc` | Fetch a Feishu doc through remote MCP. | `MCP:fetch-doc` | [MCP:fetch-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_update_doc`

- Category: `mcp-doc`
- Transport: `mcp`
- Auth: `user`
- Source: `src/tools/mcp/doc/update.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `update-doc` | Update a Feishu doc through remote MCP. | `MCP:update-doc` | [MCP:update-doc](https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server) |

### `feishu_oauth`

- Category: `auth`
- Transport: `plugin`
- Auth: `user`
- Source: `src/tools/oauth.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `revoke` | Revoke the stored user authorization token. | `OAuth revoke (plugin-managed UAT storage)` | - |

### `feishu_oauth_batch_auth`

- Category: `auth`
- Transport: `plugin`
- Auth: `user`
- Source: `src/tools/oauth-batch-auth.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `authorize_all` | Start device-flow authorization for all app-granted user scopes. | `GET:/open-apis/application/v6/applications/:app_id<br>OAuth device flow` | [获取应用信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/application-v6/application/get) |

### `feishu_ask_user_question`

- Category: `interaction`
- Transport: `plugin`
- Auth: `conversation`
- Source: `src/tools/ask-user-question.ts`

| Operation | Summary | Backend | Official Docs |
|---|---|---|---|
| `ask` | Send an interactive Feishu card to ask follow-up questions. | `CardKit message send + callback handling` | - |

## Chat Commands

| Command | Summary | Source |
|---|---|---|
| `/feishu_diagnose` | Run plugin diagnostics. | `src/commands/index.ts` |
| `/feishu_doctor` | Run the richer Feishu doctor report. | `src/commands/index.ts` |
| `/feishu_auth` | Trigger batch authorization guidance. | `src/commands/index.ts` |
| `/feishu start` | Validate plugin configuration. | `src/commands/index.ts` |
| `/feishu auth` | Alias for authorization onboarding. | `src/commands/index.ts` |
| `/feishu onboarding` | Alias for authorization onboarding. | `src/commands/index.ts` |
| `/feishu doctor` | Run the doctor report via the unified command. | `src/commands/index.ts` |
| `/feishu help` | Show help. | `src/commands/index.ts` |

## References

- `docs/references/feishu-server-api-list.json`
- `docs/references/feishu-mcp-remote-server.md`
