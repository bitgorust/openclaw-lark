#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
API_LIST_JSON = ROOT / 'docs' / 'references' / 'feishu-server-api-list.json'
OUT_JSON = ROOT / 'docs' / 'references' / 'feishu-supported-operations.json'
OUT_MD = ROOT / 'docs' / 'references' / 'feishu-supported-operations.md'
DOCS_BASE_URL = 'https://open.feishu.cn'
MCP_REMOTE_DOC_URL = (
  'https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server'
)


TOOLS = [
  {
    'tool': 'feishu_get_user',
    'category': 'common',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/common/get-user.ts',
    'operations': [
      {
        'name': 'get',
        'summary': 'Get the current user profile or fetch a user profile by ID.',
        'backend': ['GET:/open-apis/authen/v1/user_info', 'GET:/open-apis/contact/v3/users/:user_id'],
      },
    ],
  },
  {
    'tool': 'feishu_search_user',
    'category': 'common',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/common/search-user.ts',
    'operations': [
      {
        'name': 'search',
        'summary': 'Search users by keyword.',
        'backend': ['GET:/open-apis/search/v1/user'],
      },
    ],
  },
  {
    'tool': 'feishu_chat',
    'category': 'chat',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/chat/chat.ts',
    'operations': [
      {'name': 'search', 'summary': 'Search chats.', 'backend': ['GET:/open-apis/im/v1/chats/search']},
      {'name': 'get', 'summary': 'Get chat details.', 'backend': ['GET:/open-apis/im/v1/chats/:chat_id']},
    ],
  },
  {
    'tool': 'feishu_chat_members',
    'category': 'chat',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/chat/members.ts',
    'operations': [
      {
        'name': 'list_members',
        'summary': 'List members in a chat.',
        'backend': ['GET:/open-apis/im/v1/chats/:chat_id/members'],
      },
    ],
  },
  {
    'tool': 'feishu_im_user_message',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/im/message.ts',
    'operations': [
      {
        'name': 'send',
        'summary': 'Send a message to a user or chat (tenant-only).',
        'backend': ['POST:/open-apis/im/v1/messages'],
      },
      {
        'name': 'reply',
        'summary': 'Reply to a message, optionally in-thread (tenant-only).',
        'backend': ['POST:/open-apis/im/v1/messages/:message_id/reply'],
      },
    ],
  },
  {
    'tool': 'feishu_im_user_fetch_resource',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/im/resource.ts',
    'operations': [
      {
        'name': 'download_resource',
        'summary': 'Download an image or file from an IM message as the user.',
        'backend': ['GET:/open-apis/im/v1/messages/:message_id/resources/:file_key'],
      },
    ],
  },
  {
    'tool': 'feishu_im_user_get_messages',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/im/message-read.ts',
    'operations': [
      {
        'name': 'list_messages',
        'summary': 'List chat history for a chat or P2P conversation (tenant-only).',
        'backend': [
          'POST:/open-apis/im/v1/chat_p2p/batch_query',
          'GET:/open-apis/im/v1/messages (container_id_type=chat)',
        ],
      },
    ],
  },
  {
    'tool': 'feishu_im_user_get_thread_messages',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/im/message-read.ts',
    'operations': [
      {
        'name': 'list_thread_messages',
        'summary': 'List messages inside a thread (tenant-only).',
        'backend': ['GET:/open-apis/im/v1/messages (container_id_type=thread)'],
      },
    ],
  },
  {
    'tool': 'feishu_im_user_search_messages',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/im/message-read.ts',
    'operations': [
      {
        'name': 'search_messages',
        'summary': 'Search messages across chats and hydrate chat/message context.',
        'backend': [
          'POST:/open-apis/search/v2/message/create',
          'POST:/open-apis/im/v1/chats/batch_query',
          'GET:/open-apis/im/v1/messages/mget',
        ],
      },
    ],
  },
  {
    'tool': 'feishu_im_bot_image',
    'category': 'im',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/tat/im/resource.ts',
    'operations': [
      {
        'name': 'download_resource',
        'summary': 'Download an image or file from an IM message as the bot.',
        'backend': ['GET:/open-apis/im/v1/messages/:message_id/resources/:file_key'],
      },
    ],
  },
  {
    'tool': 'feishu_calendar_calendar',
    'category': 'calendar',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/calendar/calendar.ts',
    'operations': [
      {'name': 'list', 'summary': 'List calendars.', 'backend': ['GET:/open-apis/calendar/v4/calendars']},
      {'name': 'get', 'summary': 'Get one calendar.', 'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id']},
      {'name': 'primary', 'summary': 'Resolve the primary calendar.', 'backend': ['POST:/open-apis/calendar/v4/calendars/primary']},
    ],
  },
  {
    'tool': 'feishu_calendar_event',
    'category': 'calendar',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/calendar/event.ts',
    'operations': [
      {
        'name': 'create',
        'summary': 'Create an event and optionally add attendees.',
        'backend': [
          'POST:/open-apis/calendar/v4/calendars/:calendar_id/events',
          'POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees',
        ],
      },
      {
        'name': 'list',
        'summary': 'List event instances in a time range.',
        'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view'],
      },
      {'name': 'get', 'summary': 'Get an event.', 'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id']},
      {'name': 'patch', 'summary': 'Update an event.', 'backend': ['PATCH:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id']},
      {'name': 'delete', 'summary': 'Delete an event.', 'backend': ['DELETE:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id']},
      {'name': 'search', 'summary': 'Search events.', 'backend': ['POST:/open-apis/calendar/v4/calendars/:calendar_id/events/search']},
      {'name': 'reply', 'summary': 'Reply to an invitation.', 'backend': ['POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/reply']},
      {'name': 'instances', 'summary': 'List recurrence instances.', 'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/instances']},
      {'name': 'instance_view', 'summary': 'List expanded event instances.', 'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view']},
    ],
  },
  {
    'tool': 'feishu_calendar_event_attendee',
    'category': 'calendar',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/calendar/event-attendee.ts',
    'operations': [
      {'name': 'create', 'summary': 'Add attendees to an event.', 'backend': ['POST:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees']},
      {'name': 'list', 'summary': 'List attendees of an event.', 'backend': ['GET:/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees']},
    ],
  },
  {
    'tool': 'feishu_calendar_freebusy',
    'category': 'calendar',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/calendar/freebusy.ts',
    'operations': [
      {'name': 'list', 'summary': 'Batch query free/busy.', 'backend': ['POST:/open-apis/calendar/v4/freebusy/batch']},
    ],
  },
  {
    'tool': 'feishu_attendance_shift',
    'category': 'attendance',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/attendance/shift.ts',
    'operations': [
      {
        'name': 'query',
        'summary': 'Query daily shifts for one or more users over a bounded date range (tenant-only).',
        'backend': ['POST:/open-apis/attendance/v1/user_daily_shifts/query'],
      },
    ],
  },
  {
    'tool': 'feishu_attendance_group',
    'category': 'attendance',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/attendance/group.ts',
    'operations': [
      {
        'name': 'get',
        'summary': 'Get one attendance group by ID.',
        'backend': ['GET:/open-apis/attendance/v1/groups/:group_id'],
      },
      {
        'name': 'list_users',
        'auth': 'dual',
        'summary': 'List users in an attendance group with paging (tenant preferred, user allowed).',
        'backend': ['GET:/open-apis/attendance/v1/groups/:group_id/list_user'],
      },
    ],
  },
  {
    'tool': 'feishu_approval_instance',
    'category': 'approval',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/approval/instance.ts',
    'operations': [
      {
        'name': 'list',
        'summary': 'List approval instances for an approval definition within a time window (tenant-only).',
        'backend': ['GET:/open-apis/approval/v4/instances'],
      },
      {
        'name': 'get',
        'summary': 'Get approval instance details by instance ID (tenant-only).',
        'backend': ['GET:/open-apis/approval/v4/instances/:instance_id'],
      },
    ],
  },
  {
    'tool': 'feishu_approval_task_search',
    'category': 'approval',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/approval/task-search.ts',
    'operations': [
      {
        'name': 'query',
        'auth': 'dual',
        'summary': 'Query approval task queues by topic. Canonical contract is dual-mode; runtime currently prefers user mode.',
        'backend': ['GET:/open-apis/approval/v4/tasks/query'],
      },
      {
        'name': 'search',
        'auth': 'tenant',
        'summary': 'Search approval tasks with structured filters (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/tasks/search'],
      },
    ],
  },
  {
    'tool': 'feishu_approval_cc',
    'category': 'approval',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/approval/cc-search.ts',
    'operations': [
      {
        'name': 'search',
        'summary': 'Search approval CC records with structured filters (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/instances/search_cc'],
      },
    ],
  },
  {
    'tool': 'feishu_approval_comment',
    'category': 'approval',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/approval/comment.ts',
    'operations': [
      {
        'name': 'create',
        'summary': 'Create or reply to an approval comment (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/instances/:instance_id/comments'],
      },
      {
        'name': 'list',
        'summary': 'List approval comments for an instance. Canonical contract is tenant-only; runtime may fallback from user-preferring flows.',
        'backend': ['GET:/open-apis/approval/v4/instances/:instance_id/comments'],
      },
      {
        'name': 'delete',
        'summary': 'Delete one approval comment (tenant-only).',
        'backend': ['DELETE:/open-apis/approval/v4/instances/:instance_id/comments/:comment_id'],
      },
      {
        'name': 'remove',
        'summary': 'Remove all approval comments for an instance (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/instances/:instance_id/comments/remove'],
      },
    ],
  },
  {
    'tool': 'feishu_approval_task',
    'category': 'approval',
    'transport': 'oapi',
    'auth': 'tenant',
    'source': 'src/tools/oapi/approval/task.ts',
    'operations': [
      {
        'name': 'approve',
        'summary': 'Approve an approval task (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/tasks/approve'],
      },
      {
        'name': 'reject',
        'summary': 'Reject an approval task (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/tasks/reject'],
      },
      {
        'name': 'transfer',
        'summary': 'Transfer an approval task to another user (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/tasks/transfer'],
      },
      {
        'name': 'add_sign',
        'summary': 'Add signers to an approval instance (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/instances/add_sign'],
      },
      {
        'name': 'resubmit',
        'summary': 'Resubmit an approval task with updated form payload (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/tasks/resubmit'],
      },
      {
        'name': 'rollback',
        'summary': 'Rollback an approval instance to specific approved nodes (tenant-only).',
        'backend': ['POST:/open-apis/approval/v4/instances/specified_rollback'],
      },
    ],
  },
  {
    'tool': 'feishu_meeting_reserve',
    'category': 'meeting',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/meeting/reserve.ts',
    'operations': [
      {
        'name': 'apply',
        'auth': 'dual',
        'summary': 'Create a meeting reservation.',
        'backend': ['POST:/open-apis/vc/v1/reserves/apply'],
      },
      {
        'name': 'get',
        'auth': 'dual',
        'summary': 'Get one meeting reservation.',
        'backend': ['GET:/open-apis/vc/v1/reserves/:reserve_id'],
      },
      {
        'name': 'update',
        'auth': 'dual',
        'summary': 'Update one meeting reservation.',
        'backend': ['PUT:/open-apis/vc/v1/reserves/:reserve_id'],
      },
      {
        'name': 'delete',
        'auth': 'dual',
        'summary': 'Delete one meeting reservation.',
        'backend': ['DELETE:/open-apis/vc/v1/reserves/:reserve_id'],
      },
      {
        'name': 'get_active_meeting',
        'auth': 'dual',
        'summary': 'Resolve the active meeting behind a reservation.',
        'backend': ['GET:/open-apis/vc/v1/reserves/:reserve_id/get_active_meeting'],
      },
    ],
  },
  {
    'tool': 'feishu_meeting',
    'category': 'meeting',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/meeting/meeting.ts',
    'operations': [
      {
        'name': 'search',
        'auth': 'user',
        'summary': 'Search meetings.',
        'backend': ['POST:/open-apis/vc/v1/meetings/search'],
      },
      {
        'name': 'get',
        'auth': 'dual',
        'summary': 'Get one meeting.',
        'backend': ['GET:/open-apis/vc/v1/meetings/:meeting_id'],
      },
      {
        'name': 'end',
        'auth': 'user',
        'summary': 'End one meeting.',
        'backend': ['PATCH:/open-apis/vc/v1/meetings/:meeting_id/end'],
      },
      {
        'name': 'get_note',
        'auth': 'user',
        'summary': 'Get one meeting note.',
        'backend': ['GET:/open-apis/vc/v1/notes/:note_id'],
      },
    ],
  },
  {
    'tool': 'feishu_minutes',
    'category': 'meeting',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/meeting/minutes.ts',
    'operations': [
      {
        'name': 'get',
        'auth': 'dual',
        'summary': 'Get one minute record.',
        'backend': ['GET:/open-apis/minutes/v1/minutes/:minute_token'],
      },
      {
        'name': 'transcript',
        'auth': 'dual',
        'summary': 'Get minute transcript export info.',
        'backend': ['GET:/open-apis/minutes/v1/minutes/:minute_token/transcript'],
      },
      {
        'name': 'statistics',
        'auth': 'dual',
        'summary': 'Get minute statistics.',
        'backend': ['GET:/open-apis/minutes/v1/minutes/:minute_token/statistics'],
      },
      {
        'name': 'artifacts',
        'auth': 'dual',
        'summary': 'List minute artifacts.',
        'backend': ['GET:/open-apis/minutes/v1/minutes/:minute_token/artifacts'],
      },
      {
        'name': 'media',
        'auth': 'dual',
        'summary': 'Get minute media export info.',
        'backend': ['GET:/open-apis/minutes/v1/minutes/:minute_token/media'],
      },
    ],
  },
  {
    'tool': 'feishu_mail_message',
    'category': 'mail',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/mail/message.ts',
    'operations': [
      {
        'name': 'list',
        'auth': 'dual',
        'summary': 'List mailbox messages.',
        'backend': ['GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages'],
      },
      {
        'name': 'get',
        'auth': 'dual',
        'summary': 'Get one mailbox message.',
        'backend': ['GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id'],
      },
      {
        'name': 'send',
        'auth': 'user',
        'summary': 'Send one mailbox message.',
        'backend': ['POST:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/send'],
      },
      {
        'name': 'attachment_download_url',
        'auth': 'dual',
        'summary': 'Get attachment download URLs for one mailbox message.',
        'backend': ['GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id/attachments/download_url'],
      },
    ],
  },
  {
    'tool': 'feishu_task_task',
    'category': 'task',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/task/task.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a task.', 'backend': ['POST:/open-apis/task/v2/tasks']},
      {'name': 'get', 'summary': 'Get a task.', 'backend': ['GET:/open-apis/task/v2/tasks/:task_guid']},
      {'name': 'list', 'summary': 'List visible tasks for the current user.', 'backend': ['GET:/open-apis/task/v2/tasks']},
      {'name': 'patch', 'summary': 'Update a task.', 'backend': ['PATCH:/open-apis/task/v2/tasks/:task_guid']},
    ],
  },
  {
    'tool': 'feishu_task_tasklist',
    'category': 'task',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/task/tasklist.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a task list.', 'backend': ['POST:/open-apis/task/v2/tasklists']},
      {'name': 'get', 'summary': 'Get a task list.', 'backend': ['GET:/open-apis/task/v2/tasklists/:tasklist_guid']},
      {'name': 'list', 'summary': 'List task lists.', 'backend': ['GET:/open-apis/task/v2/tasklists']},
      {'name': 'tasks', 'summary': 'List tasks in a task list.', 'backend': ['GET:/open-apis/task/v2/tasklists/:tasklist_guid/tasks']},
      {'name': 'patch', 'summary': 'Update a task list.', 'backend': ['PATCH:/open-apis/task/v2/tasklists/:tasklist_guid']},
      {'name': 'add_members', 'summary': 'Add task list members.', 'backend': ['POST:/open-apis/task/v2/tasklists/:tasklist_guid/add_members']},
    ],
  },
  {
    'tool': 'feishu_task_comment',
    'category': 'task',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/task/comment.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a task comment.', 'backend': ['POST:/open-apis/task/v2/comments']},
      {'name': 'list', 'summary': 'List task comments by resource.', 'backend': ['GET:/open-apis/task/v2/comments']},
      {'name': 'get', 'summary': 'Get a task comment.', 'backend': ['GET:/open-apis/task/v2/comments/:comment_id']},
    ],
  },
  {
    'tool': 'feishu_task_subtask',
    'category': 'task',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/task/subtask.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a subtask.', 'backend': ['POST:/open-apis/task/v2/tasks/:task_guid/subtasks']},
      {'name': 'list', 'summary': 'List subtasks.', 'backend': ['GET:/open-apis/task/v2/tasks/:task_guid/subtasks']},
    ],
  },
  {
    'tool': 'feishu_bitable_app',
    'category': 'bitable',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/bitable/app.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a Bitable app.', 'backend': ['POST:/open-apis/bitable/v1/apps']},
      {'name': 'get', 'summary': 'Get a Bitable app.', 'backend': ['GET:/open-apis/bitable/v1/apps/:app_token']},
      {'name': 'list', 'summary': 'List Bitable apps via Drive.', 'backend': ['GET:/open-apis/drive/v1/files']},
      {'name': 'patch', 'summary': 'Update a Bitable app.', 'backend': ['PUT:/open-apis/bitable/v1/apps/:app_token']},
      {'name': 'copy', 'summary': 'Copy a Bitable app.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/copy']},
    ],
  },
  {
    'tool': 'feishu_bitable_app_table',
    'category': 'bitable',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/bitable/app-table.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a Bitable table.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables']},
      {'name': 'list', 'summary': 'List tables.', 'backend': ['GET:/open-apis/bitable/v1/apps/:app_token/tables']},
      {'name': 'patch', 'summary': 'Update a table.', 'backend': ['PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id']},
      {'name': 'batch_create', 'summary': 'Batch create tables.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/batch_create']},
    ],
  },
  {
    'tool': 'feishu_bitable_app_table_record',
    'category': 'bitable',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/bitable/app-table-record.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create one record.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records']},
      {'name': 'list', 'summary': 'Search/list records.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/search']},
      {'name': 'update', 'summary': 'Update one record.', 'backend': ['PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id']},
      {'name': 'delete', 'summary': 'Delete one record.', 'backend': ['DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/:record_id']},
      {'name': 'batch_create', 'summary': 'Batch create records.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_create']},
      {'name': 'batch_update', 'summary': 'Batch update records.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_update']},
      {'name': 'batch_delete', 'summary': 'Batch delete records.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_delete']},
    ],
  },
  {
    'tool': 'feishu_bitable_app_table_field',
    'category': 'bitable',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/bitable/app-table-field.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a field.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields']},
      {'name': 'list', 'summary': 'List fields.', 'backend': ['GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields']},
      {'name': 'update', 'summary': 'Update a field.', 'backend': ['PUT:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id']},
      {'name': 'delete', 'summary': 'Delete a field.', 'backend': ['DELETE:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/fields/:field_id']},
    ],
  },
  {
    'tool': 'feishu_bitable_app_table_view',
    'category': 'bitable',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/bitable/app-table-view.ts',
    'operations': [
      {'name': 'create', 'summary': 'Create a view.', 'backend': ['POST:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views']},
      {'name': 'get', 'summary': 'Get a view.', 'backend': ['GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id']},
      {'name': 'list', 'summary': 'List views.', 'backend': ['GET:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views']},
      {'name': 'patch', 'summary': 'Update a view.', 'backend': ['PATCH:/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id']},
    ],
  },
  {
    'tool': 'feishu_drive_file',
    'category': 'drive',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/drive/file.ts',
    'operations': [
      {'name': 'list', 'summary': 'List drive files.', 'backend': ['GET:/open-apis/drive/v1/files']},
      {'name': 'get_meta', 'summary': 'Batch query file metadata.', 'backend': ['POST:/open-apis/drive/v1/metas/batch_query']},
      {'name': 'copy', 'summary': 'Copy a drive file.', 'backend': ['POST:/open-apis/drive/v1/files/:file_token/copy']},
      {'name': 'move', 'summary': 'Move a drive file.', 'backend': ['POST:/open-apis/drive/v1/files/:file_token/move']},
      {'name': 'delete', 'summary': 'Delete a drive file.', 'backend': ['DELETE:/open-apis/drive/v1/files/:file_token']},
      {'name': 'upload', 'summary': 'Upload a file to drive.', 'backend': ['POST:/open-apis/drive/v1/files/upload_all']},
      {'name': 'download', 'summary': 'Download a drive file.', 'backend': ['GET:/open-apis/drive/v1/files/:file_token/download']},
    ],
  },
  {
    'tool': 'feishu_doc_media',
    'category': 'doc',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/drive/doc-media.ts',
    'operations': [
      {
        'name': 'insert',
        'summary': 'Upload media and insert it into a doc block.',
        'backend': [
          'POST:/open-apis/docx/v1/documents/:document_id/blocks/:block_id/children',
          'POST:/open-apis/drive/v1/medias/upload_all',
          'PATCH:/open-apis/docx/v1/documents/:document_id/blocks/batch_update',
        ],
      },
      {
        'name': 'download',
        'summary': 'Download doc media or whiteboard content.',
        'backend': [
          'GET:/open-apis/drive/v1/medias/:file_token/download',
          'GET:/open-apis/board/v1/whiteboards/:whiteboard_id/download_as_image',
        ],
      },
    ],
  },
  {
    'tool': 'feishu_doc_comments',
    'category': 'doc',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/drive/doc-comments.ts',
    'operations': [
      {'name': 'list', 'summary': 'List whole-document comments and replies.', 'backend': ['GET:/open-apis/drive/v1/files/:file_token/comments', 'GET:/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies']},
      {'name': 'create', 'summary': 'Create a whole-document comment.', 'backend': ['POST:/open-apis/drive/v1/files/:file_token/comments']},
      {'name': 'patch', 'summary': 'Resolve or reopen a comment.', 'backend': ['PATCH:/open-apis/drive/v1/files/:file_token/comments/:comment_id']},
    ],
  },
  {
    'tool': 'feishu_wiki_space',
    'category': 'wiki',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/wiki/space.ts',
    'operations': [
      {'name': 'list', 'summary': 'List wiki spaces.', 'backend': ['GET:/open-apis/wiki/v2/spaces']},
      {'name': 'get', 'summary': 'Get a wiki space.', 'backend': ['GET:/open-apis/wiki/v2/spaces/:space_id']},
      {'name': 'create', 'summary': 'Create a wiki space.', 'backend': ['POST:/open-apis/wiki/v2/spaces']},
    ],
  },
  {
    'tool': 'feishu_wiki_space_node',
    'category': 'wiki',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/wiki/space-node.ts',
    'operations': [
      {'name': 'list', 'summary': 'List wiki nodes.', 'backend': ['GET:/open-apis/wiki/v2/spaces/:space_id/nodes']},
      {'name': 'get', 'summary': 'Resolve a wiki node token to the underlying object.', 'backend': ['GET:/open-apis/wiki/v2/spaces/get_node']},
      {'name': 'create', 'summary': 'Create a wiki node.', 'backend': ['POST:/open-apis/wiki/v2/spaces/:space_id/nodes']},
      {'name': 'move', 'summary': 'Move a wiki node.', 'backend': ['POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/move']},
      {'name': 'copy', 'summary': 'Copy a wiki node.', 'backend': ['POST:/open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/copy']},
    ],
  },
  {
    'tool': 'feishu_search_doc_wiki',
    'category': 'search',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/search/doc-search.ts',
    'operations': [
      {'name': 'search', 'summary': 'Search docs and wiki nodes.', 'backend': ['POST:/open-apis/search/v2/doc_wiki/search']},
    ],
  },
  {
    'tool': 'feishu_sheet',
    'category': 'sheet',
    'transport': 'oapi',
    'auth': 'user',
    'source': 'src/tools/oapi/sheets/sheet.ts',
    'operations': [
      {'name': 'info', 'summary': 'Get spreadsheet and sheet metadata.', 'backend': ['GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token', 'GET:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/query']},
      {'name': 'read', 'summary': 'Read cell values.', 'backend': ['GET:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values/:range']},
      {'name': 'write', 'summary': 'Overwrite cell values.', 'backend': ['PUT:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values']},
      {'name': 'append', 'summary': 'Append rows.', 'backend': ['POST:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values_append']},
      {'name': 'find', 'summary': 'Find cells.', 'backend': ['POST:/open-apis/sheets/v3/spreadsheets/:spreadsheet_token/sheets/:sheet_id/find']},
      {'name': 'create', 'summary': 'Create a spreadsheet and optionally seed data.', 'backend': ['POST:/open-apis/sheets/v3/spreadsheets', 'PUT:/open-apis/sheets/v2/spreadsheets/:spreadsheet_token/values']},
      {'name': 'export', 'summary': 'Export a spreadsheet via drive export task.', 'backend': ['POST:/open-apis/drive/v1/export_tasks', 'GET:/open-apis/drive/v1/export_tasks/:ticket', 'GET:/open-apis/drive/v1/export_tasks/file/:file_token/download']},
    ],
  },
  {
    'tool': 'feishu_create_doc',
    'category': 'mcp-doc',
    'transport': 'mcp',
    'auth': 'user',
    'source': 'src/tools/mcp/doc/create.ts',
    'operations': [
      {'name': 'create-doc', 'summary': 'Create a Feishu doc through remote MCP.', 'backend': ['MCP:create-doc']},
    ],
  },
  {
    'tool': 'feishu_fetch_doc',
    'category': 'mcp-doc',
    'transport': 'mcp',
    'auth': 'user',
    'source': 'src/tools/mcp/doc/fetch.ts',
    'operations': [
      {'name': 'fetch-doc', 'summary': 'Fetch a Feishu doc through remote MCP.', 'backend': ['MCP:fetch-doc']},
    ],
  },
  {
    'tool': 'feishu_update_doc',
    'category': 'mcp-doc',
    'transport': 'mcp',
    'auth': 'user',
    'source': 'src/tools/mcp/doc/update.ts',
    'operations': [
      {'name': 'update-doc', 'summary': 'Update a Feishu doc through remote MCP.', 'backend': ['MCP:update-doc']},
    ],
  },
  {
    'tool': 'feishu_oauth',
    'category': 'auth',
    'transport': 'plugin',
    'auth': 'user',
    'source': 'src/tools/oauth.ts',
    'operations': [
      {'name': 'revoke', 'summary': 'Revoke the stored user authorization token.', 'backend': ['OAuth revoke (plugin-managed UAT storage)']},
    ],
  },
  {
    'tool': 'feishu_oauth_batch_auth',
    'category': 'auth',
    'transport': 'plugin',
    'auth': 'tenant',
    'source': 'src/tools/oauth-batch-auth.ts',
    'operations': [
      {'name': 'authorize_all', 'summary': 'Start device-flow authorization for all app-granted user scopes.', 'backend': ['GET:/open-apis/application/v6/applications/:app_id', 'OAuth device flow']},
    ],
  },
  {
    'tool': 'feishu_ask_user_question',
    'category': 'interaction',
    'transport': 'plugin',
    'auth': 'conversation',
    'source': 'src/tools/ask-user-question.ts',
    'operations': [
      {'name': 'ask', 'summary': 'Send an interactive Feishu card to ask follow-up questions.', 'backend': ['CardKit message send + callback handling']},
    ],
  },
]


