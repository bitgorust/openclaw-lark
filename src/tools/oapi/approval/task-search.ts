/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_task_search tool -- query approval tasks.
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
  registerTool,
} from '../helpers';
import { getApprovalAuthPolicy } from './auth-policy';
import { shapeApprovalError } from './instance';

const APPROVAL_USER_ID_TYPES = ['open_id', 'union_id', 'user_id'] as const;
const APPROVAL_TASK_QUERY_TOPICS = ['1', '2', '3', '17', '18'] as const;
const APPROVAL_TASK_SEARCH_STATUSES = [
  'PENDING',
  'REJECTED',
  'APPROVED',
  'TRANSFERRED',
  'DONE',
  'RM_REPEAT',
  'PROCESSED',
  'ALL',
] as const;
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

const FeishuApprovalTaskSearchSchema = Type.Union([
  Type.Object({
    action: Type.Literal('query'),
    user_id: Type.Optional(
      Type.String({
        description: '待查询用户 ID。未传时默认使用当前消息发送者 open_id。',
      }),
    ),
    topic: StringEnum([...APPROVAL_TASK_QUERY_TOPICS], {
      description: '任务分组。1=待我审批，2=我发起的，3=抄送我的，17=我已审批，18=我已转交。',
    }),
    page_size: Type.Optional(
      Type.Integer({
        description: '分页大小。',
        minimum: 1,
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('search'),
    user_id: Type.Optional(
      Type.String({
        description: '待查询用户 ID。部分个人任务搜索场景建议传入；未传时可由服务端按其他条件搜索。',
      }),
    ),
    approval_code: Type.Optional(
      Type.String({
        description: '审批定义 Code。',
      }),
    ),
    instance_code: Type.Optional(
      Type.String({
        description: '审批实例 Code。',
      }),
    ),
    instance_external_id: Type.Optional(
      Type.String({
        description: '审批实例外部 ID。',
      }),
    ),
    group_external_id: Type.Optional(
      Type.String({
        description: '审批定义分组外部 ID。',
      }),
    ),
    task_title: Type.Optional(
      Type.String({
        description: '审批任务标题关键词。',
      }),
    ),
    task_status: Type.Optional(StringEnum([...APPROVAL_TASK_SEARCH_STATUSES])),
    task_start_time_from: Type.Optional(
      Type.String({
        description: '任务开始时间下界。支持 Unix 毫秒时间戳字符串。',
      }),
    ),
    task_start_time_to: Type.Optional(
      Type.String({
        description: '任务开始时间上界。支持 Unix 毫秒时间戳字符串。',
      }),
    ),
    locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
    task_status_list: Type.Optional(
      Type.Array(Type.String(), {
        description: '任务状态列表。按官方接口透传。',
      }),
    ),
    order: Type.Optional(
      Type.Number({
        description: '排序方向。按官方接口透传。',
      }),
    ),
    with_revoked_instance: Type.Optional(
      Type.Boolean({
        description: '是否包含已撤回实例。',
      }),
    ),
    page_size: Type.Optional(
      Type.Integer({
        description: '分页大小。',
        minimum: 1,
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
]);

type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];
type ApprovalTaskQueryTopic = (typeof APPROVAL_TASK_QUERY_TOPICS)[number];
type ApprovalTaskSearchStatus = (typeof APPROVAL_TASK_SEARCH_STATUSES)[number];
type ApprovalLocale = (typeof APPROVAL_LOCALES)[number];

type FeishuApprovalTaskSearchParams =
  | {
      action: 'query';
      user_id?: string;
      topic: ApprovalTaskQueryTopic;
      page_size?: number;
      page_token?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'search';
      user_id?: string;
      approval_code?: string;
      instance_code?: string;
      instance_external_id?: string;
      group_external_id?: string;
      task_title?: string;
      task_status?: ApprovalTaskSearchStatus;
      task_start_time_from?: string;
      task_start_time_to?: string;
      locale?: ApprovalLocale;
      task_status_list?: string[];
      order?: number;
      with_revoked_instance?: boolean;
      page_size?: number;
      page_token?: string;
      user_id_type?: ApprovalUserIdType;
    };

interface ApprovalTaskQuerySummary {
  task_id: string | null;
  title: string | null;
  topic: string | null;
  user_id: string | null;
  status: string | null;
  process_status: string | null;
  definition_code: string | null;
  process_id: string | null;
  process_external_id: string | null;
  task_external_id: string | null;
  initiators: string[];
  initiator_names: string[];
  urls: Record<string, string>;
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrls(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
  );
}

function normalizeApprovalTaskQueryItem(raw: Record<string, any>): ApprovalTaskQuerySummary {
  return {
    task_id: normalizeString(raw.task_id),
    title: normalizeString(raw.title),
    topic: normalizeString(raw.topic),
    user_id: normalizeString(raw.user_id),
    status: normalizeString(raw.status),
    process_status: normalizeString(raw.process_status),
    definition_code: normalizeString(raw.definition_code),
    process_id: normalizeString(raw.process_id),
    process_external_id: normalizeString(raw.process_external_id),
    task_external_id: normalizeString(raw.task_external_id),
    initiators: Array.isArray(raw.initiators) ? raw.initiators.filter((item): item is string => typeof item === 'string') : [],
    initiator_names: Array.isArray(raw.initiator_names)
      ? raw.initiator_names.filter((item): item is string => typeof item === 'string')
      : [],
    urls: normalizeUrls(raw.urls),
    raw,
  };
}

export function buildApprovalTaskQueryRequest(
  params: Extract<FeishuApprovalTaskSearchParams, { action: 'query' }>,
  fallbackUserId?: string,
): Record<string, string> {
  const userId = params.user_id ?? fallbackUserId;
  if (!userId) {
    throw new Error('approval task query requires user_id, and no sender open_id is available in the current context');
  }

  const query: Record<string, string> = {
    user_id: userId,
    user_id_type: params.user_id_type ?? 'open_id',
  };
  if (params.topic) query.topic = params.topic;
  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;
  return query;
}

export function buildApprovalTaskSearchRequest(params: Extract<FeishuApprovalTaskSearchParams, { action: 'search' }>): {
  query: Record<string, string>;
  body: Record<string, unknown>;
} {
  const query: Record<string, string> = {
    user_id_type: params.user_id_type ?? 'open_id',
  };
  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;

  const body: Record<string, unknown> = {};
  if (params.user_id) body.user_id = params.user_id;
  if (params.approval_code) body.approval_code = params.approval_code;
  if (params.instance_code) body.instance_code = params.instance_code;
  if (params.instance_external_id) body.instance_external_id = params.instance_external_id;
  if (params.group_external_id) body.group_external_id = params.group_external_id;
  if (params.task_title) body.task_title = params.task_title;
  if (params.task_status) body.task_status = params.task_status;
  if (params.task_start_time_from) body.task_start_time_from = params.task_start_time_from;
  if (params.task_start_time_to) body.task_start_time_to = params.task_start_time_to;
  if (params.locale) body.locale = params.locale;
  if (params.task_status_list) body.task_status_list = params.task_status_list;
  if (params.order !== undefined) body.order = params.order;
  if (params.with_revoked_instance !== undefined) body.with_revoked_instance = params.with_revoked_instance;

  return {
    query,
    body,
  };
}

export function registerFeishuApprovalTaskSearchTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_task_search');

  registerTool(
    api,
    {
      name: 'feishu_approval_task_search',
      label: 'Feishu Approval Task Search',
      description:
        '飞书审批任务查询工具。Actions: query（按用户和 topic 查询任务列表）, search（按官方 tasks/search 条件查询任务列表）。该工具是审批域用户态查询能力的基础入口。',
      parameters: FeishuApprovalTaskSearchSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalTaskSearchParams;
        try {
          const client = toolClient();

          switch (p.action) {
            case 'query': {
              const authPolicy = getApprovalAuthPolicy('task-search', 'query');
              const query = buildApprovalTaskQueryRequest(p, client.senderOpenId);
              log.info(`query: topic=${p.topic ?? 'default'}, page_size=${query.page_size ?? 'default'}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: {
                  tasks?: Record<string, any>[];
                  has_more?: boolean;
                  page_token?: string;
                };
              }>('feishu_approval_task_search.query', '/open-apis/approval/v4/tasks/query', {
                method: 'GET',
                query,
                as: authPolicy.currentExecutionMode,
              });

              if (res.code && res.code !== 0) {
                throw res;
              }

              const tasks = Array.isArray(res.data?.tasks)
                ? res.data.tasks.map((item) => normalizeApprovalTaskQueryItem(item))
                : [];

              return json({
                action: 'query',
                tasks,
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token ?? null,
                raw: res.data ?? null,
              });
            }

            case 'search': {
              const authPolicy = getApprovalAuthPolicy('task-search', 'search');
              const request = buildApprovalTaskSearchRequest(p);
              log.info(`search: page_size=${request.query.page_size ?? 'default'}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: {
                  tasks?: Record<string, any>[];
                  has_more?: boolean;
                  page_token?: string;
                  count?: number;
                };
              }>('feishu_approval_task_search.search', '/open-apis/approval/v4/tasks/search', {
                method: 'POST',
                query: request.query,
                body: request.body,
                as: authPolicy.currentExecutionMode,
              });

              if (res.code && res.code !== 0) {
                throw res;
              }

              const tasks = Array.isArray(res.data?.tasks)
                ? res.data.tasks.map((item) => normalizeApprovalTaskQueryItem(item))
                : [];

              return json({
                action: 'search',
                tasks,
                count: res.data?.count ?? tasks.length,
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token ?? null,
                raw: res.data ?? null,
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
    { name: 'feishu_approval_task_search' },
  );
}
