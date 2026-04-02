# Feishu Skill Gap Analysis

This note identifies Feishu capabilities that are available in the official server API list or remote MCP, but are not yet covered well by this repository's skill layer.

## Current Baseline

- Existing exposed surface: 36 tools, 100 operations, 8 chat commands.
- Existing skills cover: bitable, calendar, doc create/fetch/update, IM read, task, troubleshooting.
- Gaps fall into two buckets:
  - Existing tools with no dedicated skill.
  - No tool or skill support yet, despite clear product value and official API coverage.

## Priority 1: Add New Skill + New Tool

### 1. `feishu-approval`

- Why: approval is a core enterprise workflow and directly matches real user asks such as pending overtime or leave approvals.
- Suggested first scope:
  - list my pending approval tasks
  - get approval instance detail
  - approve / reject / transfer / rollback
- Candidate APIs:
  - `GET:/open-apis/approval/v4/instances`
  - `GET:/open-apis/approval/v4/instances/:instance_id`
  - `POST:/open-apis/approval/v4/tasks/approve`
  - `POST:/open-apis/approval/v4/tasks/reject`
  - `POST:/open-apis/approval/v4/tasks/transfer`
  - `POST:/open-apis/approval/v4/instances/specified_rollback`

### 2. `feishu-attendance`

- Why: complements approval well for overtime, leave, shifts, and attendance anomaly scenarios.
- Suggested first scope:
  - query user daily shifts
  - query attendance groups and members
  - query attendance-related records needed for overtime follow-up
- Candidate APIs:
  - `POST:/open-apis/attendance/v1/user_daily_shifts/query`
  - `GET:/open-apis/attendance/v1/groups/:group_id`
  - `GET:/open-apis/attendance/v1/groups/:group_id/list_user`

### 3. `feishu-meeting`

- Why: current repo covers calendar, but not video meeting lifecycle or meeting records.
- Suggested first scope:
  - reserve meeting
  - get reserve / active meeting
  - search meeting records
  - fetch meeting notes
- Candidate APIs:
  - `POST:/open-apis/vc/v1/reserves/apply`
  - `GET:/open-apis/vc/v1/reserves/:reserve_id`
  - `GET:/open-apis/vc/v1/reserves/:reserve_id/get_active_meeting`
  - `POST:/open-apis/vc/v1/meetings/search`
  - `GET:/open-apis/vc/v1/notes/:note_id`

### 4. `feishu-mail`

- Why: reading and sending email is a common assistant workflow, currently unsupported.
- Suggested first scope:
  - list inbox messages
  - get message detail
  - send email
  - fetch attachment download URL
- Candidate APIs:
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages`
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id`
  - `POST:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/send`
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id/attachments/download_url`

## Priority 2: Add Skill Only on Top of Existing Tools

### 5. `feishu-sheet`

- Reason: [sheet.ts](/data/Workspace/openclaw-lark/src/tools/oapi/sheets/sheet.ts) already supports read/write/append/find/create/export, but there is no dedicated skill.
- User value: spreadsheet read-write is one of the most common office tasks.

### 6. `feishu-drive-wiki`

- Reason: drive and wiki APIs already exist in [file.ts](/data/Workspace/openclaw-lark/src/tools/oapi/drive/file.ts), [space.ts](/data/Workspace/openclaw-lark/src/tools/oapi/wiki/space.ts), and [space-node.ts](/data/Workspace/openclaw-lark/src/tools/oapi/wiki/space-node.ts), but there is no skill that teaches the model how to browse folders, resolve wiki nodes, and move/copy content.
- Suggested scope:
  - list folder contents
  - resolve wiki node to underlying object
  - copy or move wiki nodes

### 7. `feishu-doc-collab`

- Reason: comment and media operations already exist, but current document skills focus on create/fetch/update content only.
- Suggested scope:
  - list comments
  - add comments
  - resolve comment status
  - download embedded images/files

### 8. `feishu-im-send`

- Reason: IM read has a dedicated skill, but send/reply is only available at tool level through [message.ts](/data/Workspace/openclaw-lark/src/tools/oapi/im/message.ts).
- Suggested scope:
  - send direct message
  - send group message
  - reply in thread

### 9. `feishu-search`

- Reason: user search, chat search, and doc/wiki search exist, but the repository has no unified skill that teaches “find the right person/chat/doc first”.
- Suggested scope:
  - search user
  - search chat
  - search doc/wiki
  - then hand off to IM/task/doc flows

## Priority 3: MCP Gaps Worth Filling

### 10. `feishu-list-docs`

- Why: remote MCP already supports `list-docs`, but the repo only wraps `create-doc`, `fetch-doc`, and `update-doc`.
- Recommendation: add a thin MCP wrapper first; this is low-risk and immediately useful for doc-set browsing.

### 11. Optional MCP wrappers

- `get-comments`
- `add-comments`
- `fetch-file`
- `search-doc`

These are lower priority because the repository already has overlapping OAPI coverage for most of them. Prefer improving skill guidance first unless MCP proves materially better in practice.

## Recommended Delivery Order

1. `feishu-approval`
2. `feishu-sheet`
3. `feishu-drive-wiki`
4. `feishu-doc-collab`
5. `feishu-im-send`
6. `feishu-attendance`
7. `feishu-meeting`
8. `feishu-mail`
9. `feishu-list-docs`
