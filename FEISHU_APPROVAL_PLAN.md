# Feishu Approval Feature Plan

This document defines the first implementation scope for the `feishu-approval` feature.

## Goal

Support the most common approval workflows on the deployed OpenClaw instance without overbuilding the first release.

The initial goal is not full approval platform coverage. It is to make the bot useful for pending approvals such as overtime, leave, and reimbursement review.

## Phase 1 Scope

### Tool Family

Add a new OAPI tool family under `src/tools/oapi/approval/`.

Recommended first tool split:

- `feishu_approval_instance`
- `feishu_approval_task`

### Phase 1 Actions

#### `feishu_approval_instance`

- `list`
  - list approval instance IDs or instances in a filterable window
- `get`
  - get instance detail by `instance_id`

#### `feishu_approval_task`

- `approve`
  - approve a pending task
- `reject`
  - reject a pending task
- `transfer`
  - transfer a pending task to another approver
- `rollback`
  - roll back an approval instance when supported by the scenario

## Target APIs

- `GET:/open-apis/approval/v4/instances`
- `GET:/open-apis/approval/v4/instances/:instance_id`
- `POST:/open-apis/approval/v4/tasks/approve`
- `POST:/open-apis/approval/v4/tasks/reject`
- `POST:/open-apis/approval/v4/tasks/transfer`
- `POST:/open-apis/approval/v4/instances/specified_rollback`

## Out of Scope for Phase 1

- approval definition management
- creating approval definitions
- creating approval instances from scratch
- approval preview and CC flows
- exhaustive support for every approval form field structure

## Output Shape Expectations

The tool results should be optimized for agent consumption:

- include normalized high-signal fields first
- preserve the raw payload for debugging
- convert timestamps to readable ISO strings where appropriate
- make pending status and approver-related fields easy to find

Recommended normalized fields for list/get:

- `instance_id`
- `approval_code` or template identity if present
- `title`
- `status`
- `applicant`
- `approvers`
- `create_time`
- `finish_time`
- `raw`

## Error-Handling Expectations

- use the existing tool client and auto-auth error path
- surface user authorization errors cleanly
- preserve approval API error context
- treat "not found", "already processed", and "permission denied" as distinguishable outcomes

## Test Plan

Phase 1 should add focused tests for:

1. request parameter shaping
2. timestamp normalization
3. list/get result normalization
4. approve/reject/transfer/rollback request bodies
5. error result shaping

## Follow-up Work

After Phase 1 lands:

1. add `skills/feishu-approval/SKILL.md`
2. extend list filtering for "my pending approvals"
3. evaluate whether attendance-linked scenarios need companion tooling
4. decide whether approval comments need explicit support
