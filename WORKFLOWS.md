# Deployment and Usage Workflows

This document describes the workflows that matter for this fork's actual purpose: running the plugin on our company-managed OpenClaw instance and using it safely in daily Feishu/Lark work.

## 1. Fork Maintenance Workflow

This fork exists to support our deployment without drifting away from the official project.

The maintenance path is:

1. sync `main` with `upstream/main`
2. implement changes in an upstreamable form by default
3. isolate fork-only behavior behind config or narrow code paths
4. keep upstreamable and fork-only changes in separate commits
5. push to `origin`
6. upstream broadly useful fixes and features as PRs

See [MAINTAINING.md](/data/Workspace/openclaw-lark/MAINTAINING.md).

## 2. Company Deployment Workflow

The deployment target is a company-managed OpenClaw instance, not a developer laptop-only setup.

The operational path is:

1. build and publish the forked plugin version
2. deploy it to the target OpenClaw instance
3. configure the Feishu app account and callback/event settings
4. verify required Feishu scopes and OpenClaw plugin entry configuration
5. disable conflicting legacy or duplicate Feishu plugins if present
6. run `/feishu start` or `/feishu doctor` to confirm health

The key outcome is that our OpenClaw instance runs our forked plugin version, while still staying close enough to upstream to rebase regularly.

The concrete install, update, rollback, and official-version switch procedures are documented in [DEPLOYMENT.md](/data/Workspace/openclaw-lark/DEPLOYMENT.md).

## 3. Tenant Onboarding Workflow

Once the plugin is deployed on the company instance, a tenant or account must be made usable.

The onboarding path is:

1. configure app credentials in OpenClaw
2. ensure the app is enabled
3. confirm callback and card interaction settings in Feishu Open Platform
4. verify required application scopes are approved
5. trigger `/feishu auth` when user-level authorization is needed
6. let the owner finish OAuth device flow
7. rerun the original request after authorization succeeds

This repository supports both:

- application-level permission checks
- user OAuth authorization and batch authorization flows

## 4. End-User Conversation Workflow

For employees using the deployed bot in Feishu, the normal path is:

1. send a message to the bot in a DM or allowed group
2. plugin parses message context and chat type
3. message gate and policy rules decide whether the request is allowed
4. OpenClaw selects tools and skills
5. plugin calls Feishu OAPI, MCP, or plugin-managed flows
6. bot returns text, interactive cards, streaming output, or follow-up questions

Two approval paths may appear:

- Feishu OAuth authorization: needed for user-identity operations
- OpenClaw command approval: needed for sensitive command execution

These are separate flows.

## 5. Private Assistant Workflow

This is the safest and recommended default use case.

Typical path:

1. user talks to the bot in a private chat
2. bot reads authorized IM, docs, tasks, calendars, sheets, or bases
3. bot writes back messages, creates docs, updates tasks, or schedules meetings
4. user authorizes additional scopes only when required

This mode minimizes prompt-injection and cross-user data leakage risk.

## 6. Group Assistant Workflow

This fork can also be used in company group chats, but only under explicit policy control.

Typical path:

1. add bot to a group
2. configure allowlist, group policy, and optional skill bindings
3. restrict who can trigger the bot and what capabilities are enabled
4. user sends a request in the group
5. plugin evaluates group policy before any tool call
6. bot replies to the group with bounded scope

This flow should be treated as higher risk than DM use.

## 7. Business Operation Workflows

These are the day-to-day usage scenarios already supported by the deployed plugin.

### Docs and Knowledge

- create a Feishu doc from generated content
- fetch a doc or wiki-backed doc for reading
- update a doc incrementally
- list comments or download doc media
- resolve wiki nodes before choosing the right downstream tool

### Messaging and Communication

- read group or DM history
- expand thread replies
- search messages across chats
- send or reply to messages
- download image or file resources from messages

### Tasks and Coordination

- create tasks
- list visible tasks
- update due dates and completion state
- manage task lists, subtasks, and comments

### Approval and Review

- list approval instances in a bounded time window
- inspect approval instance details and current approvers
- approve or reject pending approval tasks
- transfer approval tasks to another approver
- roll back approval tasks to previously approved nodes when the scenario supports it

### Calendar and Meetings

- list calendars
- create, search, update, and delete events
- manage attendees
- query free/busy

### Data Workflows

- create and manage bitable apps, tables, fields, views, and records
- read and write sheets
- export spreadsheets
- list, upload, download, move, and copy drive files

## 8. Command and Admin Workflow

The deployed bot also supports explicit operational commands:

- `/feishu start`: validate plugin startup and configuration
- `/feishu auth`: trigger authorization guidance
- `/feishu doctor` or `/feishu_doctor`: run diagnostics
- `/feishu help`: show supported operational commands

These commands are part of production operations, not just development.

## 9. Troubleshooting Workflow

When behavior on the company OpenClaw instance is wrong, the recommended order is:

1. verify the deployed plugin version
2. verify OpenClaw plugin config and enabled account state
3. verify Feishu app scopes and callback settings
4. verify user OAuth state
5. distinguish OAuth problems from command-approval problems
6. run `/feishu doctor`
7. inspect logs and compare behavior with official API or MCP references

Useful references:

- [README.md](/data/Workspace/openclaw-lark/README.md)
- [AGENTS.md](/data/Workspace/openclaw-lark/AGENTS.md)
- [MAINTAINING.md](/data/Workspace/openclaw-lark/MAINTAINING.md)
- [feishu-supported-operations.md](/data/Workspace/openclaw-lark/docs/references/feishu-supported-operations.md)
- [feishu-skill-gap-analysis.md](/data/Workspace/openclaw-lark/docs/references/feishu-skill-gap-analysis.md)