COMMANDS = [
  {
    'command': '/feishu_diagnose',
    'source': 'src/commands/index.ts',
    'summary': 'Run plugin diagnostics.',
  },
  {
    'command': '/feishu_doctor',
    'source': 'src/commands/index.ts',
    'summary': 'Run the richer Feishu doctor report.',
  },
  {
    'command': '/feishu_auth',
    'source': 'src/commands/index.ts',
    'summary': 'Trigger batch authorization guidance.',
  },
  {
    'command': '/feishu start',
    'source': 'src/commands/index.ts',
    'summary': 'Validate plugin configuration.',
  },
  {
    'command': '/feishu auth',
    'source': 'src/commands/index.ts',
    'summary': 'Alias for authorization onboarding.',
  },
  {
    'command': '/feishu onboarding',
    'source': 'src/commands/index.ts',
    'summary': 'Alias for authorization onboarding.',
  },
  {
    'command': '/feishu doctor',
    'source': 'src/commands/index.ts',
    'summary': 'Run the doctor report via the unified command.',
  },
  {
    'command': '/feishu help',
    'source': 'src/commands/index.ts',
    'summary': 'Show help.',
  },
]


def normalize_backend_signature(backend: str) -> str:
  if backend.startswith('MCP:'):
    return backend
  if ' (' in backend:
    return backend.split(' (', 1)[0]
  return backend


