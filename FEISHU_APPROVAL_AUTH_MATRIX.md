# Feishu Approval Auth-Mode Matrix

This document defines how approval-domain APIs should choose identity mode.

It exists because "approval support" and "current app-token support" are not the same thing. If the product goal includes personal approval capabilities such as "待我审批", then the implementation must add the missing user-auth path instead of treating those capabilities as permanently unsupported.

This document should be read together with:

- [FEISHU_APPROVAL_API_COVERAGE.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_API_COVERAGE.md)
- [FEISHU_APPROVAL_PLAN.md](/data/Workspace/openclaw-lark/FEISHU_APPROVAL_PLAN.md)

## Auth Modes

Use these terms consistently:

- `app-only`
  - use tenant/app identity
  - no user access token required
- `user-required`
  - the action should run with a user access token
  - lack of user token is an implementation gap to close, not a reason to drop the capability
- `dual-mode`
  - app identity may be sufficient for some query patterns
  - user identity is still required for user-centric personal queues or acting-user semantics

## Principles

1. personal queues should prefer user mode
2. high-risk write actions should not silently fall back to app mode if the acting-user semantics matter
3. if an API is part of the target skill scope and needs user auth, the product answer is to add user auth support
4. app-only support may remain useful as a fallback for tenant-scoped admin or explicitly filtered queries

## Endpoint Matrix

This is the current recommended auth classification for approval APIs in the local server API inventory.

| API | Capability | Recommended auth mode | Reason |
|---|---|---|---|
| `GET:/open-apis/approval/v4/instances` | list approval instance IDs by definition and window | `dual-mode` | current implementation prefers user mode and falls back to tenant mode for bounded explicit queries; personal queue experiences should still stay user-first |
| `POST:/open-apis/approval/v4/instances/query` | search instance list by richer conditions | `dual-mode` | query surface is broader and likely used for both tenant-scoped and personal views |
| `GET:/open-apis/approval/v4/instances/:instance_id` | get instance detail | `dual-mode` | current implementation prefers user mode and falls back to tenant mode for compatibility; user mode should remain first when the request originates from a personal workflow |
| `POST:/open-apis/approval/v4/tasks/search` | search approval tasks | `app-only` | complex filtered task retrieval should currently run with tenant/app identity; it is not the default personal queue entrypoint |
| `GET:/open-apis/approval/v4/tasks/query` | query user task list | `user-required` | this is explicitly user-oriented |
| `POST:/open-apis/approval/v4/instances/search_cc` | search CC list | `user-required` | CC views are usually personal inbox-style data |
| `POST:/open-apis/approval/v4/tasks/approve` | approve task | `dual-mode`, current implementation defaults to `user` | product semantics are "the user approves"; current code already defaults to user mode and auto-auth, while app fallback remains intentionally constrained |
| `POST:/open-apis/approval/v4/tasks/reject` | reject task | `dual-mode`, current implementation defaults to `user` | same as approve |
| `POST:/open-apis/approval/v4/tasks/transfer` | transfer task | `dual-mode`, current implementation defaults to `user` | same as approve |
| `POST:/open-apis/approval/v4/instances/specified_rollback` | rollback task | `dual-mode`, current implementation defaults to `user` | same as approve |
| `POST:/open-apis/approval/v4/instances/add_sign` | add sign | `user-required` | strongly acting-user semantics |
| `POST:/open-apis/approval/v4/tasks/resubmit` | resubmit task | `user-required` | user-originated task continuation |
| `POST:/open-apis/approval/v4/instances/:instance_id/comments` | create comment | `user-required` | comments are user-authored |
| `GET:/open-apis/approval/v4/instances/:instance_id/comments` | get comments | `dual-mode` | explicit instance comment retrieval may be allowed app-side, but user mode is still needed for natural personal flows |
| `DELETE:/open-apis/approval/v4/instances/:instance_id/comments/:comment_id` | delete comment | `user-required` | acting-user semantics |
| `POST:/open-apis/approval/v4/instances/:instance_id/comments/remove` | clear comments | `user-required` or admin-gated | destructive, should not default to app mode |
| `POST:/open-apis/approval/v4/instances` | create instance | `user-required` for end-user submit flows | the submitter matters; app-only should not be the default end-user mode |
| `POST:/open-apis/approval/v4/instances/preview` | preview process | `user-required` for realistic submit flows | preview should align with the actual applicant identity |
| `POST:/open-apis/approval/v4/instances/cc` | CC an instance | `user-required` | user-facing write action |
| `POST:/open-apis/approval/v4/instances/cancel` | cancel instance | `user-required` or high-risk controlled mode | applicant/actor semantics matter |
| `GET:/open-apis/approval/v4/approvals/:approval_id` | get approval definition | `app-only` | definition lookup is configuration-oriented |
| `POST:/open-apis/approval/v4/approvals` | create approval definition | `app-only` plus admin controls | tenant/platform configuration action |
| `POST:/approval/openapi/v2/file/upload` | upload approval file | `dual-mode`, prefer `user-required` in submit flows | tied to instance creation by a user in most business flows |
| subscription APIs | subscribe/unsubscribe events | `app-only` plus admin controls | integration-level action |
| external approval APIs | third-party sync/integration | `app-only` or integration credential mode | not a normal end-user skill path |
| bot message APIs | send/update approval bot message | `app-only` plus operational controls | integration/notification capability |

