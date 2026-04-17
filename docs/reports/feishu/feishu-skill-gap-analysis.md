# Feishu Skill Gap Analysis

This note identifies Feishu capabilities that are available in the official server API list or remote MCP, but are not yet covered well by this repository's skill layer.

## Current Baseline

- Existing exposed surface: 43 tools, 118 operations, 8 chat commands.
- Current skill coverage from `docs/reports/feishu/feishu-skill-coverage.json`: 39/39 eligible tools covered, 114/114 eligible operations covered, 0 unknown tool references.
- Existing skills cover: approval, attendance, bitable, calendar, search, sheet, task, IM read/send, doc create/fetch/update, doc collaboration, drive/wiki, auth/troubleshooting.
- Gaps fall into two buckets:
  - Existing tools with no dedicated skill.
  - No tool or skill support yet, despite clear product value and official API coverage.
- `node-sdk` canonical truth has shifted the priority:
  - server-side service API coverage is now 100% (`1432/1432`)
  - canonical generated API inventory is now 1723 methods across 55 projects
  - event coverage remains 88.73% (`181/204`)
  - so next-wave skill work should optimize product value and orchestration quality, not hunt for missing server API wrappers first

## Priority 1: Add New Skill + New Tool

### 1. `feishu-meeting`

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

### 2. `feishu-mail`

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

## Priority 2: Existing Skill Coverage That Still Needs Depth

### 3. `feishu-auth`

- Now covered by a dedicated skill, but the next expansion should include:
  - more explicit tenant-only / dual-mode examples
  - troubleshooting playbooks keyed by normalized auth errors
  - better coordination with approval / IM / attendance skills

### 4. `feishu-search`

- Search already has a dedicated skill, but it should become the common front door for:
  - people resolution before approval transfer / task assignment / IM send
  - chat resolution before IM read/send
  - doc/wiki resolution before sheet/doc/drive flows

### 5. `feishu-drive-wiki`

- Skill exists, but should absorb more of the current drive + wiki capability surface:
  - folder browsing
  - move/copy flows
  - object-type handoff to downstream skills

### 6. `feishu-doc-collab`

- Skill exists, but should expand to cover more comment-resolution and media workflows.

### 7. `feishu-im-send`

- Skill exists, but must stay aligned with the canonical tenant-only contract for send/reply and document safe targeting patterns.

## Priority 3: MCP Gaps Worth Filling

### 8. `feishu-list-docs`

- Why: remote MCP already supports `list-docs`, but the repo only wraps `create-doc`, `fetch-doc`, and `update-doc`.
- Recommendation: add a thin MCP wrapper first; this is low-risk and immediately useful for doc-set browsing.

### 9. Optional MCP wrappers

- `get-comments`
- `add-comments`
- `fetch-file`
- `search-doc`

These are lower priority because the repository already has overlapping OAPI coverage for most of them. Prefer improving skill guidance first unless MCP proves materially better in practice.

## Recommended Delivery Order

1. `feishu-meeting`
2. `feishu-mail`
3. deepen `feishu-search`
4. deepen `feishu-drive-wiki`
5. deepen `feishu-doc-collab`
6. deepen `feishu-im-send`
7. `feishu-list-docs`
