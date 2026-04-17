# Feishu Approval API Coverage Matrix

This document defines the target coverage for the `feishu-approval` skill against approval-related APIs listed in [docs/snapshots/feishu/feishu-server-api-list.json](/data/Workspace/openclaw-lark/docs/snapshots/feishu/feishu-server-api-list.json).

The goal is not to stop at the current implementation boundary. The goal is to maximize approval support from the perspective of the final product, then work backward to identify what tool families, auth flows, and safety controls are required.

For the auth-mode decision per approval endpoint and the concrete user-auth work required to support personal approval queues, see [FEISHU_APPROVAL_AUTH_MATRIX.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_AUTH_MATRIX.md).

## Goal

`feishu-approval` should become the single approval-domain skill for this plugin.

That means:

1. one skill owns approval-domain intent routing
2. multiple tool families may sit behind that skill
3. unsupported actions should be treated as implementation gaps to close, not as permanent exclusions merely because the current auth path is incomplete

## Design Principle

Coverage decisions should be made from the target capability set, then mapped to implementation work:

1. identify the approval API action
2. classify whether it is read, act, configure, integrate, or notify
3. determine whether it needs app identity, user identity, admin confirmation, or external system integration
4. implement the missing auth and execution path when the capability is in scope

Do not reduce the long-term skill scope merely because the current implementation only has tenant/app identity.

## Current Approval-Domain APIs

The local API inventory currently lists these approval-related endpoints.

### Core approval v4

- `POST:/open-apis/approval/v4/approvals`
- `GET:/open-apis/approval/v4/approvals/:approval_id`
- `POST:/open-apis/approval/v4/instances`
- `POST:/open-apis/approval/v4/instances/cancel`
- `POST:/open-apis/approval/v4/instances/cc`
- `POST:/open-apis/approval/v4/instances/preview`
- `GET:/open-apis/approval/v4/instances/:instance_id`
- `GET:/open-apis/approval/v4/instances`
- `POST:/open-apis/approval/v4/tasks/approve`
- `POST:/open-apis/approval/v4/tasks/reject`
- `POST:/open-apis/approval/v4/tasks/transfer`
- `POST:/open-apis/approval/v4/instances/specified_rollback`
- `POST:/open-apis/approval/v4/instances/add_sign`
- `POST:/open-apis/approval/v4/tasks/resubmit`
- `POST:/approval/openapi/v2/file/upload`
- `POST:/open-apis/approval/v4/instances/:instance_id/comments`
- `DELETE:/open-apis/approval/v4/instances/:instance_id/comments/:comment_id`
- `POST:/open-apis/approval/v4/instances/:instance_id/comments/remove`
- `GET:/open-apis/approval/v4/instances/:instance_id/comments`
- `POST:/open-apis/approval/v4/instances/query`
- `POST:/open-apis/approval/v4/instances/search_cc`
- `POST:/open-apis/approval/v4/tasks/search`
- `GET:/open-apis/approval/v4/tasks/query`
- `POST:/open-apis/approval/v4/approvals/:approval_code/subscribe`
- `POST:/open-apis/approval/v4/approvals/:approval_code/unsubscribe`
- `GET:/open-apis/approval/v4/districts`
- `POST:/open-apis/approval/v4/districts/search`

### Third-party approval integration

- `POST:/open-apis/approval/v4/external_approvals`
- `GET:/open-apis/approval/v4/external_approvals/:approval_code`
- `POST:/approval/openapi/v2/external/instanceOperate`
- `POST:/open-apis/approval/v4/external_instances`
- `POST:/open-apis/approval/v4/external_instances/check`
- `GET:/open-apis/approval/v4/external_tasks`

### Approval bot / event / special endpoints

- `POST:/approval/openapi/v1/message/send`
- `POST:/approval/openapi/v1/message/update`
- `POST:/approval/openapi/v1/id/get`
- `POST:/approval/openapi/v2/subscription/subscribe`
- `POST:/approval/openapi/v2/subscription/unsubscribe`

### Legacy approval openapi v2/v3

These mostly overlap the v4 surface and should not become the primary implementation target unless v4 coverage proves insufficient in a concrete production path.

