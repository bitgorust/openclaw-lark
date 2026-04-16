/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Explicit manual-scope fallback exceptions.
 *
 * Goal: prefer checked-in generated metadata whenever available. Manual scope
 * fallback is allowed only for tool actions that are intentionally exempted
 * from the current generated scope snapshot.
 */

import type { ToolActionKey } from './tool-scopes';

export interface OfficialScopeFallbackException {
  toolAction: ToolActionKey;
  reason: string;
}

export const OFFICIAL_SCOPE_FALLBACK_EXCEPTIONS: readonly OfficialScopeFallbackException[] = [] as const;

const OFFICIAL_SCOPE_FALLBACK_EXCEPTION_MAP = new Map(
  OFFICIAL_SCOPE_FALLBACK_EXCEPTIONS.map((item) => [item.toolAction, item]),
);

export function getOfficialScopeFallbackException(toolAction: ToolActionKey): OfficialScopeFallbackException | null {
  return OFFICIAL_SCOPE_FALLBACK_EXCEPTION_MAP.get(toolAction) ?? null;
}
