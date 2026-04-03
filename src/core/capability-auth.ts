/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Capability-level auth policy.
 *
 * This module centralizes token-mode decisions so tools do not need to keep
 * re-encoding endpoint auth assumptions locally.
 */

import type { ToolActionKey } from './scope-manager';
import { GENERATED_TOOL_AUTH_MODES } from './generated/feishu-tool-auth.js';

export type CanonicalAuthMode = 'user-only' | 'tenant-only' | 'dual-mode' | 'unknown';
export type ExecutionAuthMode = 'user' | 'tenant';

export interface CapabilityAuthPolicy {
  toolAction: ToolActionKey;
  canonicalAuthModes: CanonicalAuthMode[];
  preferredMode: ExecutionAuthMode;
  fallbackMode?: ExecutionAuthMode;
  source: 'generated' | 'manual-default';
  rationale: string;
}

const MANUAL_AUTH_MODE_OVERRIDES: Partial<Record<ToolActionKey, CanonicalAuthMode[]>> = {
  'feishu_approval_instance.list': ['tenant-only'],
  'feishu_approval_instance.get': ['tenant-only'],
  'feishu_approval_task.approve': ['tenant-only'],
  'feishu_approval_task.reject': ['tenant-only'],
  'feishu_approval_task.transfer': ['tenant-only'],
  'feishu_approval_task.rollback': ['tenant-only'],
  'feishu_approval_task.add_sign': ['tenant-only'],
  'feishu_approval_task.resubmit': ['tenant-only'],
  'feishu_approval_task_search.search': ['tenant-only'],
  'feishu_approval_task_search.query': ['dual-mode'],
  'feishu_approval_cc.search': ['tenant-only'],
  'feishu_approval_comment.create': ['tenant-only'],
  'feishu_approval_comment.list': ['tenant-only'],
  'feishu_approval_comment.delete': ['tenant-only'],
  'feishu_approval_comment.remove': ['tenant-only'],
  'feishu_attendance_group.get': ['tenant-only'],
  'feishu_attendance_group.list_users': ['dual-mode'],
  'feishu_attendance_shift.query': ['tenant-only'],
};

const GENERATED_AUTH_MODE_MAP = GENERATED_TOOL_AUTH_MODES as Partial<Record<ToolActionKey, readonly string[]>>;

function normalizeAuthModes(modes: readonly string[] | undefined): CanonicalAuthMode[] {
  const normalized = Array.from(new Set((modes ?? []).filter(Boolean))) as CanonicalAuthMode[];
  if (normalized.length === 0) return ['unknown'];
  return normalized;
}

export function getCanonicalAuthModes(toolAction: ToolActionKey): CanonicalAuthMode[] {
  const generated = GENERATED_AUTH_MODE_MAP[toolAction];
  if (generated?.length) {
    return normalizeAuthModes(generated);
  }
  return normalizeAuthModes(MANUAL_AUTH_MODE_OVERRIDES[toolAction]);
}

export function getCapabilityAuthPolicy(toolAction: ToolActionKey): CapabilityAuthPolicy {
  const canonicalAuthModes = getCanonicalAuthModes(toolAction);
  const source = GENERATED_AUTH_MODE_MAP[toolAction] ? 'generated' : 'manual-default';

  if (canonicalAuthModes.includes('tenant-only')) {
    return {
      toolAction,
      canonicalAuthModes,
      preferredMode: 'tenant',
      source,
      rationale: 'canonical contract is tenant-only',
    };
  }

  if (canonicalAuthModes.includes('user-only')) {
    return {
      toolAction,
      canonicalAuthModes,
      preferredMode: 'user',
      source,
      rationale: 'canonical contract is user-only',
    };
  }

  if (canonicalAuthModes.includes('dual-mode')) {
    return {
      toolAction,
      canonicalAuthModes,
      preferredMode: 'user',
      fallbackMode: 'tenant',
      source,
      rationale:
        'canonical contract is dual-mode; prefer user context and fall back to tenant when user auth is unavailable',
    };
  }

  return {
    toolAction,
    canonicalAuthModes,
    preferredMode: 'user',
    source,
    rationale: 'canonical contract unresolved; keep existing user-first compatibility default',
  };
}

export function isAuthModeAllowed(toolAction: ToolActionKey, executionMode: ExecutionAuthMode): boolean {
  const modes = getCanonicalAuthModes(toolAction);
  if (modes.includes('unknown')) return true;
  if (executionMode === 'user') {
    return modes.includes('user-only') || modes.includes('dual-mode');
  }
  return modes.includes('tenant-only') || modes.includes('dual-mode');
}
