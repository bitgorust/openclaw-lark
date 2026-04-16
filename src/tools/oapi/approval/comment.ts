/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_comment tool -- manage approval instance comments.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import {
  StringEnum,
  UserAuthRequiredError,
  UserScopeInsufficientError,
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

const ApprovalAtInfoSchema = Type.Object({
  user_id: Type.String({ description: '被 @ 的用户 ID。' }),
  name: Type.String({ description: '被 @ 的用户名。' }),
  offset: Type.String({ description: '在 content 中的偏移量。' }),
});

const FeishuApprovalCommentSchema = Type.Union([
  Type.Object({
    action: Type.Literal('create'),
    instance_id: Type.String({ description: '审批实例 Code。' }),
    content: Type.String({ description: '评论内容。' }),
    at_info_list: Type.Optional(Type.Array(ApprovalAtInfoSchema)),
    parent_comment_id: Type.Optional(Type.String({ description: '父评论 ID。传入时表示回复评论。' })),
    comment_id: Type.Optional(Type.String({ description: '评论 ID。传入时表示修改已有评论。' })),
    disable_bot: Type.Optional(Type.Boolean({ description: '是否禁用机器人通知。' })),
    extra: Type.Optional(Type.String({ description: '附加扩展信息。' })),
    user_id: Type.Optional(Type.String({ description: '操作人用户 ID。未传时默认使用当前消息发送者 open_id。' })),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('list'),
    instance_id: Type.String({ description: '审批实例 Code。' }),
    page_size: Type.Optional(Type.Integer({ description: '分页大小。', minimum: 1 })),
    page_token: Type.Optional(Type.String({ description: '分页标记。' })),
    user_id: Type.Optional(Type.String({ description: '查询用户 ID。未传时默认使用当前消息发送者 open_id。' })),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('delete'),
    instance_id: Type.String({ description: '审批实例 Code。' }),
    comment_id: Type.String({ description: '评论 ID。' }),
    user_id: Type.Optional(Type.String({ description: '操作人用户 ID。未传时默认使用当前消息发送者 open_id。' })),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('remove'),
    instance_id: Type.String({ description: '审批实例 Code。' }),
    user_id: Type.Optional(Type.String({ description: '操作人用户 ID。未传时默认使用当前消息发送者 open_id。' })),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
]);

type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];

interface ApprovalAtInfo {
  user_id: string;
  name: string;
  offset: string;
}

type FeishuApprovalCommentParams =
  | {
      action: 'create';
      instance_id: string;
      content: string;
      at_info_list?: ApprovalAtInfo[];
      parent_comment_id?: string;
      comment_id?: string;
      disable_bot?: boolean;
      extra?: string;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'list';
      instance_id: string;
      page_size?: number;
      page_token?: string;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'delete';
      instance_id: string;
      comment_id: string;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'remove';
      instance_id: string;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    };

export interface ApprovalCommentSummary {
  id: string | null;
  content: string | null;
  create_time: string | null;
  update_time: string | null;
  is_deleted: boolean;
  commentator: string | null;
  extra: string | null;
  at_info_list: ApprovalAtInfo[];
  replies: ApprovalCommentSummary[];
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAtInfoList(value: unknown): ApprovalAtInfo[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      user_id: String(item.user_id ?? ''),
      name: String(item.name ?? ''),
      offset: String(item.offset ?? ''),
    }));
}

export function normalizeApprovalComment(raw: Record<string, any>): ApprovalCommentSummary {
  return {
    id: normalizeString(raw.id),
    content: normalizeString(raw.content),
    create_time: unixTimestampToISO8601(raw.create_time),
    update_time: unixTimestampToISO8601(raw.update_time),
    is_deleted: raw.is_delete === 1,
    commentator: normalizeString(raw.commentator),
    extra: normalizeString(raw.extra),
    at_info_list: normalizeAtInfoList(raw.at_info_list),
    replies: Array.isArray(raw.replies)
      ? raw.replies
          .filter((item): item is Record<string, any> => Boolean(item) && typeof item === 'object')
          .map((item) => normalizeApprovalComment(item))
      : [],
    raw,
  };
}

function resolveApprovalUserId(userId: string | undefined, senderOpenId: string | undefined): string {
  const resolved = userId ?? senderOpenId;
  if (!resolved) {
    throw new Error('approval comment actions require user_id, and no sender open_id is available in the current context');
  }
  return resolved;
}

function shouldFallbackApprovalCommentListToTenant(err: unknown): boolean {
  return err instanceof UserAuthRequiredError || err instanceof UserScopeInsufficientError;
}

