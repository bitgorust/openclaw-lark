/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Approval auth policy.
 *
 * This file now mirrors the canonical token contract calibrated from
 * `node-sdk` approval coverage. It remains as a narrow compatibility shim for
 * approval tools that still ask for family/action level policy objects.
 */

export type ApprovalToolFamily = 'instance' | 'task' | 'task-search' | 'cc' | 'comment';

export type ApprovalInstanceAction = 'list' | 'get';

export type ApprovalTaskAction = 'approve' | 'reject' | 'transfer' | 'rollback' | 'add_sign' | 'resubmit';

export type ApprovalTaskSearchAction = 'search' | 'query';

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
  rationale: string;
}

export function getApprovalAuthPolicy(
  family: ApprovalToolFamily,
  action: ApprovalAction,
): ApprovalAuthPolicy {
  if (family === 'instance') {
    return {
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      rationale: 'approval instance list/get endpoints are tenant-only in the canonical contract',
    };
  }

  if (family === 'task-search') {
    if (action === 'query') {
      return {
        targetAuthMode: 'dual-mode',
        currentExecutionMode: 'user',
        rationale: 'approval task query is dual-mode canonically, so user remains the preferred execution mode',
      };
    }

    return {
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      rationale: 'approval task search is tenant-only in the canonical contract',
    };
  }

  if (family === 'cc') {
    return {
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      rationale: 'approval CC search is tenant-only in the canonical contract',
    };
  }

  if (family === 'comment') {
    return {
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      rationale: 'approval comment endpoints are tenant-only in the canonical contract',
    };
  }

  switch (action) {
    case 'approve':
    case 'reject':
    case 'transfer':
    case 'rollback':
    case 'add_sign':
    case 'resubmit':
      return {
        targetAuthMode: 'app-only',
        currentExecutionMode: 'tenant',
        rationale: 'approval task action endpoints are tenant-only in the canonical contract',
      };
  }

  throw new Error(`Unsupported approval auth policy lookup: family=${family}, action=${action}`);
}
