# Feishu Skill Priority Plan

This document prioritizes the next Feishu skills to add to this repository based on:

- the current registered tool and command surface in [docs/references/feishu-supported-operations.md](/data/Workspace/openclaw-lark/docs/references/feishu-supported-operations.md)
- the official server API inventory in [docs/references/feishu-server-api-list.json](/data/Workspace/openclaw-lark/docs/references/feishu-server-api-list.json)
- the current gap analysis in [docs/references/feishu-skill-gap-analysis.md](/data/Workspace/openclaw-lark/docs/references/feishu-skill-gap-analysis.md)

## Goal

Increase practical user value by adding skills in the order that yields the most benefit per unit of implementation and maintenance cost.

The strategy is:

1. prefer skill-only additions on top of existing tools first
2. then add new skill + new tool families where the business value is clearly high
3. use MCP wrappers selectively when they provide a materially better path than existing OAPI tools

## Current Baseline

Current skills already cover:

- `feishu-approval`
- `feishu-bitable`
- `feishu-calendar`
- `feishu-create-doc`
- `feishu-fetch-doc`
- `feishu-im-read`
- `feishu-task`
- `feishu-troubleshoot`
- `feishu-update-doc`

This means the highest-leverage next work is no longer approval. The best next additions are the ones that can reuse already-registered tools with minimal new backend surface.

## Priority Tiers

### Tier 1: Add Skill on Top of Existing Tools

These should go first because they require little or no new tool implementation and directly improve model behavior.

#### 1. `feishu-sheet`

- Why:
  - `feishu_sheet` already exists with read, write, append, find, create, and export
  - spreadsheet operations are high-frequency office tasks
- Suggested first scope:
  - read ranges
  - append rows
  - overwrite ranges safely
  - find rows/cells before editing
  - create/export sheets when explicitly requested
- Dependency:
  - no new tool family required

#### 2. `feishu-drive-wiki`

- Why:
  - drive and wiki tools already exist
  - users often need navigation guidance more than raw API access
- Suggested first scope:
  - list folder contents
  - resolve wiki nodes to underlying document or sheet objects
  - move/copy wiki nodes and drive files
  - choose the right downstream doc/sheet/wiki tool after resolution
- Dependency:
  - no new tool family required

#### 3. `feishu-doc-collab`

- Why:
  - current doc skills focus on create/fetch/update
  - comment and media flows are already supported at tool level
- Suggested first scope:
  - list comments
  - add comments
  - update comment status where applicable
  - download embedded image/file resources
- Dependency:
  - no new tool family required

#### 4. `feishu-im-send`

- Why:
  - IM read has a skill, but sending and replying still rely on raw tool selection
  - this is a common daily-assistant workflow
- Suggested first scope:
  - send direct messages
  - send group messages
  - reply to a message
  - choose between plain send and reply based on context
- Dependency:
  - no new tool family required

#### 5. `feishu-search`

- Why:
  - user, chat, and doc/wiki search tools already exist
  - the model still needs a reusable “find first, act second” workflow
- Suggested first scope:
  - search user
  - search chat
  - search doc/wiki
  - hand off to IM, task, doc, or drive workflows after search
- Dependency:
  - no new tool family required

### Tier 2: Add New Skill + New Tool Family

These have strong product value, but require additional OAPI work rather than just skill guidance.

#### 6. `feishu-attendance`

- Why:
  - complements approval strongly
  - supports overtime, leave, shifts, and attendance anomaly scenarios
- Suggested first scope:
  - query user daily shifts
  - get attendance groups
  - list group users
  - support approval-adjacent attendance lookups
- Candidate APIs:
  - `POST:/open-apis/attendance/v1/user_daily_shifts/query`
  - `GET:/open-apis/attendance/v1/groups/:group_id`
  - `GET:/open-apis/attendance/v1/groups/:group_id/list_user`

#### 7. `feishu-meeting`

- Why:
  - calendar coverage exists, but video-meeting lifecycle does not
  - useful for reservation, meeting follow-up, and note retrieval
- Suggested first scope:
  - reserve meeting
  - get reserve detail
  - get active meeting from reserve
  - search meeting records
  - fetch meeting notes
- Candidate APIs:
  - `POST:/open-apis/vc/v1/reserves/apply`
  - `GET:/open-apis/vc/v1/reserves/:reserve_id`
  - `GET:/open-apis/vc/v1/reserves/:reserve_id/get_active_meeting`
  - `POST:/open-apis/vc/v1/meetings/search`
  - `GET:/open-apis/vc/v1/notes/:note_id`

#### 8. `feishu-mail`

- Why:
  - email is a major assistant workflow
  - currently no user-facing coverage exists
- Suggested first scope:
  - list inbox messages
  - get message detail
  - send email
  - fetch attachment download URLs
- Candidate APIs:
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages`
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id`
  - `POST:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/send`
  - `GET:/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id/attachments/download_url`

### Tier 3: MCP-Driven Additions

These are worth doing when MCP provides a simpler or better user path than existing OAPI tooling.

#### 9. `feishu-list-docs`

- Why:
  - remote MCP already exposes `list-docs`
  - repo skills currently emphasize create/fetch/update rather than doc-set browsing
- Recommended approach:
  - add a thin MCP wrapper first
  - then add a skill that teaches browsing and choosing the next doc action

#### 10. Optional MCP wrappers

- `get-comments`
- `add-comments`
- `fetch-file`
- `search-doc`

These are lower priority because current OAPI tools already overlap with much of the capability.

## Recommended Delivery Order

Implement in this order unless a near-term business request changes the ranking:

1. `feishu-sheet`
2. `feishu-drive-wiki`
3. `feishu-doc-collab`
4. `feishu-im-send`
5. `feishu-search`
6. `feishu-attendance`
7. `feishu-meeting`
8. `feishu-mail`
9. `feishu-list-docs`

## Scope Discipline

When executing this plan:

- prefer one skill per branch or stacked branch layer
- if a skill depends on a prerequisite tool fix, split the fix first
- keep fork-only behavior out unless explicitly required
- do not mix multiple new tool families in one initial feature branch
- for Tier 1 items, prefer shipping the skill before expanding tool breadth

## Definition of Ready for Each Next Skill

Before starting a skill from this list, confirm:

1. whether it is skill-only or skill + tool
2. the first user scenario to support
3. the exact tool/API surface to expose
4. the minimum tests to add
5. whether a README, workflow note, or release note entry needs updating

## Near-Term Recommendation

The next best item to implement is `feishu-sheet`.

Reason:

- highest user value among already-available tools
- no new backend tool family required
- low risk compared with attendance, meeting, or mail
- likely to improve real usage immediately through better prompting and safer operation sequencing