async function invokeApprovalCommentListWithFallback<T>(params: {
  invoke: (as: 'user' | 'tenant') => Promise<T>;
  preferredMode: 'user' | 'tenant';
  allowTenantFallback: boolean;
}): Promise<{
  result: T;
  auth_mode: 'user' | 'tenant';
  auth_fallback: boolean;
}> {
  if (params.preferredMode === 'tenant' || !params.allowTenantFallback) {
    return {
      result: await params.invoke(params.preferredMode),
      auth_mode: params.preferredMode,
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
    if (!shouldFallbackApprovalCommentListToTenant(err)) {
      throw err;
    }
    return {
      result: await params.invoke('tenant'),
      auth_mode: 'tenant',
      auth_fallback: true,
    };
  }
}

export function registerFeishuApprovalCommentTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_comment');

  registerTool(
    api,
    {
      name: 'feishu_approval_comment',
      label: 'Feishu Approval Comment',
      description:
        '飞书审批评论工具。Actions: create（创建或回复评论）, list（获取实例评论列表）, delete（删除单条评论）, remove（清空实例评论）。按当前 canonical contract，评论相关端点以用户身份执行。',
      parameters: FeishuApprovalCommentSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalCommentParams;
        let lastClient: ReturnType<typeof toolClient> | undefined;
        try {
          const client = (lastClient = toolClient());
          const senderOpenId = client.senderOpenId;

          switch (p.action) {
            case 'create': {
              const authPolicy = getApprovalAuthPolicy('comment', 'create');
              const user_id = resolveApprovalUserId(p.user_id, senderOpenId);
              log.info(`create: instance_id=${p.instance_id}, parent_comment_id=${p.parent_comment_id ?? 'none'}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: { comment_id?: string };
              }>('feishu_approval_comment.create', `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}/comments`, {
                method: 'POST',
                query: {
                  user_id_type: p.user_id_type ?? 'open_id',
                  user_id,
                },
                body: {
                  content: p.content,
                  at_info_list: p.at_info_list,
                  parent_comment_id: p.parent_comment_id,
                  comment_id: p.comment_id,
                  disable_bot: p.disable_bot,
                  extra: p.extra,
                },
                as: authPolicy.currentExecutionMode,
              });

              if (res.code && res.code !== 0) throw res;

              return json({
                action: 'create',
                ok: true,
                comment_id: res.data?.comment_id ?? null,
                raw: res.data ?? null,
              });
            }

            case 'list': {
              const authPolicy = getApprovalAuthPolicy('comment', 'list');
              const user_id = resolveApprovalUserId(p.user_id, senderOpenId);
              log.info(`list: instance_id=${p.instance_id}, page_size=${p.page_size ?? 'default'}`);

              const listCall = await invokeApprovalCommentListWithFallback({
                preferredMode: authPolicy.currentExecutionMode,
                allowTenantFallback: authPolicy.allowTenantFallback,
                invoke: (as) =>
                  client.invokeByPath<{
                    code?: number;
                    msg?: string;
                    data?: { comments?: Record<string, any>[] };
                  }>(
                    'feishu_approval_comment.list',
                    `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}/comments`,
                    {
                      method: 'GET',
                      query: {
                        user_id_type: p.user_id_type ?? 'open_id',
                        user_id,
                        ...(p.page_size !== undefined ? { page_size: String(p.page_size) } : {}),
                        ...(p.page_token ? { page_token: p.page_token } : {}),
                      },
                      as,
                    },
                  ),
              });

              const res = listCall.result;
              if (res.code && res.code !== 0) throw res;

              const comments = Array.isArray(res.data?.comments)
                ? res.data.comments.map((item) => normalizeApprovalComment(item))
                : [];

              return json({
                action: 'list',
                auth_mode: listCall.auth_mode,
                auth_fallback: listCall.auth_fallback,
                comments,
                raw: res.data ?? null,
              });
            }

            case 'delete': {
              const authPolicy = getApprovalAuthPolicy('comment', 'delete');
              const user_id = resolveApprovalUserId(p.user_id, senderOpenId);
              log.info(`delete: instance_id=${p.instance_id}, comment_id=${p.comment_id}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: { comment_id?: string };
              }>(
                'feishu_approval_comment.delete',
                `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}/comments/${encodeURIComponent(p.comment_id)}`,
                {
                  method: 'DELETE',
                  query: {
                    user_id_type: p.user_id_type ?? 'open_id',
                    user_id,
                  },
                  as: authPolicy.currentExecutionMode,
                },
              );

              if (res.code && res.code !== 0) throw res;

              return json({
                action: 'delete',
                ok: true,
                comment_id: res.data?.comment_id ?? p.comment_id,
                raw: res.data ?? null,
              });
            }

            case 'remove': {
              const authPolicy = getApprovalAuthPolicy('comment', 'remove');
              const user_id = resolveApprovalUserId(p.user_id, senderOpenId);
              log.info(`remove: instance_id=${p.instance_id}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: { instance_id?: string; external_id?: string };
              }>('feishu_approval_comment.remove', `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}/comments/remove`, {
                method: 'POST',
                query: {
                  user_id_type: p.user_id_type ?? 'open_id',
                  user_id,
                },
                as: authPolicy.currentExecutionMode,
              });

              if (res.code && res.code !== 0) throw res;

              return json({
                action: 'remove',
                ok: true,
                instance_id: res.data?.instance_id ?? p.instance_id,
                external_id: res.data?.external_id ?? null,
                raw: res.data ?? null,
              });
            }
          }
        } catch (err) {
          const invokeErr = normalizeRawInvokeError({
            toolAction: `feishu_approval_comment.${p.action}`,
            err,
            userOpenId: lastClient?.senderOpenId,
            appId: lastClient?.account.appId,
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
    { name: 'feishu_approval_comment' },
  );
}
