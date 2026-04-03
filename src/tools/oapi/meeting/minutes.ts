/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_minutes tool -- read meeting minutes.
 */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import { assertLarkOk, createToolContext, handleInvokeErrorWithAutoAuth, json, registerTool } from '../helpers';

const MinutesSchema = Type.Union([
  Type.Object({
    action: Type.Literal('get'),
    minute_token: Type.String({ description: 'Minute token.' }),
  }),
  Type.Object({
    action: Type.Literal('transcript'),
    minute_token: Type.String({ description: 'Minute token.' }),
  }),
  Type.Object({
    action: Type.Literal('statistics'),
    minute_token: Type.String({ description: 'Minute token.' }),
  }),
  Type.Object({
    action: Type.Literal('artifacts'),
    minute_token: Type.String({ description: 'Minute token.' }),
  }),
  Type.Object({
    action: Type.Literal('media'),
    minute_token: Type.String({ description: 'Minute token.' }),
  }),
]);

type MinutesParams =
  | { action: 'get'; minute_token: string }
  | { action: 'transcript'; minute_token: string }
  | { action: 'statistics'; minute_token: string }
  | { action: 'artifacts'; minute_token: string }
  | { action: 'media'; minute_token: string };

function buildMinutesPath(token: string, action: MinutesParams['action']): string {
  const safeToken = encodeURIComponent(token);
  switch (action) {
    case 'get':
      return `/open-apis/minutes/v1/minutes/${safeToken}`;
    case 'transcript':
      return `/open-apis/minutes/v1/minutes/${safeToken}/transcript`;
    case 'statistics':
      return `/open-apis/minutes/v1/minutes/${safeToken}/statistics`;
    case 'artifacts':
      return `/open-apis/minutes/v1/minutes/${safeToken}/artifacts`;
    case 'media':
      return `/open-apis/minutes/v1/minutes/${safeToken}/media`;
  }
}

export function registerFeishuMinutesTool(api: OpenClawPluginApi): boolean {
  if (!api.config) return false;
  const cfg = api.config;
  const { toolClient, log } = createToolContext(api, 'feishu_minutes');

  return registerTool(
    api,
    {
      name: 'feishu_minutes',
      label: 'Feishu Minutes',
      description:
        '飞书妙记工具。支持获取妙记详情、转写、统计、制品清单和媒体导出信息。',
      parameters: MinutesSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as MinutesParams;
        try {
          const client = toolClient();
          log.info(`${p.action}: minute_token=${p.minute_token}`);
          const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
            `feishu_minutes.${p.action}`,
            buildMinutesPath(p.minute_token, p.action),
            { method: 'GET' },
          );
          assertLarkOk(res);
          return json({ result: res.data ?? null });
        } catch (err) {
          return await handleInvokeErrorWithAutoAuth(err, cfg);
        }
      },
    },
    { name: 'feishu_minutes' },
  );
}
