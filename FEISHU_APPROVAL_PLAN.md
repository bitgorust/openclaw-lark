# Feishu Approval Feature Plan

This document tracks the delivery plan for the `feishu-approval` skill and its backing tool families.

For the complete approval-domain API target, see [FEISHU_APPROVAL_API_COVERAGE.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_API_COVERAGE.md).  
For per-endpoint auth-mode decisions, see [FEISHU_APPROVAL_AUTH_MATRIX.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_AUTH_MATRIX.md).

## Goal

Make `feishu-approval` the single approval-domain skill for this plugin:

1. route common approval intents reliably
2. support real user-scoped approval queues and acting-user operations
3. grow endpoint coverage in phases without losing safety or auth clarity

## Current Status

The following pieces are already implemented on the current feature branch:

- `feishu_approval_instance`
  - `list`
  - `get`
  - user-first with tenant fallback for bounded scoped queries
- `feishu_approval_task`
  - `approve`
  - `reject`
  - `transfer`
  - `rollback`
  - `add_sign`
  - `resubmit`
  - user-mode default with auto-auth
- `feishu_approval_task_search`
  - `query`
  - `search`
  - user-mode default with auto-auth
- `feishu_approval_cc`
  - `search`
  - user-mode default with auto-auth
- `feishu_approval_comment`
  - `create`
  - `list`
  - `delete`
  - `remove`
  - comment list is user-first with tenant fallback; comment writes are user-mode default
- `skills/feishu-approval/SKILL.md`
  - high-frequency intent presets
  - parameter-completion rules
  - safety rules for high-risk actions

## Phase Breakdown

### Phase 1

Objective: establish the approval-domain foundation.

Delivered:

- instance list/get
- task approve/reject/transfer/rollback
- initial approval skill definition
- tests and docs foundation

### Phase 2

Objective: make the skill genuinely useful for personal approval workflows.

Delivered:

- task search and user task query
- CC search
- comments
- add sign / resubmit
- user-auth expansion for approval queues and task actions
- skill-level intent presets such as:
  - “待我审批”
  - “抄送我的审批”
  - “重提被退回审批”

Still to improve inside Phase 2:

- stronger queue presets and richer search presets
- better safety wording for high-risk write actions
- more production validation against real approval payloads

### Phase 3

Objective: cover instance-write and definition-read paths.

Planned:

- instance create
- instance preview
- instance cc
- instance cancel
- approval definition read
- file upload support for form fields

### Phase 4

Objective: cover tenant-level integration and admin workflows.

Planned:

- approval definition create
- subscription management
- approval bot messaging
- external approval integration

## Skill-Level Delivery Rules

The approval skill is no longer only a thin tool index. Future work should preserve these rules:

1. high-frequency Chinese intents should map to stable presets rather than ad hoc tool selection
2. missing critical structured fields must trigger补信息, not guessed payloads
3. high-risk write actions should require stronger confirmation language
4. dual-mode endpoints must keep explicit fallback policy instead of implicit behavior

## Near-Term Next Steps

1. strengthen queue presets beyond the current `topic` mapping
2. add safety-focused guidance for `add_sign`, `resubmit`, and comment bulk removal
3. expand approval instance write support: `create / preview / cc / cancel`
4. add approval definition read support
5. validate more real-world approval payload shapes and error cases

## Testing Expectations

Every approval expansion should add focused tests for:

1. request parameter shaping
2. auth-mode selection and fallback behavior
3. normalized result shape
4. error shaping
5. skill-facing assumptions where behavior could drift

## Commit Layering Recommendation

Implement approval changes in layers where possible:

1. prerequisite `fix:` commits first
2. `feat:` commit(s) for approval capability
3. `test:` and `docs:` follow-up commits when useful

If an approval feature depends on a generic fix, the fix should remain independently upstreamable rather than being merged into the feature commit.