## Immediate Product Consequences

This matrix implies the following:

1. the current approval implementation is only the start, not the end state
2. supporting "待我审批" requires real user-mode task-query support
3. write actions should use user-mode semantics by default, and the current implementation has already moved to that default for task actions
4. approval skill copy should describe current limits honestly, but roadmap and implementation should move toward closing those limits

## Required Code Changes

To implement this matrix, the codebase needs changes in four layers.

### 1. Endpoint-level auth selection

The approval layer no longer needs to hard-code tenant mode. Current code already mixes:

- user-required flows for task-query, CC-search, and task actions
- app-only tenant execution for complex task-search
- dual-mode user-first flows with tenant fallback for bounded instance list/get

What remains is to extend the same policy discipline to the remaining approval endpoint families.

Required change:

1. let each approval action declare its auth mode
2. route calls through:
   - `as: 'tenant'` for app-only
   - `as: 'user'` for user-required
   - a policy decision for dual-mode actions
3. for dual-mode actions, make fallback explicit rather than accidental

Likely touch points:

- [src/tools/oapi/approval/instance.ts](/data/Workspace/openclaw-lark/src/tools/oapi/approval/instance.ts)
- [src/tools/oapi/approval/task.ts](/data/Workspace/openclaw-lark/src/tools/oapi/approval/task.ts)
- [src/core/tool-client.ts](/data/Workspace/openclaw-lark/src/core/tool-client.ts)

### 2. Approval-specific auth policy layer

Approval tools need a small policy helper rather than scattering auth decisions inline.

Recommended addition:

- `src/tools/oapi/approval/auth-policy.ts`

This helper should answer:

1. which auth mode an action prefers
2. whether fallback from user mode to app mode is allowed
3. what error to surface when user auth is required but missing

### 3. User-token acquisition and refresh path

The plugin already has OAuth and stored UAT infrastructure. Approval support should build on that instead of inventing a parallel path.

Relevant existing pieces:

- [src/tools/oauth.ts](/data/Workspace/openclaw-lark/src/tools/oauth.ts)
- [src/core/tool-client.ts](/data/Workspace/openclaw-lark/src/core/tool-client.ts)
- [src/core/token-store.ts](/data/Workspace/openclaw-lark/src/core/token-store.ts)
- [src/core/uat-client.ts](/data/Workspace/openclaw-lark/src/core/uat-client.ts)

Required work:

1. ensure approval actions can request `as: 'user'`
2. ensure missing UAT for approval triggers the normal auth acquisition path
3. ensure approval-specific scope failures are surfaced clearly
4. ensure the acting user is the current sender, not an inferred surrogate

### 4. Skill behavior update

The skill should evolve in two steps:

1. honestly state current runtime limits
2. once user-mode support lands, change the skill to actively support personal queues instead of only explicit instance lookups

Current status:

- the skill already includes preset routing for common intents such as “待我审批”, “抄送我的审批”, and “重提被退回审批”
- the next step is to keep those presets aligned with endpoint coverage and safety requirements as new write actions land

## Recommended Implementation Sequence

1. add this auth-mode matrix
2. introduce an approval auth-policy helper
3. complete user-first / fallback-explicit policies across the remaining approval families
4. keep strengthening queue presets and write-action safety rules as production feedback accumulates
5. then expand create-instance, preview, cancel, definition-read, and other remaining approval families

## Decision Rule

When a future approval capability is requested, ask:

1. is it in the approval-domain target?
2. which endpoint implements it?
3. what auth mode should it use?
4. what code or auth work is missing?

Do not stop at "current implementation cannot do it". The correct follow-up is to identify the missing auth and execution work needed to make it supported.
