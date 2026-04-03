/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import {
  assertLarkOk,
  createToolContext,
  handleInvokeErrorWithAutoAuth,
  json,
  registerTool,
} from '../helpers';

const MailAddressSchema = Type.Object({
  mail_address: Type.String({ description: '邮箱地址' }),
  name: Type.Optional(Type.String({ description: '显示名称' })),
});

const MailAttachmentSchema = Type.Object({
  filename: Type.String({ description: '附件文件名' }),
  body: Type.String({ description: '附件内容，base64 字符串' }),
  is_inline: Type.Optional(Type.Boolean({ description: '是否为内联附件' })),
  cid: Type.Optional(Type.String({ description: '内联附件 CID' })),
});

const FeishuMailMessageSchema = Type.Union([
  Type.Object({
    action: Type.Literal('list'),
    user_mailbox_id: Type.String({ description: '邮箱 ID。通常使用完整邮箱地址。' }),
    folder_id: Type.String({ description: '文件夹 ID。' }),
    only_unread: Type.Optional(Type.Boolean({ description: '仅返回未读邮件。' })),
    page_size: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, description: '分页大小，默认 50。' })),
    page_token: Type.Optional(Type.String({ description: '分页标记。' })),
  }),
  Type.Object({
    action: Type.Literal('get'),
    user_mailbox_id: Type.String({ description: '邮箱 ID。通常使用完整邮箱地址。' }),
    message_id: Type.String({ description: '邮件 ID。通常先通过 list 获取。' }),
  }),
  Type.Object({
    action: Type.Literal('send'),
    user_mailbox_id: Type.String({ description: '邮箱 ID。通常使用完整邮箱地址。' }),
    subject: Type.Optional(Type.String({ description: '邮件主题。' })),
    to: Type.Array(MailAddressSchema, { minItems: 1, description: '收件人列表。' }),
    cc: Type.Optional(Type.Array(MailAddressSchema, { description: '抄送列表。' })),
    bcc: Type.Optional(Type.Array(MailAddressSchema, { description: '密送列表。' })),
    body_plain_text: Type.Optional(Type.String({ description: '纯文本正文。' })),
    body_html: Type.Optional(Type.String({ description: 'HTML 正文。' })),
    raw: Type.Optional(Type.String({ description: '完整 RFC822 原始邮件。传 raw 时通常不再传结构化正文。' })),
    attachments: Type.Optional(Type.Array(MailAttachmentSchema, { description: '附件列表。' })),
    dedupe_key: Type.Optional(Type.String({ description: '幂等键。' })),
    from_name: Type.Optional(Type.String({ description: '发件人显示名。' })),
  }),
  Type.Object({
    action: Type.Literal('attachment_download_url'),
    user_mailbox_id: Type.String({ description: '邮箱 ID。通常使用完整邮箱地址。' }),
    message_id: Type.String({ description: '邮件 ID。' }),
    attachment_ids: Type.Array(Type.String({ description: '附件 ID。' }), {
      minItems: 1,
      description: '待获取下载链接的附件 ID 列表。',
    }),
  }),
]);

type FeishuMailMessageParams =
  | {
      action: 'list';
      user_mailbox_id: string;
      folder_id: string;
      only_unread?: boolean;
      page_size?: number;
      page_token?: string;
    }
  | {
      action: 'get';
      user_mailbox_id: string;
      message_id: string;
    }
  | {
      action: 'send';
      user_mailbox_id: string;
      subject?: string;
      to: Array<{ mail_address: string; name?: string }>;
      cc?: Array<{ mail_address: string; name?: string }>;
      bcc?: Array<{ mail_address: string; name?: string }>;
      body_plain_text?: string;
      body_html?: string;
      raw?: string;
      attachments?: Array<{
        filename: string;
        body: string;
        is_inline?: boolean;
        cid?: string;
      }>;
      dedupe_key?: string;
      from_name?: string;
    }
  | {
      action: 'attachment_download_url';
      user_mailbox_id: string;
      message_id: string;
      attachment_ids: string[];
    };

function normalizeMessage(item: Record<string, any>) {
  return {
    message_id: item.message_id,
    thread_id: item.thread_id,
    subject: item.subject,
    internal_date: item.internal_date,
    message_state: item.message_state,
    from: item.head_from,
    to: item.to ?? [],
    cc: item.cc ?? [],
    bcc: item.bcc ?? [],
    attachments: item.attachments ?? [],
    body_plain_text: item.body_plain_text,
    body_html: item.body_html,
    raw: item,
  };
}