- `POST:/approval/openapi/v2/approval/get`
- `POST:/approval/openapi/v2/instance/create`
- `POST:/approval/openapi/v2/instance/get`
- `POST:/approval/openapi/v2/instance/list`
- `POST:/approval/openapi/v2/instance/cc`
- `POST:/approval/openapi/v2/instance/cancel`
- `POST:/approval/openapi/v2/instance/approve`
- `POST:/approval/openapi/v2/instance/reject`
- `POST:/approval/openapi/v2/instance/transfer`
- `POST:/approval/openapi/v2/approval/create`
- `POST:/approval/openapi/v2/instance/search`
- `POST:/approval/openapi/v2/cc/search`
- `POST:/approval/openapi/v2/task/search`
- `POST:/approval/openapi/v3/external/approval/create`
- `POST:/approval/openapi/v2/external/instance/create`
- `POST:/approval/openapi/v3/external/instance/check`
- `POST:/approval/openapi/v2/external/list`

## Coverage Matrix

## 1. Must Support in `feishu-approval`

These are core approval actions that the skill should own directly.

| Capability | APIs | Target tool family | Current state | What is still needed |
|---|---|---|---|---|
| List approval instances in a bounded scope | `GET:/open-apis/approval/v4/instances`, `POST:/open-apis/approval/v4/instances/query` | `feishu_approval_instance` | Implemented (user-first with tenant fallback for bounded queries) | Add richer query mode beyond `approval_code + time window`; support server-side filters and pagination more completely |
| Get instance detail | `GET:/open-apis/approval/v4/instances/:instance_id` | `feishu_approval_instance` | Implemented (user-first with tenant fallback) | Keep normalized result stable; verify behavior against more real-world instance shapes |
| Approve / reject / transfer / rollback | `POST:/open-apis/approval/v4/tasks/approve`, `reject`, `transfer`, `POST:/open-apis/approval/v4/instances/specified_rollback` | `feishu_approval_task` | Implemented (user-mode default with auto-auth) | Add stronger task-status validation and clearer user guidance around rollback node selection |
| Search task list | `POST:/open-apis/approval/v4/tasks/search`, `GET:/open-apis/approval/v4/tasks/query` | `feishu_approval_task_search` or extension of `feishu_approval_task` | Implemented (`query` = user, `search` = tenant) | Expand result coverage, validate more real-world filters, and keep queue presets aligned with the split auth model |
| Search CC list | `POST:/open-apis/approval/v4/instances/search_cc` | `feishu_approval_cc` | Implemented (base search) | Expand CC-specific workflows, read-state handling, and richer result interpretation |
| Add sign / resubmit | `POST:/open-apis/approval/v4/instances/add_sign`, `POST:/open-apis/approval/v4/tasks/resubmit` | `feishu_approval_task` or `feishu_approval_task_advanced` | Implemented (base actions) | Add stronger safety prompts and more explicit guidance around payload construction, especially for `form` |
| Instance comments | comment create/get/delete/remove APIs | `feishu_approval_comment` | Implemented (create/list/delete/remove) | Add comment update semantics, deeper reply workflows, and stronger safety language for remove-all |
| Create / cancel / preview / cc an instance | instance create/cancel/preview/cc APIs | `feishu_approval_instance_write` | Not implemented | Add form payload modeling, stronger confirmation flows, and upload integration for file fields |
| Approval definition read | `GET:/open-apis/approval/v4/approvals/:approval_id` | `feishu_approval_definition` | Not implemented | Add definition lookup and normalization |

## 2. Should Support After User-Auth Expansion

These actions are still part of the skill target. Current lack of user-token support is an implementation gap, not a reason to permanently exclude them.

| Capability | APIs | Why current implementation falls short | Required work |
|---|---|---|---|
| Query “待我审批” / my pending approvals | Primarily user-scoped task-query surfaces such as `GET:/open-apis/approval/v4/tasks/query`, possibly filtered task search flows | Base user-token acquisition, storage, refresh, and auto-auth are now wired, but queue-level product presets and more production validation are still thin | Add stronger queue presets, broader real-world verification, and better queue-oriented result shaping |
| Query “我发起的审批” / “抄送给我” in a natural user-centric way | instance/task/cc query surfaces | Current implementation exposes low-level query tools, but not yet a polished first-class personal queue abstraction | Add user-centric query presets plus higher-level skill routing |
| Perform approval actions explicitly as the acting user | task action APIs | Now default to user-mode with auto-auth, but app-fallback policy for exceptional cases remains intentionally conservative | Verify more write-path semantics against real approvals and decide whether any controlled fallback path is needed |

