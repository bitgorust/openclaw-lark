/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_meeting_reserve tool -- manage VC meeting reservations.
 */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import { assertLarkOk, createToolContext, handleInvokeErrorWithAutoAuth, json, registerTool } from '../helpers';

const MeetingReserveSchema = Type.Union([
  Type.Object({
    action: Type.Literal('apply'),
    payload: Type.Object({}, { additionalProperties: true, description: 'Reservation payload that follows vc.reserve.apply request schema.' }),
  }),
  Type.Object({
    action: Type.Literal('get'),
    reserve_id: Type.String({ description: 'Reserve ID.' }),
  }),
  Type.Object({
    action: Type.Literal('update'),
    reserve_id: Type.String({ description: 'Reserve ID.' }),
    payload: Type.Object({}, { additionalProperties: true, description: 'Reservation update payload that follows vc.reserve.update request schema.' }),
  }),
  Type.Object({
    action: Type.Literal('delete'),
    reserve_id: Type.String({ description: 'Reserve ID.' }),
  }),
  Type.Object({
    action: Type.Literal('get_active_meeting'),
    reserve_id: Type.String({ description: 'Reserve ID.' }),
  }),
]);

type MeetingReserveParams =
  | { action: 'apply'; payload: Record<string, unknown> }
  | { action: 'get'; reserve_id: string }
  | { action: 'update'; reserve_id: string; payload: Record<string, unknown> }
  | { action: 'delete'; reserve_id: string }
  | { action: 'get_active_meeting'; reserve_id: string };

export function registerFeishuMeetingReserveTool(api: OpenClawPluginApi): boolean {
  if (!api.config) return false;
  const cfg = api.config;
  const { toolClient, log } = createToolContext(api, 'feishu_meeting_reserve');

  return registerTool(
    api,
    {
      name: 'feishu_meeting_reserve',
      label: 'Feishu Meeting Reserve',
      description:
        '飞书视频会议预约工具。支持创建、查看、更新、删除预约，以及把预约解析成进行中的 meeting。' +
        '复杂预约字段通过 payload 透传到官方 VC reserve API。',
      parameters: MeetingReserveSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as MeetingReserveParams;
        try {
          const client = toolClient();
          switch (p.action) {
            case 'apply': {
              log.info('apply: creating meeting reserve');
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting_reserve.apply',
                '/open-apis/vc/v1/reserves/apply',
                { method: 'POST', body: p.payload },
              );
              assertLarkOk(res);
              return json({ reserve: res.data ?? null });
            }
            case 'get': {
              log.info(`get: reserve_id=${p.reserve_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting_reserve.get',
                `/open-apis/vc/v1/reserves/${encodeURIComponent(p.reserve_id)}`,
                { method: 'GET' },
              );
              assertLarkOk(res);
              return json({ reserve: res.data ?? null });
            }
            case 'update': {
              log.info(`update: reserve_id=${p.reserve_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting_reserve.update',
                `/open-apis/vc/v1/reserves/${encodeURIComponent(p.reserve_id)}`,
                { method: 'PUT', body: p.payload },
              );
              assertLarkOk(res);
              return json({ reserve: res.data ?? null });
            }
            case 'delete': {
              log.info(`delete: reserve_id=${p.reserve_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting_reserve.delete',
                `/open-apis/vc/v1/reserves/${encodeURIComponent(p.reserve_id)}`,
                { method: 'DELETE' },
              );
              assertLarkOk(res);
              return json({ deleted: true, result: res.data ?? null });
            }
            case 'get_active_meeting': {
              log.info(`get_active_meeting: reserve_id=${p.reserve_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting_reserve.get_active_meeting',
                `/open-apis/vc/v1/reserves/${encodeURIComponent(p.reserve_id)}/get_active_meeting`,
                { method: 'GET' },
              );
              assertLarkOk(res);
              return json({ meeting: res.data ?? null });
            }
          }
        } catch (err) {
          return await handleInvokeErrorWithAutoAuth(err, cfg);
        }
      },
    },
    { name: 'feishu_meeting_reserve' },
  );
}