export function registerFeishuMailMessageTool(api: OpenClawPluginApi): boolean {
  if (!api.config) return false;
  const config = api.config;
  const { toolClient, log } = createToolContext(api, 'feishu_mail_message');

  return registerTool(
    api,
    {
      name: 'feishu_mail_message',
      label: 'Feishu Mail Message',
      description:
        '飞书邮箱工具。支持列出邮件、获取邮件详情、发送邮件、获取附件下载链接。' +
        '\n\n注意：send 是 user-only，其余核心读取动作按 canonical contract 支持 dual-mode。',
      parameters: FeishuMailMessageSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuMailMessageParams;
        const client = toolClient();

        try {
          switch (p.action) {
            case 'list': {
              log.info(`list_messages: mailbox=${p.user_mailbox_id}, folder=${p.folder_id}`);
              const res = await client.invoke<{
                code?: number;
                msg?: string;
                data?: {
                  items?: string[];
                  page_token?: string;
                  has_more?: boolean;
                };
              }>(
                'feishu_mail_message.list',
                (sdk, opts) =>
                  sdk.mail.userMailboxMessage.list(
                    {
                      params: {
                        page_size: p.page_size ?? 50,
                        page_token: p.page_token,
                        folder_id: p.folder_id,
                        only_unread: p.only_unread,
                      },
                      path: {
                        user_mailbox_id: p.user_mailbox_id,
                      },
                    },
                    opts,
                  ),
                undefined,
              );
              assertLarkOk(res);
              return json({
                user_mailbox_id: p.user_mailbox_id,
                folder_id: p.folder_id,
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token,
                message_ids: res.data?.items ?? [],
              });
            }

            case 'get': {
              log.info(`get_message: mailbox=${p.user_mailbox_id}, message=${p.message_id}`);
              const res = await client.invoke<{
                code?: number;
                msg?: string;
                data?: {
                  message?: Record<string, any>;
                };
              }>(
                'feishu_mail_message.get',
                (sdk, opts) =>
                  sdk.mail.userMailboxMessage.get(
                    {
                      path: {
                        user_mailbox_id: p.user_mailbox_id,
                        message_id: p.message_id,
                      },
                    },
                    opts,
                  ),
                undefined,
              );
              assertLarkOk(res);
              return json({
                message: res.data?.message ? normalizeMessage(res.data.message) : null,
              });
            }

            case 'send': {
              if (!p.raw && !p.body_plain_text && !p.body_html) {
                return json({ error: 'send requires at least one of raw, body_plain_text, or body_html' });
              }
              log.info(`send_message: mailbox=${p.user_mailbox_id}, to=${p.to.length}`);
              const res = await client.invoke<{
                code?: number;
                msg?: string;
                data?: {
                  message_id?: string;
                  thread_id?: string;
                };
              }>(
                'feishu_mail_message.send',
                (sdk, opts) =>
                  sdk.mail.userMailboxMessage.send(
                    {
                      data: {
                        subject: p.subject,
                        to: p.to,
                        cc: p.cc,
                        bcc: p.bcc,
                        body_plain_text: p.body_plain_text,
                        body_html: p.body_html,
                        raw: p.raw,
                        attachments: p.attachments,
                        dedupe_key: p.dedupe_key,
                        head_from: p.from_name ? { name: p.from_name } : undefined,
                      },
                      path: {
                        user_mailbox_id: p.user_mailbox_id,
                      },
                    },
                    opts,
                  ),
                undefined,
              );
              assertLarkOk(res);
              return json({
                message_id: res.data?.message_id,
                thread_id: res.data?.thread_id,
              });
            }

            case 'attachment_download_url': {
              log.info(
                `attachment_download_url: mailbox=${p.user_mailbox_id}, message=${p.message_id}, count=${p.attachment_ids.length}`,
              );
              const res = await client.invoke<{
                code?: number;
                msg?: string;
                data?: {
                  download_urls?: Array<{ attachment_id?: string; download_url?: string }>;
                  failed_ids?: string[];
                };
              }>(
                'feishu_mail_message.attachment_download_url',
                (sdk, opts) =>
                  sdk.mail.userMailboxMessageAttachment.downloadUrl(
                    {
                      params: {
                        attachment_ids: p.attachment_ids,
                      },
                      path: {
                        user_mailbox_id: p.user_mailbox_id,
                        message_id: p.message_id,
                      },
                    },
                    opts,
                  ),
                undefined,
              );
              assertLarkOk(res);
              return json({
                download_urls: res.data?.download_urls ?? [],
                failed_ids: res.data?.failed_ids ?? [],
              });
            }
          }
        } catch (err) {
          return await handleInvokeErrorWithAutoAuth(err, config);
        }
      },
    },
    { name: 'feishu_mail_message' },
  );
}