def load_server_api_index() -> dict[str, dict]:
  payload = json.loads(API_LIST_JSON.read_text(encoding='utf-8'))
  apis = payload.get('data', {}).get('apis', [])
  return {api['url']: api for api in apis if api.get('url') and api.get('fullPath')}


def build_links_for_backend(backend: str, api_index: dict[str, dict]) -> list[dict]:
  normalized = normalize_backend_signature(backend)
  if normalized.startswith('MCP:'):
    return [
      {
        'kind': 'mcp',
        'label': normalized,
        'url': MCP_REMOTE_DOC_URL,
      },
    ]

  api = api_index.get(normalized)
  if not api:
    return []

  return [
    {
      'kind': 'oapi',
      'label': normalized,
      'name': api.get('name'),
      'url': f"{DOCS_BASE_URL}{api['fullPath']}",
    },
  ]


def build_payload() -> dict:
  api_index = load_server_api_index()
  tools = json.loads(json.dumps(TOOLS))
  for tool in tools:
    operation_auth_modes = sorted({operation.get('auth', tool['auth']) for operation in tool['operations']})
    tool['operationAuthModes'] = operation_auth_modes
    tool['hasMixedOperationAuth'] = len(operation_auth_modes) > 1
    for operation in tool['operations']:
      operation['auth'] = operation.get('auth', tool['auth'])
      links = []
      for backend in operation['backend']:
        links.extend(build_links_for_backend(backend, api_index))
      if links:
        operation['officialLinks'] = links

  operation_count = sum(len(tool['operations']) for tool in TOOLS)
  return {
    'generatedAt': datetime.now(timezone.utc).isoformat(),
    'scope': {
      'included': 'Registered Feishu-facing tools and chat commands exposed by the plugin entrypoint.',
      'excluded': 'Internal helper functions and lower-level channel/outbound APIs not directly registered as tools or commands.',
    },
    'references': {
      'serverApiList': 'docs/references/feishu-server-api-list.json',
      'mcpRemoteDoc': 'docs/references/feishu-mcp-remote-server.md',
      'mcpRemoteDocUrl': MCP_REMOTE_DOC_URL,
    },
    'totals': {
      'toolCount': len(tools),
      'operationCount': operation_count,
      'commandCount': len(COMMANDS),
    },
    'tools': tools,
    'commands': COMMANDS,
  }


