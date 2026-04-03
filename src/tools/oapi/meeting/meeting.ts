/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_meeting tool -- manage VC meetings and meeting notes.
 */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import { assertLarkOk, createToolContext, handleInvokeErrorWithAutoAuth, json, registerTool } from '../helpers';

const MeetingSchema = Type.Union([
  Type.Object({
    action: Type.Literal('search'),
    payload: Type.Object({}, { additionalProperties: true, description: 'Meeting search payload that follows vc.meeting.search request schema.' }),
  }),
  Type.Object({
    action: Type.Literal('get'),
    meeting_id: Type.String({ description: 'Meeting ID.' }),
  }),
  Type.Object({
    action: Type.Literal('end'),
    meeting_id: Type.String({ description: 'Meeting ID.' }),
  }),
  Type.Object({
    action: Type.Literal('get_note'),
    note_id: Type.String({ description: 'Meeting note ID.' }),
  }),
]);

type MeetingParams =
  | { action: 'search'; payload: Record<string, unknown> }
  | { action: 'get'; meeting_id: string }
  | { action: 'end'; meeting_id: string }
  | { action: 'get_note'; note_id: string };

export function registerFeishuMeetingTool(api: OpenClawPluginApi): boolean {
  if (!api.config) return false;
  const cfg = api.config;
  const { toolClient, log } = createToolContext(api, 'feishu_meeting');

  return registerTool(
    api,
    {
      name: 'feishu_meeting',
      label: 'Feishu Meeting',
      description:
        '飞书视频会议工具。支持搜索会议、查看会议详情、结束会议，以及读取会议纪要 note。',
      parameters: MeetingSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as MeetingParams;
        try {
          const client = toolClient();
          switch (p.action) {
            case 'search': {
              log.info('search: searching meetings');
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting.search',
                '/open-apis/vc/v1/meetings/search',
                { method: 'POST', body: p.payload },
              );
              assertLarkOk(res);
              return json({ result: res.data ?? null });
            }
            case 'get': {
              log.info(`get: meeting_id=${p.meeting_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting.get',
                `/open-apis/vc/v1/meetings/${encodeURIComponent(p.meeting_id)}`,
                { method: 'GET' },
              );
              assertLarkOk(res);
              return json({ meeting: res.data ?? null });
            }
            case 'end': {
              log.info(`end: meeting_id=${p.meeting_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting.end',
                `/open-apis/vc/v1/meetings/${encodeURIComponent(p.meeting_id)}/end`,
                { method: 'PATCH' },
              );
              assertLarkOk(res);
              return json({ ended: true, result: res.data ?? null });
            }
            case 'get_note': {
              log.info(`get_note: note_id=${p.note_id}`);
              const res = await client.invokeByPath<{ code?: number; msg?: string; data?: unknown }>(
                'feishu_meeting.get_note',
                `/open-apis/vc/v1/notes/${encodeURIComponent(p.note_id)}`,
                { method: 'GET' },
              );
              assertLarkOk(res);
              return json({ note: res.data ?? null });
            }
          }
        } catch (err) {
          return await handleInvokeErrorWithAutoAuth(err, cfg);
        }
      },
    },
    { name: 'feishu_meeting' },
  );
}
