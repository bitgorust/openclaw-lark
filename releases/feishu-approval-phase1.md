# Release Note Draft: Feishu Approval Phase 1

Version: unreleased
Upstream base: pending release cut
Commit: pending release cut

Included:
- feat: add `feishu_approval_instance` with `list` and `get`
- feat: add `feishu_approval_task` with `approve`, `reject`, `transfer`, and `rollback`
- test: cover approval request shaping, normalization, and execute-path behavior
- docs: add approval skill guidance and README capability notes

Fork-only:
- none intended

Upstream status:
- not yet proposed upstream

Verification:
- lint: pass
- typecheck: pass
- test: pass
- build: pass

Notes:
- Phase 1 intentionally excludes approval definition creation, instance creation, comments, CC flows, and "my pending approvals" query expansion.
- Approval task operations depend on valid `approval_code`, `instance_id`, and `task_id`; rollback additionally depends on explicit `task_def_key_list`.
