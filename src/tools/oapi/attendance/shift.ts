/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_attendance_shift tool -- query Feishu attendance daily shifts.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import {
  StringEnum,
  createToolContext,
  formatLarkError,
  handleInvokeErrorWithAutoAuth,
  isInvokeError,
  json,
  normalizeRawInvokeError,
  registerTool,
} from '../helpers';

const EMPLOYEE_ID_TYPES = ['employee_id', 'employee_no'] as const;

const FeishuAttendanceShiftSchema = Type.Object({
  action: Type.Literal('query'),
  user_ids: Type.Array(Type.String(), {
    description: '用户 ID 列表。默认按 employee_type 解释，建议一次查询同一批人员的 30 天内排班。',
    minItems: 1,
  }),
  check_date_from: Type.String({
    description: "查询开始日期。支持 'YYYY-MM-DD' 或 'YYYYMMDD'。",
  }),
  check_date_to: Type.String({
    description: "查询结束日期。支持 'YYYY-MM-DD' 或 'YYYYMMDD'，与开始日期跨度不能超过 30 天。",
  }),
  employee_type: Type.Optional(
    StringEnum([...EMPLOYEE_ID_TYPES], {
      description: 'user_ids 的类型。默认 employee_id；如租户侧已统一使用 open_id，可显式传 open_id。',
    }),
  ),
});

type EmployeeIdType = (typeof EMPLOYEE_ID_TYPES)[number];

interface FeishuAttendanceShiftParams {
  action: 'query';
  user_ids: string[];
  check_date_from: string;
  check_date_to: string;
  employee_type?: EmployeeIdType;
}