def render_markdown(payload: dict) -> str:
  lines = []
  lines.append('# Feishu Supported Operations')
  lines.append('')
  lines.append('This file enumerates the Feishu-facing tool and command surface currently exposed by this repository.')
  lines.append('')
  lines.append('## Scope')
  lines.append('')
  lines.append(f"- Included: {payload['scope']['included']}")
  lines.append(f"- Excluded: {payload['scope']['excluded']}")
  lines.append('')
  lines.append('## Totals')
  lines.append('')
  lines.append(f"- Tools: {payload['totals']['toolCount']}")
  lines.append(f"- Operations: {payload['totals']['operationCount']}")
  lines.append(f"- Chat commands: {payload['totals']['commandCount']}")
  lines.append('')
  lines.append('## Tools')
  lines.append('')
  lines.append('| Tool | Category | Transport | Auth | Operations | Source |')
  lines.append('|---|---|---|---|---:|---|')
  for tool in payload['tools']:
    tool_auth_label = tool['auth']
    if tool.get('hasMixedOperationAuth'):
      tool_auth_label = f"{tool_auth_label} (mixed by operation)"
    lines.append(
      f"| `{tool['tool']}` | {tool['category']} | {tool['transport']} | {tool_auth_label} | {len(tool['operations'])} | `{tool['source']}` |"
    )
  lines.append('')
  for tool in payload['tools']:
    lines.append(f"### `{tool['tool']}`")
    lines.append('')
    lines.append(f"- Category: `{tool['category']}`")
    lines.append(f"- Transport: `{tool['transport']}`")
    lines.append(f"- Auth: `{tool['auth']}`")
    if tool.get('hasMixedOperationAuth'):
      formatted_auths = ', '.join(f"`{auth}`" for auth in tool['operationAuthModes'])
      lines.append(f"- Operation auth modes: {formatted_auths}")
    lines.append(f"- Source: `{tool['source']}`")
    lines.append('')
    lines.append('| Operation | Auth | Summary | Backend | Official Docs |')
    lines.append('|---|---|---|---|---|')
    for op in tool['operations']:
      backend = '<br>'.join(op['backend'])
      links = '<br>'.join(
        f"[{link.get('name') or link['label']}]({link['url']})"
        for link in op.get('officialLinks', [])
      ) or '-'
      lines.append(f"| `{op['name']}` | `{op['auth']}` | {op['summary']} | `{backend}` | {links} |")
    lines.append('')
  lines.append('## Chat Commands')
  lines.append('')
  lines.append('| Command | Summary | Source |')
  lines.append('|---|---|---|')
  for command in payload['commands']:
    lines.append(f"| `{command['command']}` | {command['summary']} | `{command['source']}` |")
  lines.append('')
  lines.append('## References')
  lines.append('')
  lines.append(f"- `{payload['references']['serverApiList']}`")
  lines.append(f"- `{payload['references']['mcpRemoteDoc']}`")
  lines.append('')
  return '\n'.join(lines)


