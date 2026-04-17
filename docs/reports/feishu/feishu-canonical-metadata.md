# Feishu Canonical Metadata

This file is generated from:

- `docs/reports/feishu/feishu-supported-operations.json`
- `docs/snapshots/feishu/feishu-official-security.json`

## Summary

- Generated at: 2026-04-17T03:19:33.702Z
- Operations: 139
- Declared backends: 166
- Officially covered backends: 160
- Non-OAPI backends: 3
- OAPI backends missing official security metadata: 3
- Actions with fully official generated scopes: 131
- Actions with auth from declared+official intersection: 133
- Actions with declared-auth-only fallback: 6
- Actions with declared/auth conflict fallback: 0

## Actions

| Tool Action | Scope Status | Generated Auth | Auth Source | Notes |
|---|---|---|---|---|
| `feishu_approval_cc.search` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_comment.create` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_comment.list` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_comment.delete` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_comment.remove` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_instance.list` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_instance.get` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.approve` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.reject` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.transfer` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.add_sign` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.resubmit` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task.rollback` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task_search.query` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task_search.search` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task_search.get_detail` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task_search.download_attachment` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_approval_task_search.parse_attachment` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_ask_user_question.ask` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_attendance_group.get` | `official-complete` | `tenant-only` | `official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_attendance_group.list_users` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_attendance_shift.query` | `official-complete` | `tenant-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app.copy` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table.batch_create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_field.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_field.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_field.update` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_field.delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.update` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.batch_create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.batch_update` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.batch_delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_record.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_view.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_view.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_view.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_bitable_app_table_view.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_calendar.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_calendar.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_calendar.primary` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.search` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.reply` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.instances` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event.instance_view` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event_attendee.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_event_attendee.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_calendar_freebusy.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_chat.search` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_chat.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_chat_members.list_members` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_create_doc.create-doc` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_doc_comments.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_doc_comments.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_doc_comments.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_doc_media.insert` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_doc_media.download` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.get_meta` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.copy` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.move` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.upload` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_drive_file.download` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_fetch_doc.fetch-doc` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_get_user.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_bot_image.download_resource` | `official-complete` | `tenant-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_user_fetch_resource.download_resource` | `official-complete` | `tenant-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_user_get_messages.list_messages` | `partial-or-non-official` | `user-only` | `declared+official` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_im_user_get_thread_messages.list_thread_messages` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_user_message.send` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_user_message.reply` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_im_user_search_messages.search_messages` | `partial-or-non-official` | `user-only` | `declared+official` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_mail_message.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_mail_message.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_mail_message.send` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_mail_message.attachment_download_url` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting.search` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting.end` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting.get_note` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting_reserve.apply` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting_reserve.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting_reserve.update` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting_reserve.delete` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_meeting_reserve.get_active_meeting` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_minutes.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_minutes.transcript` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_minutes.statistics` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_minutes.artifacts` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_minutes.media` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_oauth.revoke` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_oauth_batch_auth.authorize_all` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_search_doc_wiki.search` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_search_user.search` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.info` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.read` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.write` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.append` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.find` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_sheet.export` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_comment.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_comment.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_comment.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_subtask.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_subtask.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_task.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_task.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_task.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_task.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.tasks` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.patch` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_task_tasklist.add_members` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_update_doc.update-doc` | `partial-or-non-official` | `user-only` | `declared` | at least one declared backend is non-OAPI or missing official security metadata |
| `feishu_wiki_space.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space_node.list` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space_node.get` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space_node.create` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space_node.move` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |
| `feishu_wiki_space_node.copy` | `official-complete` | `user-only` | `declared+official` | all declared backends are official OAPI endpoints with official security metadata |

