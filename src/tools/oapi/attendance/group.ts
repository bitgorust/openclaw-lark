/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_attendance_group tool -- get attendance groups and list users.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import {
  StringEnum,
  createToolContext,
  handleInvokeErrorWithAutoAuth,
  isInvokeError,
  json,
  normalizeRawInvokeError,
  registerTool,
} from '../helpers';
import { shapeAttendanceError } from './shift';

const EMPLOYEE_ID_TYPES = ['employee_id', 'employee_no'] as const;
const DEPARTMENT_ID_TYPES = ['open_department_id'] as const;

const FeishuAttendanceGroupSchema = Type.Union([
  Type.Object({
    action: Type.Literal('get'),
    group_id: Type.String({
      description: '考勤组 ID。',
    }),
    employee_type: Type.Optional(
      StringEnum([...EMPLOYEE_ID_TYPES], {
        description: '返回人员 ID 的类型。默认 employee_id。',
      }),
    ),
    dept_type: Type.Optional(
      StringEnum([...DEPARTMENT_ID_TYPES], {
        description: '返回部门 ID 的类型。当前仅支持 open_department_id。',
      }),
    ),
  }),
  Type.Object({
    action: Type.Literal('list_users'),
    group_id: Type.String({
      description: '考勤组 ID。',
    }),
    employee_type: Type.Optional(
      StringEnum([...EMPLOYEE_ID_TYPES], {
        description: '返回人员 ID 的类型。默认 employee_id。',
      }),
    ),
    dept_type: Type.Optional(
      StringEnum([...DEPARTMENT_ID_TYPES], {
        description: '返回部门 ID 的类型。当前仅支持 open_department_id。',
      }),
    ),
    member_clock_type: Type.Optional(
      Type.Integer({
        description: '成员打卡类型过滤。0=全部，1=必须打卡，2=无需打卡。默认 0。',
        minimum: 0,
        maximum: 2,
      }),
    ),
    page_size: Type.Optional(
      Type.Integer({
        description: '分页大小。默认 50。',
        minimum: 1,
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
  }),
]);

type EmployeeIdType = (typeof EMPLOYEE_ID_TYPES)[number];
type DepartmentIdType = (typeof DEPARTMENT_ID_TYPES)[number];
type MemberClockType = 0 | 1 | 2;

type FeishuAttendanceGroupParams =
  | {
      action: 'get';
      group_id: string;
      employee_type?: EmployeeIdType;
      dept_type?: DepartmentIdType;
    }
  | {
      action: 'list_users';
      group_id: string;
      employee_type?: EmployeeIdType;
      dept_type?: DepartmentIdType;
      member_clock_type?: MemberClockType;
      page_size?: number;
      page_token?: string;
    };

export interface AttendanceGroupSummary {
  group_id: string | null;
  group_name: string | null;
  owner_id: string | null;
  timezone: string | null;
  bind_user_count: number | null;
  raw: Record<string, any>;
}

export interface AttendanceGroupUserSummary {
  user_id: string | null;
  name: string | null;
  department_ids: string[];
  member_clock_type: string | null;
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeString(item))
    .filter((item): item is string => Boolean(item));
}

export function buildAttendanceGroupGetQuery(params: {
  employee_type?: EmployeeIdType;
  dept_type?: DepartmentIdType;
}): Record<string, string> {
  return {
    employee_type: params.employee_type ?? 'employee_id',
    dept_type: params.dept_type ?? 'open_department_id',
  };
}

export function buildAttendanceGroupListUsersQuery(params: {
  employee_type?: EmployeeIdType;
  dept_type?: DepartmentIdType;
  member_clock_type?: MemberClockType;
  page_size?: number;
  page_token?: string;
}): Record<string, string> {
  const query: Record<string, string> = {
    employee_type: params.employee_type ?? 'employee_id',
    dept_type: params.dept_type ?? 'open_department_id',
    member_clock_type: String(params.member_clock_type ?? 0),
    page_size: String(params.page_size ?? 50),
  };

  if (params.page_token) query.page_token = params.page_token;
  return query;
}

export function normalizeAttendanceGroup(data: Record<string, any> | undefined): AttendanceGroupSummary | null {
  if (!data || typeof data !== 'object') return null;

  return {
    group_id: normalizeString(data.group_id ?? data.id),
    group_name: normalizeString(data.group_name ?? data.name),
    owner_id: normalizeString(data.owner_id),
    timezone: normalizeString(data.timezone),
    bind_user_count: typeof data.bind_user_count === 'number' ? data.bind_user_count : null,
    raw: data,
  };
}

function normalizeAttendanceGroupUser(raw: Record<string, any>): AttendanceGroupUserSummary {
  return {
    user_id: normalizeString(raw.user_id ?? raw.employee_id ?? raw.open_id),
    name: normalizeString(raw.name),
    department_ids: normalizeStringArray(raw.department_ids),
    member_clock_type: normalizeString(raw.member_clock_type),
    raw,
  };
}

export function normalizeAttendanceGroupUsersResponse(data: Record<string, any> | undefined): {
  users: AttendanceGroupUserSummary[];
  has_more: boolean;
  page_token: string | undefined;
  raw: Record<string, any> | null;
} {
  const list = Array.isArray(data?.user_list)
    ? data.user_list
    : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return {
    users: list
      .filter((item): item is Record<string, any> => Boolean(item) && typeof item === 'object')
      .map(normalizeAttendanceGroupUser),
    has_more: Boolean(data?.has_more),
    page_token: typeof data?.page_token === 'string' ? data.page_token : undefined,
    raw: data ?? null,
  };
}

export function registerFeishuAttendanceGroupTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_attendance_group');

  registerTool(
    api,
    {
      name: 'feishu_attendance_group',
      label: 'Feishu Attendance Group',
      description:
        '飞书考勤组工具。用于获取单个考勤组详情，或分页列出考勤组成员。' +
        '其中 get 按 canonical contract 为应用身份，list_users 按 canonical contract 为用户身份。' +
        ' Actions: get, list_users。',
      parameters: FeishuAttendanceGroupSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuAttendanceGroupParams;
        let lastClient: ReturnType<typeof toolClient> | undefined;

        try {
          const client = (lastClient = toolClient());

          switch (p.action) {
            case 'get': {
              const query = buildAttendanceGroupGetQuery(p);
              log.info(`get: group_id=${p.group_id}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: Record<string, any>;
              }>('feishu_attendance_group.get', `/open-apis/attendance/v1/groups/${p.group_id}`, {
                method: 'GET',
                query,
              });

              if (res.code && res.code !== 0) throw res;

              return json({
                group: normalizeAttendanceGroup(res.data),
                raw: res.data ?? null,
              });
            }

            case 'list_users': {
              const query = buildAttendanceGroupListUsersQuery(p);
              log.info(`list_users: group_id=${p.group_id}, page_size=${query.page_size}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: Record<string, any>;
              }>('feishu_attendance_group.list_users', `/open-apis/attendance/v1/groups/${p.group_id}/list_user`, {
                method: 'GET',
                query,
              });

              if (res.code && res.code !== 0) throw res;

              const normalized = normalizeAttendanceGroupUsersResponse(res.data);

              return json({
                group_id: p.group_id,
                has_more: normalized.has_more,
                page_token: normalized.page_token,
                users: normalized.users,
                raw: normalized.raw,
              });
            }
          }
        } catch (err) {
          const invokeErr = normalizeRawInvokeError({
            toolAction: `feishu_attendance_group.${p.action}`,
            err,
            userOpenId: lastClient?.senderOpenId,
            appId: lastClient?.account.appId,
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
    { name: 'feishu_attendance_group' },
  );
}