def normalize_payload_for_comparison(payload: dict | None) -> dict | None:
  if payload is None:
    return None
  normalized = dict(payload)
  normalized.pop('generatedAt', None)
  return normalized


def main() -> int:
  payload = build_payload()
  json_text = json.dumps(payload, ensure_ascii=False, indent=2) + '\n'
  md_text = render_markdown(payload) + '\n'
  check = '--check' in sys.argv[1:]

  if check:
    json_current = json.loads(OUT_JSON.read_text(encoding='utf-8')) if OUT_JSON.exists() else None
    md_current = OUT_MD.read_text(encoding='utf-8') if OUT_MD.exists() else None
    changed = []
    if normalize_payload_for_comparison(json_current) != normalize_payload_for_comparison(payload):
      changed.append(str(OUT_JSON.relative_to(ROOT)))
    if md_current != md_text:
      changed.append(str(OUT_MD.relative_to(ROOT)))

    if changed:
      print('feishu supported-operations artifacts are out of date:')
      for item in changed:
        print(f'- {item}')
      return 1

    print('feishu supported-operations artifacts are up to date')
    return 0

  OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
  OUT_JSON.write_text(json_text, encoding='utf-8')
  OUT_MD.write_text(md_text, encoding='utf-8')
  print(f'wrote {OUT_JSON.relative_to(ROOT)}')
  print(f'wrote {OUT_MD.relative_to(ROOT)}')
  return 0


if __name__ == '__main__':
  raise SystemExit(main())