export interface AttendanceShiftSummary {
  user_id: string | null;
  check_date: string | null;
  shift_id: string | null;
  shift_name: string | null;
  group_id: string | null;
  is_rest_day: boolean | null;
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCheckDate(input: string): string {
  const trimmed = input.trim();
  if (/^\d{8}$/.test(trimmed)) return trimmed;
  const normalized = trimmed.replaceAll('-', '');
  if (/^\d{8}$/.test(normalized)) return normalized;
  throw new Error(`Invalid attendance date: ${input}`);
}

function validateAttendanceDateWindow(checkDateFrom: string, checkDateTo: string): void {
  const from = new Date(`${checkDateFrom.slice(0, 4)}-${checkDateFrom.slice(4, 6)}-${checkDateFrom.slice(6, 8)}T00:00:00Z`);
  const to = new Date(`${checkDateTo.slice(0, 4)}-${checkDateTo.slice(4, 6)}-${checkDateTo.slice(6, 8)}T00:00:00Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    throw new Error('Invalid attendance date range');
  }

  const diffDays = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays > 30) {
    throw new Error('Attendance date range cannot exceed 30 days');
  }
}

function dateFromMonthAndDay(month: unknown, day: unknown): string | null {
  const monthValue = typeof month === 'number' ? month.toString() : normalizeString(month);
  const dayValue = typeof day === 'number' ? day.toString() : normalizeString(day);
  if (!monthValue || !dayValue) return null;

  const monthDigits = monthValue.replaceAll('-', '');
  const dayDigits = dayValue.padStart(2, '0');
  if (!/^\d{6}$/.test(monthDigits) || !/^\d{2}$/.test(dayDigits)) return null;
  return `${monthDigits.slice(0, 4)}-${monthDigits.slice(4, 6)}-${dayDigits}`;
}

export function buildAttendanceShiftQueryRequest(params: FeishuAttendanceShiftParams): {
  body: {
    user_ids: string[];
    check_date_from: string;
    check_date_to: string;
  };
  query: {
    employee_type: EmployeeIdType;
  };
} {
  const checkDateFrom = normalizeCheckDate(params.check_date_from);
  const checkDateTo = normalizeCheckDate(params.check_date_to);
  validateAttendanceDateWindow(checkDateFrom, checkDateTo);

  return {
    body: {
      user_ids: params.user_ids,
      check_date_from: checkDateFrom,
      check_date_to: checkDateTo,
    },
    query: {
      employee_type: params.employee_type ?? 'employee_id',
    },
  };
}

function normalizeShiftRecord(raw: Record<string, any>): AttendanceShiftSummary {
  const shift = raw.shift ?? {};

  return {
    user_id: normalizeString(raw.user_id ?? raw.employee_id ?? raw.open_id),
    check_date:
      normalizeString(raw.check_date) ??
      dateFromMonthAndDay(raw.month ?? raw.shift_month, raw.day_no ?? raw.day) ??
      null,
    shift_id: normalizeString(shift.id ?? shift.shift_id ?? raw.shift_id),
    shift_name: normalizeString(shift.name ?? shift.shift_name ?? raw.shift_name),
    group_id: normalizeString(raw.group_id),
    is_rest_day: typeof raw.is_rest_day === 'boolean' ? raw.is_rest_day : null,
    raw,
  };
}

export function normalizeAttendanceShiftResponse(data: Record<string, any> | undefined): {
  shifts: AttendanceShiftSummary[];
  raw: Record<string, any> | null;
} {
  const list = Array.isArray(data?.user_daily_shifts)
    ? data.user_daily_shifts
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const shifts = list
    .filter((item): item is Record<string, any> => Boolean(item) && typeof item === 'object')
    .map(normalizeShiftRecord);

  return {
    shifts,
    raw: data ?? null,
  };
}

export interface AttendanceOperationError {
  type: 'not_found' | 'permission_denied' | 'invalid_request' | 'api_error';
  code?: number;
  message: string;
}

function extractAttendanceErrorCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;

  const maybeCode =
    (err as { code?: unknown }).code ??
    (err as { data?: { code?: unknown } }).data?.code ??
    (err as { response?: { data?: { code?: unknown } } }).response?.data?.code;

  if (typeof maybeCode === 'number') return maybeCode;
  if (typeof maybeCode === 'string' && /^\d+$/.test(maybeCode)) return Number(maybeCode);
  return undefined;
}

export function shapeAttendanceError(err: unknown): AttendanceOperationError {
  const code = extractAttendanceErrorCode(err);
  const message = formatLarkError(err);

  if (code === 1220004) {
    return { type: 'not_found', code, message };
  }
  if (code === 1220002 || code === 1220005 || code === 99991672 || code === 99991679) {
    return { type: 'permission_denied', code, message };
  }
  if (code === 1220001 || /invalid|illegal|param/i.test(message)) {
    return { type: 'invalid_request', code, message };
  }

  return { type: 'api_error', code, message };
}

export function registerFeishuAttendanceShiftTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_attendance_shift');

  registerTool(
    api,
    {
      name: 'feishu_attendance_shift',
      label: 'Feishu Attendance Shift',
      description:
        '【以应用身份】飞书考勤排班查询工具。用于批量查询一组用户在指定日期范围内的排班信息。Action: query。日期跨度不能超过 30 天。',
      parameters: FeishuAttendanceShiftSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuAttendanceShiftParams;
        let lastClient: ReturnType<typeof toolClient> | undefined;

        try {
          const client = (lastClient = toolClient());
          const request = buildAttendanceShiftQueryRequest(p);

          log.info(
            `query: users=${request.body.user_ids.length}, check_date_from=${request.body.check_date_from}, check_date_to=${request.body.check_date_to}, employee_type=${request.query.employee_type}`,
          );

          const res = await client.invokeByPath<{
            code?: number;
            msg?: string;
            data?: Record<string, any>;
          }>('feishu_attendance_shift.query', '/open-apis/attendance/v1/user_daily_shifts/query', {
            method: 'POST',
            body: request.body,
            query: request.query,
            as: 'tenant',
          });

          if (res.code && res.code !== 0) throw res;

          const normalized = normalizeAttendanceShiftResponse(res.data);

          return json({
            employee_type: request.query.employee_type,
            check_date_from: request.body.check_date_from,
            check_date_to: request.body.check_date_to,
            shifts: normalized.shifts,
            raw: normalized.raw,
          });
        } catch (err) {
          const invokeErr = normalizeRawInvokeError({
            toolAction: 'feishu_attendance_shift.query',
            err,
            userOpenId: lastClient?.senderOpenId,
            appId: lastClient?.account.appId,
            tokenType: 'tenant',
          });

          if (isInvokeError(invokeErr)) {
            return await handleInvokeErrorWithAutoAuth(invokeErr, cfg);
          }

          return json({
            error: shapeAttendanceError(err),
          });
        }
      },
    },
    { name: 'feishu_attendance_shift' },
  );
}
