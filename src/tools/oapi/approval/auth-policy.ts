/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Approval auth policy.
 *
 * This module separates long-term product auth intent from current execution mode.
 * Some approval actions ultimately need user-mode execution, but the current
 * implementation may still run them in tenant mode until the user-token path is
 * fully wired for that endpoint family.
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

/**
 * Return the target auth model and the current execution mode for an approval action.
 *
 * `targetAuthMode` answers the product question: what identity should this action
 * support in the end state?
 *
 * `currentExecutionMode` answers the implementation question: what identity does
 * the current codepath use right now?
 */
export function getApprovalAuthPolicy(
  family: ApprovalToolFamily,
  action: ApprovalAction,
): ApprovalAuthPolicy {
  if (family === 'instance') {
    switch (action) {
      case 'list':
        return {
          targetAuthMode: 'dual-mode',
          currentExecutionMode: 'user',
          rationale: 'Instance queries should prefer user identity for personal-context reads, while retaining tenant-mode fallback for bounded scoped lookups.',
        };
      case 'get':
        return {
          targetAuthMode: 'dual-mode',
          currentExecutionMode: 'user',
          rationale: 'Explicit instance lookups should prefer user identity when the request originates from a personal workflow, with tenant-mode fallback kept for compatibility.',
        };
    }
  }

  if (family === 'task-search') {
    switch (action) {
      case 'search':
        return {
          targetAuthMode: 'user-required',
          currentExecutionMode: 'user',
          rationale: 'Task search is part of user-centric approval queue support and should run with user identity.',
        };
      case 'query':
        return {
          targetAuthMode: 'user-required',
          currentExecutionMode: 'user',
          rationale: 'User task query is explicitly user-oriented and should run with user identity.',
        };
    }
  }

  if (family === 'cc') {
    switch (action) {
      case 'search':
        return {
          targetAuthMode: 'user-required',
          currentExecutionMode: 'user',
          rationale: 'CC search is a personal inbox-style query and should run with user identity.',
        };
    }
  }

  if (family === 'comment') {
    switch (action) {
      case 'list':
        return {
          targetAuthMode: 'dual-mode',
          currentExecutionMode: 'user',
          rationale: 'Comment list requests should prefer user identity and can fall back to tenant mode for explicit instance reads.',
        };
      case 'create':
      case 'delete':
      case 'remove':
        return {
          targetAuthMode: 'user-required',
          currentExecutionMode: 'user',
          rationale: 'Approval comment writes carry acting-user semantics and should run with user identity.',
        };
    }
  }

  switch (action) {
    case 'approve':
    case 'reject':
    case 'transfer':
    case 'rollback':
    case 'add_sign':
    case 'resubmit':
      return {
        targetAuthMode: 'user-required',
        currentExecutionMode: 'user',
        rationale: 'Task actions carry acting-user semantics in conversational approval flows and should default to user identity.',
      };
  }

  throw new Error(`Unsupported approval auth policy lookup: family=${family}, action=${action}`);
}
