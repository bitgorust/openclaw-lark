/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_cc tool -- query approval CC list.
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
  unixTimestampToISO8601,
} from '../helpers';
import { getApprovalAuthPolicy } from './auth-policy';
import { shapeApprovalError } from './instance';

const APPROVAL_USER_ID_TYPES = ['open_id', 'union_id', 'user_id'] as const;
const APPROVAL_CC_READ_STATUSES = ['READ', 'UNREAD', 'ALL'] as const;
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

const FeishuApprovalCcSchema = Type.Object({
  action: Type.Literal('search'),
  user_id: Type.Optional(
    Type.String({
      description: '待查询用户 ID。未传时默认使用当前消息发送者 open_id。',
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
  cc_title: Type.Optional(
    Type.String({
      description: '抄送标题关键词。',
    }),
  ),
  read_status: Type.Optional(StringEnum([...APPROVAL_CC_READ_STATUSES])),
  cc_create_time_from: Type.Optional(
    Type.String({
      description: '抄送创建时间下界。支持 Unix 毫秒时间戳字符串。',
    }),
  ),
  cc_create_time_to: Type.Optional(
    Type.String({
      description: '抄送创建时间上界。支持 Unix 毫秒时间戳字符串。',
    }),
  ),
  locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
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
});

type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];
type ApprovalCcReadStatus = (typeof APPROVAL_CC_READ_STATUSES)[number];
type ApprovalLocale = (typeof APPROVAL_LOCALES)[number];

export interface FeishuApprovalCcParams {
  action: 'search';
  user_id?: string;
  approval_code?: string;
  instance_code?: string;
  instance_external_id?: string;
  group_external_id?: string;
  cc_title?: string;
  read_status?: ApprovalCcReadStatus;
  cc_create_time_from?: string;
  cc_create_time_to?: string;
  locale?: ApprovalLocale;
  with_revoked_instance?: boolean;
  page_size?: number;
  page_token?: string;
  user_id_type?: ApprovalUserIdType;
}

export interface ApprovalCcSummary {
  approval: {
    code: string | null;
    name: string | null;
    approval_id: string | null;
    icon: string | null;
    is_external: boolean;
    batch_cc_read: boolean | null;
  };
  group: {
    external_id: string | null;
    name: string | null;
  };
  instance: {
    code: string | null;
    external_id: string | null;
    user_id: string | null;
    start_time: string | null;
    end_time: string | null;
    status: string | null;
    title: string | null;
    extra: string | null;
    serial_id: string | null;
    links: Record<string, string>;
  };
  cc: {
    user_id: string | null;
    create_time: string | null;
    read_status: string | null;
    title: string | null;
    extra: string | null;
    links: Record<string, string>;
  };
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLinks(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
  );
}

export function buildApprovalCcSearchRequest(
  params: FeishuApprovalCcParams,
  fallbackUserId?: string,
): {
  query: Record<string, string>;
  body: Record<string, unknown>;
} {
  const query: Record<string, string> = {
    user_id_type: params.user_id_type ?? 'open_id',
  };
  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;

  const body: Record<string, unknown> = {};
  const userId = params.user_id ?? fallbackUserId;
  if (userId) body.user_id = userId;
  if (params.approval_code) body.approval_code = params.approval_code;
  if (params.instance_code) body.instance_code = params.instance_code;
  if (params.instance_external_id) body.instance_external_id = params.instance_external_id;
  if (params.group_external_id) body.group_external_id = params.group_external_id;
  if (params.cc_title) body.cc_title = params.cc_title;
  if (params.read_status) body.read_status = params.read_status;
  if (params.cc_create_time_from) body.cc_create_time_from = params.cc_create_time_from;
  if (params.cc_create_time_to) body.cc_create_time_to = params.cc_create_time_to;
  if (params.locale) body.locale = params.locale;
  if (params.with_revoked_instance !== undefined) body.with_revoked_instance = params.with_revoked_instance;

  return {
    query,
    body,
  };
}

export function normalizeApprovalCcItem(raw: Record<string, any>): ApprovalCcSummary {
  const approval = raw.approval ?? {};
  const group = raw.group ?? {};
  const instance = raw.instance ?? {};
  const cc = raw.cc ?? {};

  return {
    approval: {
      code: normalizeString(approval.code),
      name: normalizeString(approval.name),
      approval_id: normalizeString(approval.approval_id),
      icon: normalizeString(approval.icon),
      is_external: approval.is_external === true,
      batch_cc_read: typeof approval.external?.batch_cc_read === 'boolean' ? approval.external.batch_cc_read : null,
    },
    group: {
      external_id: normalizeString(group.external_id),
      name: normalizeString(group.name),
    },
    instance: {
      code: normalizeString(instance.code),
      external_id: normalizeString(instance.external_id),
      user_id: normalizeString(instance.user_id),
      start_time: unixTimestampToISO8601(instance.start_time),
      end_time: unixTimestampToISO8601(instance.end_time),
      status: normalizeString(instance.status),
      title: normalizeString(instance.title),
      extra: normalizeString(instance.extra),
      serial_id: normalizeString(instance.serial_id),
      links: normalizeLinks(instance.link),
    },
    cc: {
      user_id: normalizeString(cc.user_id),
      create_time: unixTimestampToISO8601(cc.create_time),
      read_status: normalizeString(cc.read_status),
      title: normalizeString(cc.title),
      extra: normalizeString(cc.extra),
      links: normalizeLinks(cc.link),
    },
    raw,
  };
}

export function registerFeishuApprovalCcTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_cc');

  registerTool(
    api,
    {
      name: 'feishu_approval_cc',
      label: 'Feishu Approval CC',
      description: '飞书审批抄送查询工具。Actions: search（按官方 instances/search_cc 条件查询抄送列表）。',
      parameters: FeishuApprovalCcSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalCcParams;
        let lastClient: ReturnType<typeof toolClient> | undefined;
        try {
          const client = (lastClient = toolClient());
          const authPolicy = getApprovalAuthPolicy('cc', 'search');
          const request = buildApprovalCcSearchRequest(p, client.senderOpenId);

          log.info(`search: page_size=${request.query.page_size ?? 'default'}`);

          const res = await client.invokeByPath<{
            code?: number;
            msg?: string;
            data?: {
              cc_list?: Record<string, any>[];
              count?: number;
              has_more?: boolean;
              page_token?: string;
            };
          }>('feishu_approval_cc.search', '/open-apis/approval/v4/instances/search_cc', {
            method: 'POST',
            query: request.query,
            body: request.body,
            as: authPolicy.currentExecutionMode,
          });

          if (res.code && res.code !== 0) {
            throw res;
          }

          const cc_list = Array.isArray(res.data?.cc_list)
            ? res.data.cc_list.map((item) => normalizeApprovalCcItem(item))
            : [];

          return json({
            action: 'search',
            cc_list,
            count: res.data?.count ?? cc_list.length,
            has_more: res.data?.has_more ?? false,
            page_token: res.data?.page_token ?? null,
            raw: res.data ?? null,
          });
        } catch (err) {
          const invokeErr = normalizeRawInvokeError({
            toolAction: 'feishu_approval_cc.search',
            err,
            userOpenId: lastClient?.senderOpenId,
            appId: lastClient?.account.appId,
            tokenType: 'tenant',
          });

          if (isInvokeError(invokeErr)) {
            return await handleInvokeErrorWithAutoAuth(invokeErr, cfg);
          }

          return json({
            error: shapeApprovalError(err),
          });
        }
      },
    },
    { name: 'feishu_approval_cc' },
  );
}
