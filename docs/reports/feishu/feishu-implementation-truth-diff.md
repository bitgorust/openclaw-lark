# Feishu Implementation vs Truth Source Diff

This file reports differences between code-derived tool auth declarations and canonical truth-source auth contracts.

## Inputs

- `docs/reports/feishu/feishu-supported-operations.json`
- `docs/reports/feishu/feishu-canonical-metadata.json`

## Semantics

- Declared auth: Code-derived auth declaration/observation from src/tools via supported-operations.
- Canonical auth: Final auth contract derived from official truth sources in canonical metadata.

## Summary

- Generated at: 2026-04-17T03:19:29.705Z
- Total actions: 139
- Aligned: 139
- Conflicts: 0
- Code narrower than truth: 0
- Code broader than truth: 0
- Partial overlap: 0
- Missing code auth: 0
- Missing canonical auth: 0
- Unknown: 0

## Non-aligned Actions

| Action | Relation | Declared Auth | Canonical Auth | Source | Auth Source |
|---|---|---|---|---|---|

## Detailed Actions

| Action | Relation | Declared Modes | Canonical Modes | Backend Count | Coverage |
|---|---|---|---|---:|---|
| `feishu_approval_cc.search` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_comment.create` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_comment.delete` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_comment.list` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_comment.remove` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_instance.get` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_instance.list` | `aligned` | `tenant` | `tenant` | 2 | `official` |
| `feishu_approval_task_search.download_attachment` | `aligned` | `tenant` | `tenant` | 3 | `official` |
| `feishu_approval_task_search.get_detail` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task_search.parse_attachment` | `aligned` | `tenant` | `tenant` | 3 | `official` |
| `feishu_approval_task_search.query` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_approval_task_search.search` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.add_sign` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.approve` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.reject` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.resubmit` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.rollback` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_approval_task.transfer` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_ask_user_question.ask` | `aligned` | `user` | `user` | 0 | `non-official` |
| `feishu_attendance_group.get` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_attendance_group.list_users` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_attendance_shift.query` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_bitable_app_table_field.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_field.delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_field.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_field.update` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_bitable_app_table_record.batch_create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.batch_delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.batch_update` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_record.update` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_view.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_view.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_view.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table_view.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table.batch_create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app_table.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app.copy` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_bitable_app.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_calendar.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_calendar.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_calendar.primary` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event_attendee.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event_attendee.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.create` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_calendar_event.delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.instance_view` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.instances` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.reply` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_event.search` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_calendar_freebusy.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_chat_members.list_members` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_chat.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_chat.search` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_create_doc.create-doc` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_doc_comments.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_doc_comments.list` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_doc_comments.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_doc_media.download` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_doc_media.insert` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.copy` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.download` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.get_meta` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.move` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_drive_file.upload` | `aligned` | `user` | `user` | 4 | `official` |
| `feishu_fetch_doc.fetch-doc` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_get_user.get` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_im_bot_image.download_resource` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_im_user_fetch_resource.download_resource` | `aligned` | `tenant` | `tenant` | 1 | `official` |
| `feishu_im_user_get_messages.list_messages` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_im_user_get_thread_messages.list_thread_messages` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_im_user_message.reply` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_im_user_message.send` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_im_user_search_messages.search_messages` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_mail_message.attachment_download_url` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_mail_message.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_mail_message.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_mail_message.send` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting_reserve.apply` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting_reserve.delete` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting_reserve.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting_reserve.get_active_meeting` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting_reserve.update` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting.end` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting.get_note` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_meeting.search` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_minutes.artifacts` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_minutes.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_minutes.media` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_minutes.statistics` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_minutes.transcript` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_oauth_batch_auth.authorize_all` | `aligned` | `user` | `user` | 0 | `non-official` |
| `feishu_oauth.revoke` | `aligned` | `user` | `user` | 0 | `non-official` |
| `feishu_search_doc_wiki.search` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_search_user.search` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_sheet.append` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_sheet.create` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_sheet.export` | `aligned` | `user` | `user` | 4 | `official` |
| `feishu_sheet.find` | `aligned` | `user` | `user` | 2 | `official` |
| `feishu_sheet.info` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_sheet.read` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_sheet.write` | `aligned` | `user` | `user` | 3 | `official` |
| `feishu_task_comment.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_comment.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_comment.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_subtask.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_subtask.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_task.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_task.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_task.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_task.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.add_members` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.patch` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_task_tasklist.tasks` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_update_doc.update-doc` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space_node.copy` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space_node.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space_node.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space_node.list` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space_node.move` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space.create` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space.get` | `aligned` | `user` | `user` | 1 | `official` |
| `feishu_wiki_space.list` | `aligned` | `user` | `user` | 1 | `official` |

