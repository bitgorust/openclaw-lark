/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_instance tool -- list and inspect Feishu approval instances.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import {
  StringEnum,
  UserAuthRequiredError,
  UserScopeInsufficientError,
  createToolContext,
  formatLarkError,
  handleInvokeErrorWithAutoAuth,
  isInvokeError,
  json,
  parseTimeToTimestampMs,
  registerTool,
  unixTimestampToISO8601,
} from '../helpers';
import { getApprovalAuthPolicy } from './auth-policy';

const APPROVAL_LOCALES = [
  'zh-CN',
  'en-US',
  'ja-JP',
  'zh-HK',
  'zh-TW',
  'de-DE',
  'es-ES',
  'fr-FR',
  'id-ID',
  'it-IT',
  'ko-KR',
  'pt-BR',
  'th-TH',
  'vi-VN',
  'ms-MY',
  'ru-RU',
] as const;
const APPROVAL_USER_ID_TYPES = ['open_id', 'union_id', 'user_id'] as const;

const FeishuApprovalInstanceSchema = Type.Union([
  Type.Object({
    action: Type.Literal('list'),
    approval_code: Type.String({
      description: '审批定义 Code',
    }),
    start_time: Type.String({
      description: "查询窗口开始时间。支持 ISO 8601 / RFC 3339，或 Unix 毫秒时间戳字符串。",
    }),
    end_time: Type.String({
      description: "查询窗口结束时间。支持 ISO 8601 / RFC 3339，或 Unix 毫秒时间戳字符串。",
    }),
    page_size: Type.Optional(
      Type.Number({
        description: '分页大小。默认 50。',
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
    include_details: Type.Optional(
      Type.Boolean({
        description: '是否自动拉取每个实例的详情并返回归一化结果。默认 true。',
      }),
    ),
    locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
    user_id: Type.Optional(
      Type.String({
        description: '发起审批用户 ID。自建应用传入后可返回更多信息；未传时默认使用当前消息发送者 open_id（如果存在）。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('get'),
    instance_id: Type.String({
      description: '审批实例 Code。',
    }),
    locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
    user_id: Type.Optional(
      Type.String({
        description: '发起审批用户 ID。未传时默认使用当前消息发送者 open_id（如果存在）。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
]);

type ApprovalLocale = (typeof APPROVAL_LOCALES)[number];
type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];

type FeishuApprovalInstanceParams =
  | {
      action: 'list';
      approval_code: string;
      start_time: string;
      end_time: string;
      page_size?: number;
      page_token?: string;
      include_details?: boolean;
      locale?: ApprovalLocale;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'get';
      instance_id: string;
      locale?: ApprovalLocale;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    };

export interface ApprovalTaskSummary {
  task_id: string | null;
  node_id: string | null;
  node_name: string | null;
  status: string | null;
  user_id: string | null;
  open_id: string | null;
  user_name: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface ApprovalInstanceSummary {
  instance_id: string | null;
  approval_code: string | null;
  title: string | null;
  status: string | null;
  applicant: {
    user_id: string | null;
    open_id: string | null;
    name: string | null;
    department_name: string | null;
  };
  approvers: Array<{
    task_id: string | null;
    node_id: string | null;
    node_name: string | null;
    status: string | null;
    user_id: string | null;
    open_id: string | null;
    user_name: string | null;
  }>;
  create_time: string | null;
  finish_time: string | null;
  pending: boolean;
  tasks: ApprovalTaskSummary[];
  raw: Record<string, any>;
}

export interface ApprovalOperationError {
  type:
    | 'not_found'
    | 'already_processed'
    | 'permission_denied'
    | 'personal_access_token_required'
    | 'invalid_request'
    | 'api_error';
  code?: number;
  message: string;
  hint?: string;
}

function parseApprovalTime(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return parseTimeToTimestampMs(trimmed);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTask(rawTask: Record<string, any>): ApprovalTaskSummary {
  return {
    task_id: normalizeString(rawTask.task_id),
    node_id: normalizeString(rawTask.node_id ?? rawTask.task_def_key),
    node_name: normalizeString(rawTask.node_name),
    status: normalizeString(rawTask.status),
    user_id: normalizeString(rawTask.user_id),
    open_id: normalizeString(rawTask.open_id),
    user_name: normalizeString(rawTask.user_name ?? rawTask.name),
    start_time: unixTimestampToISO8601(rawTask.start_time),
    end_time: unixTimestampToISO8601(rawTask.end_time),
  };
}

export function normalizeApprovalInstance(raw: Record<string, any> | undefined): ApprovalInstanceSummary | null {
  if (!raw || typeof raw !== 'object') return null;

  const tasks = Array.isArray(raw.task_list)
    ? raw.task_list.filter((task): task is Record<string, any> => Boolean(task) && typeof task === 'object').map(normalizeTask)
    : [];

  const approvers = tasks.map((task) => ({
    task_id: task.task_id,
    node_id: task.node_id,
    node_name: task.node_name,
    status: task.status,
    user_id: task.user_id,
    open_id: task.open_id,
    user_name: task.user_name,
  }));

  const status = normalizeString(raw.status);

  return {
    instance_id: normalizeString(raw.instance_code ?? raw.instance_id),
    approval_code: normalizeString(raw.approval_code),
    title: normalizeString(raw.title ?? raw.approval_name),
    status,
    applicant: {
      user_id: normalizeString(raw.user_id),
      open_id: normalizeString(raw.open_id),
      name: normalizeString(raw.user_name),
      department_name: normalizeString(raw.department_name),
    },
    approvers,
    create_time: unixTimestampToISO8601(raw.start_time ?? raw.create_time),
    finish_time: unixTimestampToISO8601(raw.end_time ?? raw.finish_time),
    pending: status === 'PENDING',
    tasks,
    raw,
  };
}

export function buildApprovalInstanceListQuery(params: {
  approval_code: string;
  start_time: string;
  end_time: string;
  page_size?: number;
  page_token?: string;
  locale?: ApprovalLocale;
  user_id?: string;
  user_id_type?: ApprovalUserIdType;
}): Record<string, string> {
  const startTime = parseApprovalTime(params.start_time);
  if (!startTime) {
    throw new Error(`Invalid approval start_time: ${params.start_time}`);
  }

  const endTime = parseApprovalTime(params.end_time);
  if (!endTime) {
    throw new Error(`Invalid approval end_time: ${params.end_time}`);
  }

  const query: Record<string, string> = {
    approval_code: params.approval_code,
    start_time: startTime,
    end_time: endTime,
  };

  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;
  if (params.locale) query.locale = params.locale;
  if (params.user_id) query.user_id = params.user_id;
  if (params.user_id_type) query.user_id_type = params.user_id_type;

  return query;
}

export function buildApprovalInstanceGetQuery(params: {
  locale?: ApprovalLocale;
  user_id?: string;
  user_id_type?: ApprovalUserIdType;
}): Record<string, string> | undefined {
  const query: Record<string, string> = {};

  if (params.locale) query.locale = params.locale;
  if (params.user_id) query.user_id = params.user_id;
  if (params.user_id_type) query.user_id_type = params.user_id_type;

  return Object.keys(query).length > 0 ? query : undefined;
}

export function shapeApprovalError(err: unknown): ApprovalOperationError {
  const code = extractApprovalErrorCode(err);
  const message = extractApprovalErrorMessage(err);

  if (/Missing access token for authorization/i.test(message)) {
    return {
      type: 'personal_access_token_required',
      code,
      message:
        '当前审批接口以应用身份调用，缺少你的个人 access token，因此无法访问“待我审批”等个人审批数据。这不是你的个人权限问题，而是当前工具链的鉴权限制。',
      hint:
        '可以继续处理你明确指定的审批实例，例如审批实例 ID、审批链接，或一条具体审批通知消息；暂时不能主动列出你全部“待我审批”的审批单。',
    };
  }

  if (code === 1390003) {
    return { type: 'not_found', code, message };
  }
  if (code === 1390009 || code === 99991672 || code === 99991679) {
    return { type: 'permission_denied', code, message };
  }
  if (code === 1390015 || code === 1390018 || /already/i.test(message)) {
    return { type: 'already_processed', code, message };
  }
  if (code === 1390001 || code === 1390004) {
    return { type: 'invalid_request', code, message };
  }

  return { type: 'api_error', code, message };
}

function extractApprovalErrorCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;

  const maybeCode =
    (err as { code?: unknown }).code ??
    (err as { data?: { code?: unknown } }).data?.code ??
    (err as { response?: { data?: { code?: unknown } } }).response?.data?.code;

  if (typeof maybeCode === 'number') return maybeCode;
  if (typeof maybeCode === 'string' && /^\d+$/.test(maybeCode)) {
    return Number(maybeCode);
  }
  return undefined;
}

function extractApprovalErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      (err as { msg?: unknown }).msg ??
      (err as { message?: unknown }).message ??
      (err as { response?: { data?: { msg?: unknown } } }).response?.data?.msg;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return formatLarkError(err);
}

function resolveApprovalUserId(userId: string | undefined, senderOpenId: string | undefined): string | undefined {
  return userId ?? senderOpenId;
}

function shouldFallbackApprovalInstanceToTenant(err: unknown): boolean {
  return err instanceof UserAuthRequiredError || err instanceof UserScopeInsufficientError;
}

async function invokeApprovalInstanceWithFallback<T>(params: {
  invoke: (as: 'user' | 'tenant') => Promise<T>;
  preferredMode: 'user' | 'tenant';
}): Promise<{
  result: T;
  auth_mode: 'user' | 'tenant';
  auth_fallback: boolean;
}> {
  if (params.preferredMode === 'tenant') {
    return {
      result: await params.invoke('tenant'),
      auth_mode: 'tenant',
      auth_fallback: false,
    };
  }

  try {
    return {
      result: await params.invoke('user'),
      auth_mode: 'user',
      auth_fallback: false,
    };
  } catch (err) {
    if (!shouldFallbackApprovalInstanceToTenant(err)) {
      throw err;
    }

    return {
      result: await params.invoke('tenant'),
      auth_mode: 'tenant',
      auth_fallback: true,
    };
  }
}

export function registerFeishuApprovalInstanceTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_instance');

  registerTool(
    api,
    {
      name: 'feishu_approval_instance',
      label: 'Feishu Approval Instance',
      description:
        '飞书审批实例工具。用于按审批定义和时间窗口列出审批实例、获取单个审批实例详情。Actions: list（列出实例 ID，可选自动展开详情）, get（查看实例详情）。时间参数支持 ISO 8601 / RFC 3339 或 Unix 毫秒时间戳字符串。实例查询会优先以用户身份执行；若当前会话缺少用户授权，则对明确范围的实例查询回退到应用身份。',
      parameters: FeishuApprovalInstanceSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalInstanceParams;
        try {
          const client = toolClient();
          const defaultUserId = client.senderOpenId;

          switch (p.action) {
            case 'list': {
              const authPolicy = getApprovalAuthPolicy('instance', 'list');
              const query = buildApprovalInstanceListQuery({
                approval_code: p.approval_code,
                start_time: p.start_time,
                end_time: p.end_time,
                page_size: p.page_size ?? 50,
                page_token: p.page_token,
                locale: p.locale,
                user_id: resolveApprovalUserId(p.user_id, defaultUserId),
                user_id_type: p.user_id_type ?? 'open_id',
              });

              log.info(`list: approval_code=${p.approval_code}, page_size=${query.page_size ?? '50'}`);

              const listCall = await invokeApprovalInstanceWithFallback({
                preferredMode: authPolicy.currentExecutionMode,
                invoke: (as) =>
                  client.invokeByPath<{
                    code?: number;
                    msg?: string;
                    data?: {
                      instance_code_list?: string[];
                      page_token?: string;
                      has_more?: boolean;
                    };
                  }>('feishu_approval_instance.list', '/open-apis/approval/v4/instances', {
                    method: 'GET',
                    query,
                    as,
                  }),
              });
              const res = listCall.result;

              if (res.code && res.code !== 0) {
                throw res;
              }

              const instanceIds = Array.isArray(res.data?.instance_code_list) ? res.data.instance_code_list : [];
              const includeDetails = p.include_details ?? true;

              if (!includeDetails || instanceIds.length === 0) {
                return json({
                  auth_mode: listCall.auth_mode,
                  auth_fallback: listCall.auth_fallback,
                  instance_ids: instanceIds,
                  instances: instanceIds.map((instanceId) => ({ instance_id: instanceId })),
                  has_more: res.data?.has_more ?? false,
                  page_token: res.data?.page_token ?? null,
                  raw: res.data ?? null,
                });
              }

              const detailQuery = buildApprovalInstanceGetQuery({
                locale: p.locale,
                user_id: resolveApprovalUserId(p.user_id, defaultUserId),
                user_id_type: p.user_id_type ?? 'open_id',
              });

              const detailResults = await Promise.all(
                instanceIds.map(async (instanceId) => {
                  const detailRes = await client.invokeByPath<{
                    code?: number;
                    msg?: string;
                    data?: Record<string, any>;
                  }>('feishu_approval_instance.get', `/open-apis/approval/v4/instances/${encodeURIComponent(instanceId)}`, {
                    method: 'GET',
                    query: detailQuery,
                    as: listCall.auth_mode,
                  });

                  if (detailRes.code !== undefined && detailRes.code !== 0) {
                    throw detailRes;
                  }

                  return normalizeApprovalInstance(detailRes.data);
                }),
              );

              return json({
                auth_mode: listCall.auth_mode,
                auth_fallback: listCall.auth_fallback,
                instance_ids: instanceIds,
                instances: detailResults.filter((item): item is ApprovalInstanceSummary => item != null),
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token ?? null,
                raw: {
                  list: res.data ?? null,
                },
              });
            }

            case 'get': {
              const authPolicy = getApprovalAuthPolicy('instance', 'get');
              const query = buildApprovalInstanceGetQuery({
                locale: p.locale,
                user_id: resolveApprovalUserId(p.user_id, defaultUserId),
                user_id_type: p.user_id_type ?? 'open_id',
              });

              log.info(`get: instance_id=${p.instance_id}`);

              const getCall = await invokeApprovalInstanceWithFallback({
                preferredMode: authPolicy.currentExecutionMode,
                invoke: (as) =>
                  client.invokeByPath<{
                    code?: number;
                    msg?: string;
                    data?: Record<string, any>;
                  }>('feishu_approval_instance.get', `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}`, {
                    method: 'GET',
                    query,
                    as,
                  }),
              });
              const res = getCall.result;

              if (res.code && res.code !== 0) {
                throw res;
              }

              return json({
                auth_mode: getCall.auth_mode,
                auth_fallback: getCall.auth_fallback,
                instance: normalizeApprovalInstance(res.data),
              });
            }
          }
        } catch (err) {
          if (isInvokeError(err)) {
            return await handleInvokeErrorWithAutoAuth(err, cfg);
          }

          return json({
            error: shapeApprovalError(err),
          });
        }
      },
    },
    { name: 'feishu_approval_instance' },
  );
}
