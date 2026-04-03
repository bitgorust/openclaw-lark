import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInvoke = vi.fn();
const mockInvokeByPath = vi.fn();
const mockHandleInvokeErrorWithAutoAuth = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/tools/oapi/helpers', async () => {
  const actual = await vi.importActual<typeof import('../src/tools/oapi/helpers')>('../src/tools/oapi/helpers');

  return {
    ...actual,
    createToolContext: () => ({
      getClient: vi.fn(),
      toolClient: () => ({
        senderOpenId: undefined,
        invoke: mockInvoke,
        invokeByPath: mockInvokeByPath,
      }),
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    }),
    handleInvokeErrorWithAutoAuth: (...args: unknown[]) => mockHandleInvokeErrorWithAutoAuth(...args),
  };
});

import { registerFeishuMailMessageTool } from '../src/tools/oapi/mail/message';
import { registerFeishuMeetingReserveTool } from '../src/tools/oapi/meeting/reserve';
import { registerFeishuMeetingTool } from '../src/tools/oapi/meeting/meeting';
import { registerFeishuMinutesTool } from '../src/tools/oapi/meeting/minutes';

function parseToolResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

function createMockApi() {
  const registeredTools: Record<string, any> = {};

  return {
    api: {
      config: {},
      registerTool: (def: any) => {
        registeredTools[def.name] = def;
      },
      logger: { debug: vi.fn() },
    },
    registeredTools,
  };
}

describe('mail and meeting tool execute path', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists mailbox messages', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuMailMessageTool(api as any);

    mockInvoke.mockResolvedValueOnce({
      code: 0,
      data: {
        items: ['msg_1', 'msg_2'],
        has_more: true,
        page_token: 'next-mail',
      },
    });

    const result = await registeredTools.feishu_mail_message.execute('mail-1', {
      action: 'list',
      user_mailbox_id: 'alice@example.com',
      folder_id: 'inbox',
      only_unread: true,
      page_size: 20,
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      'feishu_mail_message.list',
      expect.any(Function),
      undefined,
    );

    expect(parseToolResult(result)).toEqual({
      user_mailbox_id: 'alice@example.com',
      folder_id: 'inbox',
      has_more: true,
      page_token: 'next-mail',
      message_ids: ['msg_1', 'msg_2'],
    });
  });

  it('sends mailbox message', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuMailMessageTool(api as any);

    mockInvoke.mockResolvedValueOnce({
      code: 0,
      data: {
        message_id: 'mail_msg_1',
        thread_id: 'thread_1',
      },
    });

    const result = await registeredTools.feishu_mail_message.execute('mail-2', {
      action: 'send',
      user_mailbox_id: 'alice@example.com',
      to: [{ mail_address: 'bob@example.com', name: 'Bob' }],
      subject: 'Weekly update',
      body_plain_text: 'done',
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      'feishu_mail_message.send',
      expect.any(Function),
      undefined,
    );

    expect(parseToolResult(result)).toEqual({
      message_id: 'mail_msg_1',
      thread_id: 'thread_1',
    });
  });

  it('gets active meeting from reserve', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuMeetingReserveTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        meeting: {
          id: 'om_1',
          topic: 'Project sync',
        },
      },
    });

    const result = await registeredTools.feishu_meeting_reserve.execute('meeting-reserve-1', {
      action: 'get_active_meeting',
      reserve_id: 'reserve_1',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_meeting_reserve.get_active_meeting',
      '/open-apis/vc/v1/reserves/reserve_1/get_active_meeting',
      { method: 'GET' },
    );

    expect(parseToolResult(result)).toEqual({
      meeting: {
        meeting: {
          id: 'om_1',
          topic: 'Project sync',
        },
      },
    });
  });

  it('gets meeting detail', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuMeetingTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        meeting: {
          id: 'om_1',
          topic: 'Project sync',
        },
      },
    });

    const result = await registeredTools.feishu_meeting.execute('meeting-1', {
      action: 'get',
      meeting_id: 'om_1',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_meeting.get',
      '/open-apis/vc/v1/meetings/om_1',
      { method: 'GET' },
    );

    expect(parseToolResult(result)).toEqual({
      meeting: {
        meeting: {
          id: 'om_1',
          topic: 'Project sync',
        },
      },
    });
  });

  it('gets minute transcript', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuMinutesTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        text: 'hello',
      },
    });

    const result = await registeredTools.feishu_minutes.execute('minutes-1', {
      action: 'transcript',
      minute_token: 'minute_1',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_minutes.transcript',
      '/open-apis/minutes/v1/minutes/minute_1/transcript',
      { method: 'GET' },
    );

    expect(parseToolResult(result)).toEqual({
      result: {
        text: 'hello',
      },
    });
  });
});
