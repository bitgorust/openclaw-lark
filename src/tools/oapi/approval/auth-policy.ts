/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Approval auth policy.
 *
 * Compatibility shim for approval tools that still ask for family/action level
 * policy objects. The actual auth contract comes from generated canonical
 * metadata via capability-auth.
 */

import { getCapabilityAuthPolicy } from '../../../core/capability-auth';
import type { ToolActionKey } from '../../../core/tool-scopes';

export type ApprovalToolFamily = 'instance' | 'task' | 'task-search' | 'cc' | 'comment';

export type ApprovalInstanceAction = 'list' | 'get';

export type ApprovalTaskAction = 'approve' | 'reject' | 'transfer' | 'rollback' | 'add_sign' | 'resubmit';

export type ApprovalTaskSearchAction = 'search' | 'query' | 'get_detail';

export type ApprovalCcAction = 'search';

export type ApprovalCommentAction = 'create' | 'list' | 'delete' | 'remove';

export type ApprovalAction =
  | ApprovalInstanceAction
  | ApprovalTaskAction
  | ApprovalTaskSearchAction
  | ApprovalCcAction
  | ApprovalCommentAction;

export type ApprovalAuthMode = 'app-only' | 'user-required' | 'dual-mode';

export interface ApprovalAuthPolicy {
  targetAuthMode: ApprovalAuthMode;
  currentExecutionMode: 'tenant' | 'user';
  allowTenantFallback: boolean;
  rationale: string;
}

function toToolAction(family: ApprovalToolFamily, action: ApprovalAction): ToolActionKey {
  switch (family) {
    case 'instance':
      return `feishu_approval_instance.${action}` as ToolActionKey;
    case 'task':
      return `feishu_approval_task.${action}` as ToolActionKey;
    case 'task-search':
      return `feishu_approval_task_search.${action}` as ToolActionKey;
    case 'cc':
      return 'feishu_approval_cc.search';
    case 'comment':
      return `feishu_approval_comment.${action}` as ToolActionKey;
  }
}

export function getApprovalAuthPolicy(
  family: ApprovalToolFamily,
  action: ApprovalAction,
): ApprovalAuthPolicy {
  const toolAction = toToolAction(family, action);
  const capabilityPolicy = getCapabilityAuthPolicy(toolAction);

  if (capabilityPolicy.canonicalAuthModes.includes('tenant-only')) {
    return {
      targetAuthMode: 'app-only',
      currentExecutionMode: capabilityPolicy.preferredMode,
      allowTenantFallback: false,
      rationale: capabilityPolicy.rationale,
    };
  }

  if (capabilityPolicy.canonicalAuthModes.includes('user-only')) {
    return {
      targetAuthMode: 'user-required',
      currentExecutionMode: capabilityPolicy.preferredMode,
      allowTenantFallback: false,
      rationale: capabilityPolicy.rationale,
    };
  }

  if (capabilityPolicy.canonicalAuthModes.includes('dual-mode')) {
    return {
      targetAuthMode: 'dual-mode',
      currentExecutionMode: capabilityPolicy.preferredMode,
      allowTenantFallback: capabilityPolicy.fallbackMode === 'tenant',
      rationale: capabilityPolicy.rationale,
    };
  }

  return {
    targetAuthMode: capabilityPolicy.preferredMode === 'tenant' ? 'app-only' : 'user-required',
    currentExecutionMode: capabilityPolicy.preferredMode,
    allowTenantFallback: capabilityPolicy.fallbackMode === 'tenant',
    rationale: capabilityPolicy.rationale,
  };
}