## 3. High-Risk But In Scope

These belong to the approval skill's long-term coverage, but should not be exposed casually.

| Capability | APIs | Why high-risk | Required controls |
|---|---|---|---|
| Create approval definitions | `POST:/open-apis/approval/v4/approvals` | Changes platform-level approval structure | Admin-only policy, explicit confirmation, strict payload validation |
| Create approval instances | `POST:/open-apis/approval/v4/instances` | Can trigger real business workflows | Rich schema support, preview path, file upload support, confirmation before submit |
| Cancel approval instances | `POST:/open-apis/approval/v4/instances/cancel` | Ends real approval processes | Strong status checks and explicit confirmation |
| Subscribe / unsubscribe approval events | subscription APIs | Changes tenant integration behavior | Admin-only policy and auditable operational workflow |
| Approval bot message send/update | bot message APIs | User-facing notifications with operational impact | Separate tool family and explicit targeting / template control |

## 4. Specialized Integration Scope

These should still live under the umbrella of `feishu-approval`, but may need separate tool families and may not be part of the default end-user interaction path.

| Capability | APIs | Target tool family | Required work |
|---|---|---|---|
| Third-party approval definition / sync / validation / status | external approval APIs | `feishu_approval_external` | Add external-system credential/config model, callback handling, and sync semantics |
| Approval file upload | `POST:/approval/openapi/v2/file/upload` | `feishu_approval_file` | Integrate with instance creation path for attachment/image controls |
| Approval geography lookup | district APIs | `feishu_approval_dictionary` | Add helper actions for location field construction |
| Approval ID special lookup | `POST:/approval/openapi/v1/id/get` | `feishu_approval_admin` or helper tool | Clarify actual production use before exposing |

## User-Auth Work Required

To support user-scoped approval capabilities properly, the plugin needs an explicit user-auth path for approval APIs.

At minimum:

1. identify which approval endpoints must be called with user access token rather than tenant/app token
2. extend the approval tool client path to select auth mode per endpoint
3. reuse or extend the existing Feishu OAuth flow to guarantee a valid user access token in the current conversation context
4. store token metadata in a way that can be tied back to the acting user and account
5. surface a precise error when a user-token-required action is attempted without valid user auth
6. let the skill prefer user-mode for personal queue actions and app-mode where app identity is sufficient

Status update:

- `feishu_approval_task_search.query` already runs in user mode with auto-auth for personal task queues
- `feishu_approval_task_search.search` already runs in tenant mode for complex filtered retrieval
- `feishu_approval_cc.search` already runs in user mode with auto-auth
- `feishu_approval_task.*` already defaults to user mode with auto-auth
- `feishu_approval_instance.list/get` now prefer user mode and fall back to tenant mode for bounded scoped queries when user auth is unavailable
- `skills/feishu-approval/SKILL.md` now includes high-frequency intent presets and safety rules for common conversational approval flows

This is not optional if the product goal includes “待我审批” or any true personal approval queue support.

## Recommended Tool Families

To maximize coverage without turning a single tool into an unmaintainable surface, the approval skill should likely expand into these families:

- `feishu_approval_instance`
- `feishu_approval_task`
- `feishu_approval_task_search`
- `feishu_approval_comment`
- `feishu_approval_cc`
- `feishu_approval_definition`
- `feishu_approval_instance_write`
- `feishu_approval_file`
- `feishu_approval_external`
- `feishu_approval_subscription`
- `feishu_approval_bot_message`

The skill remains singular. The tools behind it become modular.

## Recommended Delivery Order

### Phase 1

- instance list/get
- task approve/reject/transfer/rollback
- approval skill definition
- tests and basic docs

### Phase 2

- task search and user task query
- CC search
- comments
- add sign / resubmit
- user-auth expansion for personal approval queues
- skill-level intent presets and safety rules

### Phase 3

- instance create / preview / cc / cancel
- approval definition read and create
- file upload support

### Phase 4

- event subscription
- approval bot messaging
- third-party approval integration

## Immediate Next Steps

1. keep `feishu-approval` positioned as the approval-domain umbrella skill
2. preserve the new skill-level preset and safety-rule layer as endpoint coverage expands
3. expand instance-write coverage: `create / preview / cc / cancel`
4. add approval definition read support
5. continue validating real-world approval payload and auth behaviors
