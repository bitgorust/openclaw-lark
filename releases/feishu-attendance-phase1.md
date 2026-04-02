# Release Note Draft: Feishu Attendance Phase 1

Version: unreleased
Upstream base: pending release cut
Commit: pending release cut

Included:
- feat: add `feishu_attendance_shift` with `query`
- feat: add `feishu_attendance_group` with `get` and `list_users`
- test: cover attendance request shaping, normalization, and execute-path behavior
- docs: add attendance skill guidance and capability notes

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
- Phase 1 intentionally focuses on attendance-adjacent lookup flows: daily shifts, attendance group detail, and attendance group membership.
- These APIs are invoked with application identity (`tenant_access_token`) rather than user OAuth.
- Querying daily shifts is constrained to a maximum 30-day window per request.
