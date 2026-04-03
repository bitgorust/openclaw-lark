/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_task tool -- act on Feishu approval tasks.
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

const sharedTaskFields = {
  approval_code: Type.String({
    description: '审批定义 Code。',
  }),
  instance_id: Type.String({
    description: '审批实例 Code。',
  }),
  task_id: Type.String({
    description: '审批任务 ID。',
  }),
  user_id: Type.Optional(
    Type.String({
      description: '操作人用户 ID。未传时默认使用当前消息发送者 open_id（如果存在）。',
    }),
  ),
  comment: Type.Optional(
    Type.String({
      description: '审批意见。',
    }),
  ),
  user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
};

const FeishuApprovalTaskSchema = Type.Union([
  Type.Object({
    action: Type.Literal('approve'),
    ...sharedTaskFields,
  }),
  Type.Object({
    action: Type.Literal('reject'),
    ...sharedTaskFields,
  }),
  Type.Object({
    action: Type.Literal('transfer'),
    ...sharedTaskFields,
    transfer_user_id: Type.String({
      description: '被转交人的用户 ID。',
    }),
  }),
  Type.Object({
    action: Type.Literal('add_sign'),
    ...sharedTaskFields,
    add_sign_user_ids: Type.Array(
      Type.String({
        description: '加签用户 ID。',
      }),
      {
        minItems: 1,
        description: '加签用户 ID 列表。',
      },
    ),
    add_sign_type: Type.Integer({
      description: '加签类型。按官方接口透传。',
    }),
    approval_method: Type.Optional(
      Type.Integer({
        description: '审批方式。按官方接口透传。',
      }),
    ),
  }),
  Type.Object({
    action: Type.Literal('resubmit'),
    ...sharedTaskFields,
    form: Type.String({
      description: '重新提交后的表单 JSON 字符串。',
    }),
  }),
  Type.Object({
    action: Type.Literal('rollback'),
    task_id: Type.String({
      description: '当前审批任务 ID。',
    }),
    user_id: Type.Optional(
      Type.String({
        description: '操作人用户 ID。未传时默认使用当前消息发送者 open_id（如果存在）。',
      }),
    ),
    reason: Type.String({
      description: '退回原因。',
    }),
    task_def_key_list: Type.Array(
      Type.String({
        description: '要退回到的已审批节点 key 列表。',
      }),
      {
        description: '审批节点 key 列表。',
      },
    ),
    extra: Type.Optional(
      Type.String({
        description: '附加扩展信息。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
]);

type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];

type FeishuApprovalTaskParams =
  | {
      action: 'approve' | 'reject';
      approval_code: string;
      instance_id: string;
      task_id: string;
      user_id?: string;
      comment?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'transfer';
      approval_code: string;
      instance_id: string;
      task_id: string;
      user_id?: string;
      comment?: string;
      transfer_user_id: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'add_sign';
      approval_code: string;
      instance_id: string;
      task_id: string;
      user_id?: string;
      comment?: string;
      add_sign_user_ids: string[];
      add_sign_type: number;
      approval_method?: number;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'resubmit';
      approval_code: string;
      instance_id: string;
      task_id: string;
      user_id?: string;
      comment?: string;
      form: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'rollback';
      task_id: string;
      user_id?: string;
      reason: string;
      task_def_key_list: string[];
      extra?: string;
      user_id_type?: ApprovalUserIdType;
    };

function resolveApprovalUserId(userId: string | undefined, senderOpenId: string | undefined): string {
  const resolved = userId ?? senderOpenId;
  if (!resolved) {
    throw new Error('approval task actions require user_id, and no sender open_id is available in the current context');
  }
  return resolved;
}

export function buildApprovalTaskRequest(
  params: Extract<FeishuApprovalTaskParams, { action: 'approve' | 'reject' | 'transfer' | 'add_sign' | 'resubmit' }>,
  fallbackUserId?: string,
): {
  body: Record<string, string | string[] | number>;
  query?: Record<string, string>;
  path: string;
} {
  const body: Record<string, string | string[] | number> = {
    approval_code: params.approval_code,
    instance_code: params.instance_id,
    task_id: params.task_id,
    user_id: resolveApprovalUserId(params.user_id, fallbackUserId),
  };

  if (params.comment) body.comment = params.comment;
  if (params.action === 'transfer') {
    body.transfer_user_id = params.transfer_user_id;
  }
  if (params.action === 'add_sign') {
    body.add_sign_user_ids = params.add_sign_user_ids;
    body.add_sign_type = params.add_sign_type;
    if (params.approval_method !== undefined) body.approval_method = params.approval_method;
  }
  if (params.action === 'resubmit') {
    body.form = params.form;
  }

  return {
    body,
    query:
      params.action === 'add_sign'
        ? undefined
        : {
            user_id_type: params.user_id_type ?? 'open_id',
          },
    path: params.action === 'add_sign' ? '/open-apis/approval/v4/instances/add_sign' : `/open-apis/approval/v4/tasks/${params.action}`,
  };
}

export function buildApprovalRollbackRequest(
  params: Extract<FeishuApprovalTaskParams, { action: 'rollback' }>,
  fallbackUserId?: string,
): {
  body: {
    task_id: string;
    user_id: string;
    reason: string;
    task_def_key_list: string[];
    extra?: string;
  };
  query: Record<string, string>;
  path: string;
} {
  const body: {
    task_id: string;
    user_id: string;
    reason: string;
    task_def_key_list: string[];
    extra?: string;
  } = {
    task_id: params.task_id,
    user_id: resolveApprovalUserId(params.user_id, fallbackUserId),
    reason: params.reason,
    task_def_key_list: params.task_def_key_list,
  };

  if (params.extra) body.extra = params.extra;

  return {
    body,
    query: {
      user_id_type: params.user_id_type ?? 'open_id',
    },
    path: '/open-apis/approval/v4/instances/specified_rollback',
  };
}

export function registerFeishuApprovalTaskTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_task');

  registerTool(
    api,
    {
      name: 'feishu_approval_task',
      label: 'Feishu Approval Task',
      description:
        '飞书审批任务工具。用于同意、拒绝、转交、加签、重新提交或退回审批任务。Actions: approve, reject, transfer, add_sign, resubmit, rollback。默认把当前消息发送者 open_id 作为操作人 user_id。按当前 canonical contract，任务动作端点以应用身份执行。',
      parameters: FeishuApprovalTaskSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalTaskParams;
        try {
          const client = toolClient();
          const fallbackUserId = client.senderOpenId;
          const authPolicy = getApprovalAuthPolicy('task', p.action);

          const request =
            p.action === 'rollback'
              ? buildApprovalRollbackRequest(p, fallbackUserId)
              : buildApprovalTaskRequest(p, fallbackUserId);

          log.info(`${p.action}: task_id=${p.task_id}`);

          const res = await client.invokeByPath<{
            code?: number;
            msg?: string;
            data?: Record<string, any>;
          }>(
            p.action === 'rollback' ? 'feishu_approval_task.rollback' : `feishu_approval_task.${p.action}`,
            request.path,
            {
              method: 'POST',
              body: request.body,
              query: request.query,
              as: authPolicy.currentExecutionMode,
            },
          );

          if (res.code && res.code !== 0) {
            throw res;
          }

          return json({
            action: p.action,
            ok: true,
            result: {
              task_id: p.task_id,
              instance_id: 'instance_id' in p ? p.instance_id : null,
              approval_code: 'approval_code' in p ? p.approval_code : null,
            },
            raw: res.data ?? null,
          });
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
    { name: 'feishu_approval_task' },
  );
}
